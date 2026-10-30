const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const rehearsalController = require('../controllers/rehearsalController');
const attendanceController = require('../controllers/attendanceController');
const pollController = require('../controllers/pollController');
const calendarController = require('../controllers/calendarController');
const User = require('../models/User');
const Message = require('../models/Message');
const News = require('../models/News');
const paymentController = require('../controllers/paymentController');
const env = require('../config/env');
const { pool } = require('../config/database');

// All musician routes require authentication
router.use(authenticate);

// Client-visible feature flags
router.get('/config', (req, res) => {
  res.json({ success: true, data: { paymentsEnabled: !!env.paymentsEnabled } });
});

// Keepalive (online status)
router.post('/keepalive', async (req, res) => {
  try {
    await pool.execute(
      `INSERT INTO user_sessions (user_id, last_seen_at) VALUES (?, NOW())
       ON DUPLICATE KEY UPDATE last_seen_at = NOW()`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Keepalive error:', error);
    res.status(500).json({ success: false });
  }
});

// Profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load profile' });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    const allowed = ['name', 'instrument', 'part', 'birthdate', 'phone', 'profile_picture', 'bio', 'show_in_directory'];
    const fields = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    const updated = await User.update(req.user.id, fields);
    res.json({ success: true, data: updated, message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Musician directory (visible to any authenticated member)
router.get('/directory', async (req, res) => {
  try {
    const musicians = await User.findDirectory();
    res.json({ success: true, data: musicians });
  } catch (error) {
    console.error('Directory error:', error);
    res.status(500).json({ success: false, message: 'Failed to load directory' });
  }
});

// Seasons (active only for musicians)
const Season = require('../models/Season');
router.get('/seasons', async (req, res) => {
  try {
    const seasons = await Season.findAllActive();
    res.json({ success: true, data: seasons });
  } catch (error) {
    console.error('Season list error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch seasons' });
  }
});

// Rehearsals
router.get('/rehearsals', rehearsalController.upcoming);
router.get('/seasons/:seasonId/rehearsals', rehearsalController.listBySeasonUpcoming);

// Date polls ("Doodle") — the controller decides who a poll is addressed to
router.get('/polls', pollController.myOpenPolls);
router.get('/polls/:id', pollController.getForVoter);
router.post('/polls/:id/vote', pollController.vote);

// Calendar export (.ics) of the rehearsals this musician accepted
router.get('/seasons/:seasonId/calendar.ics', calendarController.mySeasonCalendar);

// Attendance
router.post('/attendance', attendanceController.upsert);
router.get('/attendance', attendanceController.myAttendance);

// Inbox
router.get('/inbox', async (req, res) => {
  try {
    const messages = await Message.findActiveForUser(req.user.id);
    const unreadCount = await Message.unreadCount(req.user.id);
    res.json({ success: true, data: { messages, unreadCount } });
  } catch (error) {
    console.error('Inbox error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch inbox' });
  }
});

router.get('/inbox/unread-count', async (req, res) => {
  try {
    const count = await Message.unreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch unread count' });
  }
});

router.post('/inbox/:messageId/read', async (req, res) => {
  try {
    await Message.markRead(req.params.messageId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to mark as read' });
  }
});

// News
router.get('/news', async (req, res) => {
  try {
    const articles = await News.findActiveForUser(req.user.id);
    const unreadCount = await News.unreadCount(req.user.id);
    res.json({ success: true, data: { articles, unreadCount } });
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch news' });
  }
});

router.get('/news/unread-count', async (req, res) => {
  try {
    const count = await News.unreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('News unread count error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch unread count' });
  }
});

router.post('/news/:newsId/read', async (req, res) => {
  try {
    await News.markRead(req.params.newsId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark news read error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to mark as read' });
  }
});

// Issue a SEPA transfer payment intent (IBAN, structured comm, EPC QR code)
router.get('/payments/:seasonId/transfer', paymentController.issue);

// Payment status (for the logged-in musician)
router.get('/payments', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT season_id, paid FROM season_payments WHERE user_id = ?',
      [req.user.id]
    );
    const map = {};
    rows.forEach((r) => { map[r.season_id] = !!r.paid; });
    res.json({ success: true, data: map });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch payment status' });
  }
});

module.exports = router;
