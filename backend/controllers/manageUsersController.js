const pool = require('../config/db');

/**
 * GET /api/admin/manage-users
 * Return all cadet users whose `ano_id` matches the logged-in ANO.
 */
exports.getAllUsers = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may manage cadet registrations.' });
  }

  const ano_id = req.user.ano_id;

  try {
    const result = await pool.query(
      `SELECT
          id,
          regimental_number,
          name,
          email,
          contact,
          is_approved
        FROM users
        WHERE ano_id = $1
        ORDER BY is_approved ASC, name ASC`,
      [ano_id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[Get All Users Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching users.' });
  }
};

/**
 * PUT /api/admin/manage-users/approve/:userId
 * Set is_approved = TRUE for the specified cadet, only if they belong to this ANO.
 * After approving, notify that cadet.
 */
exports.approveUser = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may approve cadets.' });
  }

  const ano_id = req.user.ano_id;
  const userId = req.params.userId;

  try {
    // 1) Verify that this cadet belongs to this ANO and fetch their regimental_number
    const checkResult = await pool.query(
      `SELECT regimental_number
        FROM users
        WHERE id = $1 AND ano_id = $2`,
      [userId, ano_id]
    );
    if (!checkResult.rows.length) {
      return res.status(404).json({ msg: 'Cadet not found or not under your ANO.' });
    }
    const regimental_number = checkResult.rows[0].regimental_number;

    // 2) Update is_approved = TRUE
    await pool.query(
      `UPDATE users
        SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [userId]
    );

    // 3) Insert a notification for that cadet
    const message = `Your account has been approved! You may now log in.`;
    const link = `/cadet/dashboard`;

    await pool.query(
      `INSERT INTO notifications
        (regimental_number, type, message, link)
        VALUES ($1, $2, $3, $4)`,
      [regimental_number, 'ManageUsers', message, link]
    );

    return res.json({ msg: 'Cadet approved and notification sent.' });
  } catch (err) {
    console.error('[Approve User Error]', err);
    return res.status(500).json({ msg: 'Database error while approving cadet.' });
  }
};

/**
 * DELETE /api/admin/manage-users/:userId
 * Remove a cadet’s user row entirely, only if they belong to this ANO.
 * Before deletion, notify the cadet that their registration was rejected.
 */
exports.deleteUser = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may delete cadets.' });
  }

  const ano_id = req.user.ano_id;
  const userId = req.params.userId;

  try {
    // 1) Verify that this cadet belongs to this ANO and fetch their regimental_number
    const checkResult = await pool.query(
      `SELECT regimental_number
        FROM users
        WHERE id = $1 AND ano_id = $2`,
      [userId, ano_id]
    );
    if (!checkResult.rows.length) {
      return res.status(404).json({ msg: 'Cadet not found or not under your ANO.' });
    }
    const regimental_number = checkResult.rows[0].regimental_number;

    // 2) Insert a “rejection” notification before deleting the user row
    const message = `Your registration has been rejected by the ANO.`;
    const link = null; // no link

    await pool.query(
      `INSERT INTO notifications
        (regimental_number, type, message, link)
        VALUES ($1, $2, $3, $4)`,
      [regimental_number, 'ManageUsers', message, link]
    );

    // 3) Delete the user row
    const deleteResult = await pool.query(
      `DELETE FROM users
        WHERE id = $1`,
      [userId]
    );

    if (deleteResult.rowCount === 0) {
        return res.status(404).json({ msg: 'Cadet not found.' });
    }

    return res.json({ msg: 'Cadet deleted and notification sent.' });
  } catch (err) {
    console.error('[Delete User Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting cadet.' });
  }
};
