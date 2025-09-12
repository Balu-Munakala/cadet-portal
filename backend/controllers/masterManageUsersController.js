const pool = require('../config/db');

/**
 * GET /api/master/manage-users
 * Return all cadet rows from `users`. Only Master may call.
 */
exports.getAllCadets = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may manage cadets.' });
  }

  try {
    const result = await pool.query(
      `SELECT
          id,
          regimental_number,
          name,
          email,
          contact,
          ano_id,
          is_approved,
          created_at
        FROM users
        ORDER BY is_approved ASC, name ASC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[Get All Cadets Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching cadets.' });
  }
};

/**
 * PUT /api/master/manage-users/:regimental_number/enable
 * Set is_approved=TRUE for that cadet
 */
exports.enableCadet = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may enable cadets.' });
  }
  const { regimental_number } = req.params;
  try {
    const updateResult = await pool.query(
      `UPDATE users
        SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE regimental_number = $1`,
      [regimental_number]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ msg: 'Cadet not found.' });
    }
    return res.json({ msg: 'Cadet enabled.' });
  } catch (err) {
    console.error('[Enable Cadet Error]', err);
    return res.status(500).json({ msg: 'Database error while enabling cadet.' });
  }
};

/**
 * PUT /api/master/manage-users/:regimental_number/disable
 * Set is_approved=FALSE for that cadet
 */
exports.disableCadet = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may disable cadets.' });
  }
  const { regimental_number } = req.params;
  try {
    const updateResult = await pool.query(
      `UPDATE users
        SET is_approved = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE regimental_number = $1`,
      [regimental_number]
    );
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ msg: 'Cadet not found.' });
    }
    return res.json({ msg: 'Cadet disabled.' });
  } catch (err) {
    console.error('[Disable Cadet Error]', err);
    return res.status(500).json({ msg: 'Database error while disabling cadet.' });
  }
};

/**
 * DELETE /api/master/manage-users/:regimental_number
 * Permanently remove that cadet
 */
exports.deleteCadet = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may delete cadets.' });
  }
  const { regimental_number } = req.params;
  try {
    const deleteResult = await pool.query(
      `DELETE FROM users WHERE regimental_number = $1`,
      [regimental_number]
    );
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ msg: 'Cadet not found.' });
    }
    return res.json({ msg: 'Cadet deleted.' });
  } catch (err) {
    console.error('[Delete Cadet Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting cadet.' });
  }
};
