const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const seasonController = require('../controllers/seasonController');
const rehearsalController = require('../controllers/rehearsalController');
const attendanceController = require('../controllers/attendanceController');
const User = require('../models/User');
const Message = require('../models/Message');
const News = require('../models/News');
const Page = require('../models/Page');
const upload = require('../middleware/upload');
const { uploadMemory } = require('../middleware/upload');
const { pool } = require('../config/database');

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// Stats
router.get('/stats', async (req, res) => {
  try {
    const [emailRows] = await pool.execute('SELECT COUNT(*) AS count FROM email_log WHERE success = TRUE');
    res.json({ success: true, data: { emailsSent: emailRows[0].count } });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch stats' });
  }
});

// Seasons
router.get('/seasons', seasonController.list);
router.get('/seasons/:id', seasonController.get);
router.post('/seasons', seasonController.create);
router.patch('/seasons/:id', seasonController.update);
router.delete('/seasons/:id', seasonController.delete);

// Rehearsals
router.get('/seasons/:seasonId/rehearsals', rehearsalController.listBySeason);
router.post('/rehearsals', rehearsalController.create);
router.post('/rehearsals/bulk', rehearsalController.createBulk);
router.get('/rehearsals/:id', rehearsalController.get);
router.patch('/rehearsals/:id', rehearsalController.update);
router.delete('/rehearsals/:id', rehearsalController.delete);

// Attendance
router.get('/rehearsals/:id/attendance', attendanceController.byRehearsal);
router.get('/seasons/:seasonId/attendance', attendanceController.seasonGrid);

