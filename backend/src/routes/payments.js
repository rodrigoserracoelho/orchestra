// Public payment routes — webhook is unauthenticated (Mollie calls it server-to-server).
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Mollie posts here when a payment's state changes.
router.post('/webhook', paymentController.webhook);

module.exports = router;
