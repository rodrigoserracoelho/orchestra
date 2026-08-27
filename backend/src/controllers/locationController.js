const Location = require('../models/Location');

const locationController = {
  async list(req, res) {
    try {
      const locations = await Location.findAll();
      res.json({ success: true, data: locations });
    } catch (error) {
      console.error('Location list error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch locations' });
    }
  },

  async get(req, res) {
    try {
      const location = await Location.findById(req.params.id);
      if (!location) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Location not found' });
      }
      res.json({ success: true, data: location });
    } catch (error) {
      console.error('Location get error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch location' });
    }
  },

  async create(req, res) {
    try {
      const { name, address, notes, active } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, error: 'validation', message: 'Name is required' });
      }
      const location = await Location.create({ name: String(name).trim(), address, notes, active });
      res.status(201).json({ success: true, data: location, message: 'Location created' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'duplicate', message: 'A location with this name already exists' });
      }
      console.error('Location create error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to create location' });
    }
  },

  async update(req, res) {
    try {
      const location = await Location.findById(req.params.id);
      if (!location) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Location not found' });
      }
      const fields = { ...req.body };
      if (fields.name !== undefined) {
        if (!String(fields.name).trim()) {
          return res.status(400).json({ success: false, error: 'validation', message: 'Name is required' });
        }
        fields.name = String(fields.name).trim();
      }
      const updated = await Location.update(req.params.id, fields);
      res.json({ success: true, data: updated, message: 'Location updated' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'duplicate', message: 'A location with this name already exists' });
      }
      console.error('Location update error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to update location' });
    }
  },

  async delete(req, res) {
    try {
      const location = await Location.findById(req.params.id);
      if (!location) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Location not found' });
      }
      const inUse = await Location.rehearsalCount(req.params.id);
      if (inUse > 0) {
        return res.status(409).json({
          success: false,
          error: 'in_use',
          message: `This location is used by ${inUse} rehearsal(s). Deactivate it instead to hide it from new rehearsals.`,
          data: { rehearsals: inUse },
        });
      }
      await Location.delete(req.params.id);
      res.json({ success: true, message: 'Location deleted' });
    } catch (error) {
      console.error('Location delete error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to delete location' });
    }
  },
};

module.exports = locationController;
