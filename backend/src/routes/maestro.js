const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const Season = require('../models/Season');
const Attendance = require('../models/Attendance');
const Rehearsal = require('../models/Rehearsal');
const Message = require('../models/Message');
const upload = require('../middleware/upload');

// All maestro routes require authentication + maestro role
router.use(authenticate, requireRole('maestro'));

// Seasons assigned to this maestro
router.get('/seasons', async (req, res) => {
  try {
    const seasons = await Season.findByMaestroId(req.user.id);
    res.json({ success: true, data: seasons });
  } catch (error) {
    console.error('Maestro seasons error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch seasons' });
  }
});

// Rehearsals for a season (only if maestro owns it)
router.get('/seasons/:seasonId/rehearsals', async (req, res) => {
  try {
    const season = await Season.findById(req.params.seasonId);
    if (!season || season.maestro_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'forbidden', message: 'Not your season' });
    }
    const rehearsals = await Rehearsal.findBySeasonId(req.params.seasonId);
    res.json({ success: true, data: rehearsals });
  } catch (error) {
    console.error('Maestro rehearsals error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch rehearsals' });
  }
});

// Attendance for a rehearsal (only if maestro owns the season)
router.get('/rehearsals/:id/attendance', async (req, res) => {
  try {
    const rehearsal = await Rehearsal.findById(req.params.id);
    if (!rehearsal) {
      return res.status(404).json({ success: false, error: 'not_found', message: 'Rehearsal not found' });
    }
    const season = await Season.findById(rehearsal.season_id);
    if (!season || season.maestro_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'forbidden', message: 'Not your season' });
    }
    const [responses, summary] = await Promise.all([
      Attendance.findByRehearsal(req.params.id),
      Attendance.getSummaryByRehearsal(req.params.id),
    ]);
    res.json({ success: true, data: { rehearsal, responses, summary } });
  } catch (error) {
    console.error('Maestro attendance error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch attendance' });
  }
});

// Season attendance grid (only if maestro owns it)
router.get('/seasons/:seasonId/attendance', async (req, res) => {
  try {
    const season = await Season.findById(req.params.seasonId);
    if (!season || season.maestro_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'forbidden', message: 'Not your season' });
    }
    const rows = await Attendance.getSeasonSummary(req.params.seasonId);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Maestro season grid error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch attendance grid' });
  }
});

// Messages — maestro can send
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.findAll();
    const totalMusicians = await Message.getTotalMusicians();
    res.json({ success: true, data: { messages, totalMusicians } });
  } catch (error) {
    console.error('Maestro message list error:', error);
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
    console.error('Maestro message create error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to create message' });
  }
});

module.exports = router;
