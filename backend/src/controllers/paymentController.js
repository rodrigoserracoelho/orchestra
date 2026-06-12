const { pool } = require('../config/database');
const env = require('../config/env');
const MolliePayment = require('../models/MolliePayment');
const Season = require('../models/Season');
const mollieService = require('../services/mollieService');

const paymentController = {
  // Authenticated musician initiates a Bancontact payment for a season fee.
  async initiate(req, res) {
    try {
      if (!env.paymentsEnabled) {
        return res.status(403).json({ success: false, error: 'disabled', message: 'Online payments are disabled' });
      }
      const seasonId = parseInt(req.params.seasonId, 10);
      const season = await Season.findById(seasonId);
      if (!season) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Season not found' });
      }
      if (!season.season_fee || Number(season.season_fee) <= 0) {
        return res.status(400).json({ success: false, error: 'no_fee', message: 'This season has no fee configured' });
      }

      const [paid] = await pool.execute(
        'SELECT paid FROM season_payments WHERE user_id = ? AND season_id = ?',
        [req.user.id, seasonId]
      );
      if (paid[0]?.paid) {
        return res.status(400).json({ success: false, error: 'already_paid', message: 'Already paid' });
      }

      const payment = await mollieService.createPayment({
        amount: season.season_fee,
        description: `Orchestra season ${season.name}`,
        userId: req.user.id,
        seasonId,
      });

      await MolliePayment.create({
        user_id: req.user.id,
        season_id: seasonId,
        mollie_payment_id: payment.id,
        amount: season.season_fee,
        checkout_url: payment.getCheckoutUrl(),
      });

      res.json({ success: true, data: { checkoutUrl: payment.getCheckoutUrl() } });
    } catch (error) {
      console.error('Payment initiate error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to start payment' });
    }
  },

  // Mollie webhook — called server-to-server when a payment changes state.
  // Mollie posts only the payment id; we must fetch the current status from Mollie.
  async webhook(req, res) {
    try {
      const molliePaymentId = req.body.id;
      if (!molliePaymentId) {
        return res.status(400).send('Missing id');
      }

      const record = await MolliePayment.findByMollieId(molliePaymentId);
      if (!record) {
        // Unknown payment — acknowledge so Mollie stops retrying.
        return res.status(200).send('OK');
      }

      const payment = await mollieService.getPayment(molliePaymentId);
      await MolliePayment.updateStatus(molliePaymentId, payment.status, payment);

      if (payment.status === 'paid') {
        await pool.execute(
          `INSERT INTO season_payments (season_id, user_id, paid, paid_at)
           VALUES (?, ?, TRUE, NOW())
           ON DUPLICATE KEY UPDATE paid = TRUE, paid_at = NOW()`,
          [record.season_id, record.user_id]
        );
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Payment webhook error:', error);
      // Return 500 so Mollie retries.
      res.status(500).send('Error');
    }
  },

  // Authenticated user polls this after returning from Mollie to see live status.
  async status(req, res) {
    try {
      const seasonId = parseInt(req.params.seasonId, 10);
      const record = await MolliePayment.findLatestForUserSeason(req.user.id, seasonId);
      if (!record) {
        return res.json({ success: true, data: { status: 'none' } });
      }
      res.json({
        success: true,
        data: {
          status: record.status,
          amount: record.amount,
          paid_at: record.paid_at,
        },
      });
    } catch (error) {
      console.error('Payment status error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch payment status' });
    }
  },
};

module.exports = paymentController;
