const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const Season = require('../models/Season');
const Attendance = require('../models/Attendance');
const Rehearsal = require('../models/Rehearsal');

// All section leader routes require authentication + section_leader role
router.use(authenticate, requireRole('section_leader'));

// All active seasons (section leaders can see all)
router.get('/seasons', async (req, res) => {
  try {
    const seasons = await Season.findAllActive();
    res.json({ success: true, data: seasons });
  } catch (error) {
    console.error('Section leader seasons error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch seasons' });
  }
});

// Rehearsals for a season
router.get('/seasons/:seasonId/rehearsals', async (req, res) => {
  try {
    const rehearsals = await Rehearsal.findBySeasonId(req.params.seasonId);
    res.json({ success: true, data: rehearsals });
  } catch (error) {
    console.error('Section leader rehearsals error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch rehearsals' });
  }
});

// Attendance for a rehearsal
router.get('/rehearsals/:id/attendance', async (req, res) => {
  try {
    const rehearsal = await Rehearsal.findById(req.params.id);
    if (!rehearsal) {
      return res.status(404).json({ success: false, error: 'not_found', message: 'Rehearsal not found' });
    }
    const [responses, summary] = await Promise.all([
      Attendance.findByRehearsal(req.params.id),
      Attendance.getSummaryByRehearsal(req.params.id),
    ]);
    res.json({ success: true, data: { rehearsal, responses, summary } });
  } catch (error) {
    console.error('Section leader attendance error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch attendance' });
  }
});

// Season attendance grid
router.get('/seasons/:seasonId/attendance', async (req, res) => {
  try {
    const rows = await Attendance.getSeasonSummary(req.params.seasonId);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Section leader season grid error:', error);
    res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch attendance grid' });
  }
});

module.exports = router;
