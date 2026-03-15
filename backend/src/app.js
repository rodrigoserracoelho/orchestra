const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const musicianRoutes = require('./routes/musician');
const publicRoutes = require('./routes/public');
const maestroRoutes = require('./routes/maestro');
const sectionLeaderRoutes = require('./routes/sectionLeader');

const app = express();

// Trust the Nginx reverse proxy (needed for rate limiting & real client IPs)
app.set('trust proxy', 1);

// CORS — in production the frontend is served by this same server,
// but we keep CORS for development (Vite proxy on a different port).
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { success: false, error: 'rate_limit', message: 'Too many requests, please try again later.' },
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Orchestra Attendance API is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/musician', musicianRoutes);
app.use('/api/maestro', maestroRoutes);
app.use('/api/section-leader', sectionLeaderRoutes);
app.use('/api/public', publicRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Serve React frontend (production) ---
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Any non-API route → serve index.html (React SPA client-side routing)
app.get('*', (req, res, next) => {
  // Don't catch API routes that weren't matched above
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// API 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'not_found', message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'server_error',
    message: env.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

module.exports = app;
