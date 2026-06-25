const { pool } = require('../config/database');
const env = require('../config/env');
const Season = require('../models/Season');
const SepaPayment = require('../models/SepaPayment');
const sepaService = require('../services/sepaService');

const paymentController = {
  // Issue (or re-issue) a SEPA payment intent for the given season.
  // Returns the IBAN, beneficiary, amount, structured communication, and EPC QR code.
  async issue(req, res) {
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

      // Already manually marked paid by an admin? Don't reissue.
      const [paid] = await pool.execute(
        'SELECT paid FROM season_payments WHERE user_id = ? AND season_id = ?',
        [req.user.id, seasonId]
      );
      if (paid[0]?.paid) {
        return res.status(400).json({ success: false, error: 'already_paid', message: 'Already paid' });
      }

      // Reuse an existing pending intent so the same communication keeps matching.
      let pending = await SepaPayment.findPending(req.user.id, seasonId);
      if (!pending) {
        const id = await SepaPayment.createPending({
          user_id: req.user.id,
          season_id: seasonId,
          amount: season.season_fee,
        });
        const comm = sepaService.buildStructuredCommunication(id);
        await SepaPayment.setCommunication(id, comm);
        pending = { id, amount: season.season_fee, structured_communication: comm };
      }

      const artifacts = await sepaService.buildPaymentArtifacts({
        paymentId: pending.id,
        amount: pending.amount,
      });

      res.json({ success: true, data: artifacts });
    } catch (error) {
      console.error('Payment issue error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to issue payment' });
    }
  },
};

module.exports = paymentController;
