const jwt = require('jsonwebtoken');

// A simple in-memory blacklist. In production, you might persist this in a database or Redis.
const tokenBlacklist = new Set();

// Use a single environment variable for the secret key.
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

const authenticate = (req, res, next) => {
  // Expect the token as a cookie named "token"
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'Login required.' });
  }

  // If the token has been blacklisted (e.g., on logout), reject it.
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: 'Token invalidated.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // decoded now contains exactly whatever we signed (e.g., userType, id, ano_id, etc.)
    req.user = decoded;
    next();
  } catch (err) {
    // If verification fails, the token is invalid or expired.
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = { authenticate, tokenBlacklist };
