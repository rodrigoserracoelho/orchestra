const Rehearsal = require('../models/Rehearsal');
const Season = require('../models/Season');

const rehearsalController = {
  async listBySeason(req, res) {
    try {
      const season = await Season.findById(req.params.seasonId);
      if (!season) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Season not found' });
      }
      const rehearsals = await Rehearsal.findBySeasonId(req.params.seasonId);
      res.json({ success: true, data: rehearsals });
    } catch (error) {
      console.error('Rehearsal list error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch rehearsals' });
    }
  },

  async get(req, res) {
    try {
      const rehearsal = await Rehearsal.findById(req.params.id);
      if (!rehearsal) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Rehearsal not found' });
      }
      res.json({ success: true, data: rehearsal });
    } catch (error) {
      console.error('Rehearsal get error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch rehearsal' });
    }
  },

  async create(req, res) {
    try {
      const { season_id, title, location, rehearsal_date, duration_minutes, notes } = req.body;
      if (!season_id || !title || !rehearsal_date) {
        return res.status(400).json({ success: false, error: 'validation', message: 'Season ID, title, and date are required' });
      }
      const season = await Season.findById(season_id);
      if (!season) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Season not found' });
      }
      const rehearsal = await Rehearsal.create({ season_id, title, location, rehearsal_date, duration_minutes, notes });
      res.status(201).json({ success: true, data: rehearsal, message: 'Rehearsal created' });
    } catch (error) {
      console.error('Rehearsal create error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to create rehearsal' });
    }
  },

  async createBulk(req, res) {
    try {
      const { season_id, rehearsals } = req.body;
      if (!season_id || !rehearsals || rehearsals.length === 0) {
        return res.status(400).json({ success: false, error: 'validation', message: 'Season ID and rehearsals array are required' });
      }
      const season = await Season.findById(season_id);
      if (!season) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Season not found' });
      }
      const created = [];
      for (const r of rehearsals) {
        const rehearsal = await Rehearsal.create({
          season_id,
          title: r.title,
          location: r.location || null,
          rehearsal_date: r.rehearsal_date,
          duration_minutes: r.duration_minutes || 120,
          notes: r.notes || null,
        });
        created.push(rehearsal);
      }
      res.status(201).json({ success: true, data: created, message: `${created.length} rehearsals created` });
    } catch (error) {
      console.error('Rehearsal bulk create error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to create rehearsals' });
    }
  },

  async update(req, res) {
    try {
      const rehearsal = await Rehearsal.findById(req.params.id);
      if (!rehearsal) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Rehearsal not found' });
      }
      const updated = await Rehearsal.update(req.params.id, req.body);
      res.json({ success: true, data: updated, message: 'Rehearsal updated' });
    } catch (error) {
      console.error('Rehearsal update error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to update rehearsal' });
    }
  },

  async delete(req, res) {
    try {
      const rehearsal = await Rehearsal.findById(req.params.id);
      if (!rehearsal) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Rehearsal not found' });
      }
      await Rehearsal.delete(req.params.id);
      res.json({ success: true, message: 'Rehearsal deleted' });
    } catch (error) {
      console.error('Rehearsal delete error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to delete rehearsal' });
    }
  },

  async upcoming(req, res) {
    try {
      const rehearsals = await Rehearsal.findUpcoming();
      res.json({ success: true, data: rehearsals });
    } catch (error) {
      console.error('Upcoming rehearsals error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch rehearsals' });
    }
  },
};

module.exports = rehearsalController;
