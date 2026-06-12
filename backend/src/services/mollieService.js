const { createMollieClient } = require('@mollie/api-client');
const env = require('../config/env');

let client = null;

function getClient() {
  if (client) return client;
  if (!env.mollie.apiKey) {
    throw new Error('MOLLIE_API_KEY is not configured');
  }
  client = createMollieClient({ apiKey: env.mollie.apiKey });
  return client;
}

// Offer Bancontact and Wero on the Mollie checkout page so the user can pick.
async function createPayment({ amount, description, userId, seasonId }) {
  const mollie = getClient();
  const payment = await mollie.payments.create({
    amount: {
      currency: 'EUR',
      value: Number(amount).toFixed(2),
    },
    description,
    method: ['bancontact', 'wero'],
    redirectUrl: `${env.frontendUrl}/payment/return?seasonId=${seasonId}`,
    webhookUrl: `${env.backendUrl}/api/payments/webhook`,
    metadata: { userId, seasonId },
  });
  return payment;
}

async function getPayment(molliePaymentId) {
  const mollie = getClient();
  return mollie.payments.get(molliePaymentId);
}

module.exports = { createPayment, getPayment };
