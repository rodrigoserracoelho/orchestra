const QRCode = require('qrcode');
const env = require('../config/env');

// Belgian "structured communication": 12 digits = 10 data + 2 check.
// Check = data mod 97, with 0 replaced by 97.
function buildStructuredCommunication(paymentId) {
  const data = String(paymentId).padStart(10, '0');
  let check = BigInt(data) % 97n;
  if (check === 0n) check = 97n;
  return data + String(check).padStart(2, '0');
}

function formatStructuredCommunication(comm) {
  return `+++${comm.slice(0, 3)}/${comm.slice(3, 7)}/${comm.slice(7, 12)}+++`;
}

// EPC QR Code (European Payments Council) — V2 format, BIC optional.
// Belgian bank apps recognize the +++DDD/DDDD/DDDDD+++ pattern in the
// unstructured remittance field and treat it as a structured communication.
function buildEpcPayload({ beneficiaryName, iban, bic, amount, communication }) {
  const lines = [
    'BCD',
    '002',
    '1',
    'SCT',
    bic || '',
    beneficiaryName,
    iban.replace(/\s+/g, ''),
    `EUR${Number(amount).toFixed(2)}`,
    '',
    '',
    formatStructuredCommunication(communication),
  ];
  return lines.join('\n');
}

async function generateQrSvg(payload) {
  return QRCode.toString(payload, { type: 'svg', margin: 1, width: 280 });
}

function requireOrgConfig() {
  if (!env.org.iban || !env.org.beneficiaryName) {
    throw new Error('ORG_IBAN and ORG_BENEFICIARY_NAME must be configured');
  }
}

async function buildPaymentArtifacts({ paymentId, amount }) {
  requireOrgConfig();
  const communication = buildStructuredCommunication(paymentId);
  const payload = buildEpcPayload({
    beneficiaryName: env.org.beneficiaryName,
    iban: env.org.iban,
    bic: env.org.bic,
    amount,
    communication,
  });
  const qrSvg = await generateQrSvg(payload);
  return {
    communication,
    communicationFormatted: formatStructuredCommunication(communication),
    iban: env.org.iban,
    bic: env.org.bic || null,
    beneficiaryName: env.org.beneficiaryName,
    amount: Number(amount).toFixed(2),
    qrSvg,
  };
}

module.exports = { buildPaymentArtifacts, buildStructuredCommunication, formatStructuredCommunication };
