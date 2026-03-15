const Attendance = require('../models/Attendance');
const Rehearsal = require('../models/Rehearsal');

const attendanceController = {
  // Musician: mark or update attendance
  async upsert(req, res) {
    try {
      const { rehearsal_id, status, notes } = req.body;
      if (!rehearsal_id || !status) {
        return res.status(400).json({ success: false, error: 'validation', message: 'Rehearsal ID and status are required' });
      }
      if (!['attending', 'not_attending', 'maybe'].includes(status)) {
        return res.status(400).json({ success: false, error: 'validation', message: 'Status must be attending, not_attending, or maybe' });
      }

      const rehearsal = await Rehearsal.findById(rehearsal_id);
      if (!rehearsal) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Rehearsal not found' });
      }

      const attendance = await Attendance.upsert({
        rehearsal_id,
        user_id: req.user.id,
        status,
        notes,
      });

      res.json({ success: true, data: attendance, message: 'Attendance updated' });
    } catch (error) {
      console.error('Attendance upsert error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to update attendance' });
    }
  },

  // Musician: get own attendance history
  async myAttendance(req, res) {
    try {
      const records = await Attendance.findByUser(req.user.id);
      res.json({ success: true, data: records });
    } catch (error) {
      console.error('My attendance error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch attendance' });
    }
  },

  // Admin: get attendance for a rehearsal
  async byRehearsal(req, res) {
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
      console.error('Attendance by rehearsal error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch attendance' });
    }
  },

  // Admin: get full season attendance grid
  async seasonGrid(req, res) {
    try {
      const rows = await Attendance.getSeasonSummary(req.params.seasonId);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Season grid error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch attendance grid' });
    }
  },
};

module.exports = attendanceController;
