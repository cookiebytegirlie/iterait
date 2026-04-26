const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing token' });
  }

  if (!authHeader.startsWith('Bearer ') || authHeader.split(' ').length !== 2) {
    return res.status(401).json({ error: 'Invalid authorization format' });
  }

  const { JWT_SECRET } = process.env;
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const token = authHeader.slice(7);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authMiddleware };
