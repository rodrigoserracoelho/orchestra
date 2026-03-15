const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const env = require('../config/env');
const { pool } = require('../config/database');

let smtpTransport = null;
let resendClient = null;

function getSmtpTransport() {
  if (smtpTransport) return smtpTransport;
  if (!env.smtp.enabled || !env.smtp.host || !env.smtp.user) return null;

  const isImplicitTLS = env.smtp.port === 465;
  smtpTransport = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: isImplicitTLS,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
    logger: env.nodeEnv !== 'production',
    debug: env.nodeEnv !== 'production',
  });
  console.log(`✓ SMTP email configured (${env.smtp.host}:${env.smtp.port}, ${isImplicitTLS ? 'SSL' : 'STARTTLS'})`);
  return smtpTransport;
}

function getResendClient() {
  if (resendClient) return resendClient;
  if (!env.resend.apiKey) return null;

  resendClient = new Resend(env.resend.apiKey);
  console.log('✓ Resend email client configured (fallback)');
  return resendClient;
}

function buildEmailHtml(code) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; margin-bottom: 8px;">Your Login Code</h2>
      <p style="color: #666; margin-bottom: 20px;">Enter this code to sign in to Orchestra Attendance:</p>
      <div style="background: #f0f4ff; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4263eb;">${code}</span>
      </div>
      <p style="color: #999; font-size: 13px;">This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

async function logEmail(recipient, subject, method, success, errorMessage) {
  try {
    await pool.execute(
      'INSERT INTO email_log (recipient, subject, method, success, error_message) VALUES (?, ?, ?, ?, ?)',
      [recipient, subject, method, success, errorMessage || null]
    );
  } catch (e) {
    console.error('Failed to log email:', e.message);
  }
}

function logToConsole(email, code, reason) {
  console.log(`\n========================================`);
  console.log(`  LOGIN CODE for ${email}: ${code}`);
  console.log(`  (${reason})`);
  console.log(`========================================\n`);
}

async function sendViaSmtp(email, code) {
  const transport = getSmtpTransport();
  if (!transport) return null;

  // Use SMTP user as the actual email address; EMAIL_FROM only provides the display name
  const fromName = env.emailFrom ? env.emailFrom.replace(/<.*>/, '').trim() : null;
  const from = fromName ? `${fromName} <${env.smtp.user}>` : env.smtp.user;
  const info = await transport.sendMail({
    from,
    to: email,
    subject: 'Your Orchestra Login Code',
    text: `Your login code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
    html: buildEmailHtml(code),
  });
  console.log(`✓ Login code email sent to ${email} via SMTP (messageId: ${info.messageId}, response: ${info.response})`);
  return { sent: true, method: 'smtp' };
}

async function sendViaResend(email, code) {
  const client = getResendClient();
  if (!client) return null;

  const { data, error } = await client.emails.send({
    from: env.resend.from,
    to: [email],
    subject: 'Your Orchestra Login Code',
    text: `Your login code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
    html: buildEmailHtml(code),
  });

  if (error) throw new Error(error.message);

  console.log(`✓ Login code email sent to ${email} via Resend (id: ${data.id})`);
  return { sent: true, method: 'resend' };
}

async function sendLoginCode(email, code) {
  const subject = 'Your Orchestra Login Code';

  // 1. Try SMTP
  try {
    const result = await sendViaSmtp(email, code);
    if (result) {
      await logEmail(email, subject, 'smtp', true);
      return result;
    }
  } catch (error) {
    console.error(`✗ SMTP failed for ${email}:`, error.message);
    await logEmail(email, subject, 'smtp', false, error.message);
  }

  // 2. Fallback to Resend
  try {
    const result = await sendViaResend(email, code);
    if (result) {
      await logEmail(email, subject, 'resend', true);
      return result;
    }
  } catch (error) {
    console.error(`✗ Resend failed for ${email}:`, error.message);
    await logEmail(email, subject, 'resend', false, error.message);
  }

  // 3. Console fallback
  logToConsole(email, code, 'No email provider available');
  await logEmail(email, subject, 'console', false, 'No email provider available');
  return { sent: false, fallback: 'console' };
}

module.exports = { sendLoginCode };
