const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const EXPIRES_IN = '7d';

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
