const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Season = require('../models/Season');
const { pool } = require('../config/database');

// Pages — navigation list (id, slug, title only)
router.get('/pages', async (req, res) => {
  try {
    const pages = await Page.findAllActive();
    // Return lightweight list for nav (no body/cover_image)
    const nav = pages.map((p) => ({ id: p.id, slug: p.slug, title: p.title, show_in_nav: p.show_in_nav }));
    res.json({ success: true, data: { pages, nav } });
  } catch (error) {
    console.error('Public pages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pages' });
  }
});

// Single page by slug
router.get('/pages/:slug', async (req, res) => {
  try {
    const page = await Page.findBySlug(req.params.slug);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Public page error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch page' });
  }
});

// Upcoming concerts (from active seasons with future concert dates)
router.get('/concerts', async (req, res) => {
  try {
    const seasons = await Season.findAllActive();
    const now = new Date();
    // Flatten concerts with season info, only future ones
    const concerts = [];
    for (const season of seasons) {
      for (const c of (season.concerts || [])) {
        const concertDate = new Date(c.concert_date);
        if (concertDate >= now) {
          concerts.push({
            id: c.id,
            season_name: season.name,
            maestro: season.maestro,
            concert_date: c.concert_date,
            label: c.label,
            venue: c.venue,
            venue_address: c.venue_address,
          });
        }
      }
    }
    concerts.sort((a, b) => new Date(a.concert_date) - new Date(b.concert_date));
    res.json({ success: true, data: concerts });
  } catch (error) {
    console.error('Public concerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch concerts' });
  }
});

// Public news (active articles, no read tracking)
router.get('/news', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT n.id, n.title, n.body, n.cover_image, n.created_at, u.name AS author_name
       FROM news n
       JOIN users u ON n.created_by = u.id
       WHERE n.active = TRUE
       ORDER BY n.created_at DESC
       LIMIT 20`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Public news error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
});

module.exports = router;