// Payments
router.get('/seasons/:seasonId/payments', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT sp.*, u.name, u.email, u.instrument, u.part
       FROM season_payments sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.season_id = ?
       ORDER BY u.name`,
      [req.params.seasonId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Payment list error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch payments' });
  }
});

router.post('/seasons/:seasonId/payments/:userId', async (req, res) => {
  try {
    const { paid } = req.body;
    const { seasonId, userId } = req.params;
    await pool.execute(
      `INSERT INTO season_payments (season_id, user_id, paid, paid_at, marked_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE paid = VALUES(paid), paid_at = VALUES(paid_at), marked_by = VALUES(marked_by)`,
      [seasonId, userId, paid, paid ? new Date() : null, req.user.id]
    );
    res.json({ success: true, message: paid ? 'Marked as paid' : 'Marked as unpaid' });
  } catch (error) {
    console.error('Payment toggle error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to update payment' });
  }
});

// Messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.findAll();
    const totalMusicians = await Message.getTotalMusicians();
    res.json({ success: true, data: { messages, totalMusicians } });
  } catch (error) {
    console.error('Message list error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch messages' });
  }
});

router.post('/messages', upload.single('cover_image'), async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'validation', message: 'Title and body are required' });
    }
    const cover_image = req.file ? `/uploads/${req.file.filename}` : null;
    const message = await Message.create({ title, body, cover_image, created_by: req.user.id });
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Message create error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to create message' });
  }
});

router.patch('/messages/:id', upload.single('cover_image'), async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, error: 'not_found', message: 'Message not found' });
    const fields = { ...req.body };
    if (fields.active !== undefined) fields.active = fields.active === 'true' || fields.active === true;
    if (req.file) fields.cover_image = `/uploads/${req.file.filename}`;
    if (fields.remove_image === 'true') { fields.cover_image = null; delete fields.remove_image; }
    delete fields.remove_image;
    const updated = await Message.update(req.params.id, fields);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Message update error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to update message' });
  }
});

router.delete('/messages/:id', async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, error: 'not_found', message: 'Message not found' });
    await Message.delete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Message delete error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to delete message' });
  }
});

router.get('/messages/:id/readers', async (req, res) => {
  try {
    const readers = await Message.getReaders(req.params.id);
    res.json({ success: true, data: readers });
  } catch (error) {
    console.error('Message readers error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch readers' });
  }
});

// News (articles / blog posts)
router.get('/news', async (req, res) => {
  try {
    const articles = await News.findAll();
    const totalMusicians = await News.getTotalMusicians();
    res.json({ success: true, data: { articles, totalMusicians } });
  } catch (error) {
    console.error('News list error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch news' });
  }
});

router.post('/news', uploadMemory.single('cover_image'), async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'validation', message: 'Title and body are required' });
    }
    const cover_image = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;
    const article = await News.create({ title, body, cover_image, created_by: req.user.id });
    res.status(201).json({ success: true, data: article });
  } catch (error) {
    console.error('News create error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to create article' });
  }
});

router.patch('/news/:id', uploadMemory.single('cover_image'), async (req, res) => {
  try {
    const article = await News.findById(req.params.id);
    if (!article) return res.status(404).json({ success: false, error: 'not_found', message: 'Article not found' });
    const fields = { ...req.body };
    if (fields.active !== undefined) fields.active = fields.active === 'true' || fields.active === true;
    if (req.file) fields.cover_image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    if (fields.remove_image === 'true') { fields.cover_image = null; delete fields.remove_image; }
    delete fields.remove_image;
    const updated = await News.update(req.params.id, fields);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('News update error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to update article' });
  }
});

router.delete('/news/:id', async (req, res) => {
  try {
    const article = await News.findById(req.params.id);
    if (!article) return res.status(404).json({ success: false, error: 'not_found', message: 'Article not found' });
    await News.delete(req.params.id);
    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    console.error('News delete error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to delete article' });
  }
});

router.get('/news/:id/readers', async (req, res) => {
  try {
    const readers = await News.getReaders(req.params.id);
    res.json({ success: true, data: readers });
  } catch (error) {
    console.error('News readers error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch readers' });
  }
});

// Musicians
router.get('/musicians', async (req, res) => {
  try {
    const musicians = await User.findAll();
    res.json({ success: true, data: musicians });
  } catch (error) {
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch musicians' });
  }
});

router.post('/musicians', async (req, res) => {
  try {
    const { name, email, instrument, part, birthdate, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'validation', message: 'Name and email are required' });
    }
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'duplicate', message: 'A user with this email already exists' });
    }
    const musician = await User.create({ email, name, instrument, part, birthdate, phone, role: 'musician' });
    res.status(201).json({ success: true, data: musician, message: 'Musician created' });
  } catch (error) {
    console.error('Musician create error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to create musician' });
  }
});

router.patch('/musicians/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'not_found', message: 'Musician not found' });
    }
    const updated = await User.update(req.params.id, req.body);
    res.json({ success: true, data: updated, message: 'Musician updated' });
  } catch (error) {
    console.error('Musician update error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to update musician' });
  }
});

router.delete('/musicians/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'not_found', message: 'Musician not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden', message: 'Cannot delete an admin user' });
    }
    await User.delete(req.params.id);
    res.json({ success: true, message: 'Musician deleted' });
  } catch (error) {
    console.error('Musician delete error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to delete musician' });
  }
});

// Pages (CMS)
router.get('/pages', async (req, res) => {
  try {
    const pages = await Page.findAll();
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error('Page list error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch pages' });
  }
});

router.post('/pages', uploadMemory.single('cover_image'), async (req, res) => {
  try {
    const { slug, title, body, sort_order, active, show_in_nav } = req.body;
    if (!slug || !title || !body) {
      return res.status(400).json({ success: false, error: 'validation', message: 'Slug, title and body are required' });
    }
    const cover_image = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;
    const page = await Page.create({
      slug, title, body, cover_image,
      sort_order: sort_order ? parseInt(sort_order) : 0,
      active: active === 'true' || active === true,
      show_in_nav: show_in_nav !== 'false' && show_in_nav !== false,
      created_by: req.user.id,
    });
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'duplicate', message: 'A page with this slug already exists' });
    }
    console.error('Page create error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to create page' });
  }
});

router.patch('/pages/:id', uploadMemory.single('cover_image'), async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, error: 'not_found', message: 'Page not found' });
    const fields = { ...req.body };
    if (fields.active !== undefined) fields.active = fields.active === 'true' || fields.active === true;
    if (fields.show_in_nav !== undefined) fields.show_in_nav = fields.show_in_nav === 'true' || fields.show_in_nav === true;
    if (fields.sort_order !== undefined) fields.sort_order = parseInt(fields.sort_order);
    if (req.file) fields.cover_image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    if (fields.remove_image === 'true') { fields.cover_image = null; delete fields.remove_image; }
    delete fields.remove_image;
    const updated = await Page.update(req.params.id, fields);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'duplicate', message: 'A page with this slug already exists' });
    }
    console.error('Page update error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to update page' });
  }
});

router.delete('/pages/:id', async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, error: 'not_found', message: 'Page not found' });
    await Page.delete(req.params.id);
    res.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    console.error('Page delete error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to delete page' });
  }
});

module.exports = router;
