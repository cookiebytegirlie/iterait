const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../db/database');

router.use(authMiddleware);

// GET /security/access-log
router.get('/access-log', (_req, res) => {
  const rows = db.prepare('SELECT * FROM access_log ORDER BY timestamp DESC').all();
  return res.json(rows);
});

module.exports = router;
