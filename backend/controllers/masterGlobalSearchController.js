const pool = require('../config/db');

/**
 * GET /api/master/global-search?q=...
 * Master may search for partial matches in user names, admin names, phone/email, etc.
 */
exports.searchAll = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may perform global search.' });
  }
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ msg: 'Query parameter q is required.' });
  }
  const wildcard = `%${q}%`;
  try {
    // 1) Search cadets (users)
    const cadetResult = await pool.query(
      `SELECT 'user' AS "type", regimental_number AS id, name, email, contact
       FROM users
       WHERE name ILIKE $1 OR email ILIKE $2 OR regimental_number ILIKE $3`,
      [wildcard, wildcard, wildcard]
    );

    // 2) Search admins
    const adminResult = await pool.query(
      `SELECT 'admin' AS "type", ano_id AS id, name, email, contact
       FROM admins
       WHERE name ILIKE $1 OR email ILIKE $2 OR ano_id ILIKE $3`,
      [wildcard, wildcard, wildcard]
    );

    // 3) Search masters (just in case)
    const masterResult = await pool.query(
      `SELECT 'master' AS "type", phone AS id, name, email, phone AS contact
       FROM masters
       WHERE name ILIKE $1 OR email ILIKE $2 OR phone ILIKE $3`,
      [wildcard, wildcard, wildcard]
    );

    return res.json({ 
        cadets: cadetResult.rows, 
        admins: adminResult.rows, 
        masters: masterResult.rows 
    });
  } catch (err) {
    console.error('[Global Search Error]', err);
    return res.status(500).json({ msg: 'Database error while performing search.' });
  }
};
