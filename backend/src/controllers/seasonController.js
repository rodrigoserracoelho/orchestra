const Season = require('../models/Season');

const seasonController = {
  async list(req, res) {
    try {
      const seasons = await Season.findAll();
      res.json({ success: true, data: seasons });
    } catch (error) {
      console.error('Season list error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch seasons' });
    }
  },

  async get(req, res) {
    try {
      const season = await Season.findById(req.params.id);
      if (!season) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Season not found' });
      }
      res.json({ success: true, data: season });
    } catch (error) {
      console.error('Season get error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch season' });
    }
  },

  async create(req, res) {
    try {
      const { name, maestro, maestro_id, active, season_fee, concerts } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'validation', message: 'Name is required' });
      }
      if (!concerts || concerts.length === 0) {
        return res.status(400).json({ success: false, error: 'validation', message: 'At least one concert date is required' });
      }
      const season = await Season.create({ name, maestro, maestro_id, active, season_fee, concerts, created_by: req.user.id });
      res.status(201).json({ success: true, data: season, message: 'Season created' });
    } catch (error) {
      console.error('Season create error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to create season' });
    }
  },

  async update(req, res) {
    try {
      const season = await Season.findById(req.params.id);
      if (!season) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Season not found' });
      }
      const updated = await Season.update(req.params.id, req.body);
      res.json({ success: true, data: updated, message: 'Season updated' });
    } catch (error) {
      console.error('Season update error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to update season' });
    }
  },

  async delete(req, res) {
    try {
      const season = await Season.findById(req.params.id);
      if (!season) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Season not found' });
      }
      await Season.delete(req.params.id);
      res.json({ success: true, message: 'Season deleted' });
    } catch (error) {
      console.error('Season delete error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to delete season' });
    }
  },
};

module.exports = seasonController;
