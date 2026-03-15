const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    env.jwt.secret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch (error) {
    return null;
  }
}

module.exports = { generateToken, generateRefreshToken, verifyToken };
