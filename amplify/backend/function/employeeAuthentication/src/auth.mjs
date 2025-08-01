// auth.js
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'your_secret_key_here'; // Use process.env.SECRET_KEY in production

export function generateToken(email, expiresIn = '180 days') {
  if (!email) {
    throw new Error('Email is required to generate a token.');
  }

  const payload = { email };
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}
