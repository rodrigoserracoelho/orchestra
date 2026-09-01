const Attendance = require('../models/Attendance');
const Season = require('../models/Season');
const { buildCalendar } = require('../services/icsService');

// Filenames travel through a header; keep them boring.
function safeFilename(name) {
  return String(name || 'rehearsals')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'rehearsals';
}

const calendarController = {
  // The rehearsals this musician has accepted, as a downloadable .ics
  async mySeasonCalendar(req, res) {
    try {
      const season = await Season.findById(req.params.seasonId);
      if (!season) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Season not found' });
      }
      const events = await Attendance.findAcceptedInSeason(req.user.id, req.params.seasonId);
      const ics = buildCalendar(events, {
        calendarName: season.name,
        host: req.hostname || 'orchestra',
      });
      const filename = `${safeFilename(season.name)}.ics`;
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Event-Count', String(events.length));
      res.send(ics);
    } catch (error) {
      console.error('Calendar export error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to build the calendar' });
    }
  },
};

module.exports = calendarController;
