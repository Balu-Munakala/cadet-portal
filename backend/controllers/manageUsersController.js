const pool = require('../config/db');

/**
 * GET /api/admin/manage-users
 * Return all cadet users whose `ano_id` matches the logged-in ANO.
 * This function was already well-written and requires no changes.
 */
exports.getAllUsers = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may manage cadet registrations.' });
  }

  const ano_id = req.user.ano_id;

  try {
    const result = await pool.query(
      `SELECT
          id, regimental_number, name, email, contact, is_approved
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
 * Approve a cadet and notify them within a single, atomic database transaction.
 */
exports.approveUser = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may approve cadets.' });
  }

  const ano_id = req.user.ano_id;
  const { userId } = req.params;
  const client = await pool.connect(); // Get a client from the pool for transaction

  try {
    // Start the transaction
    await client.query('BEGIN');

    // 1. Atomically update the user and return their regimental number.
    // The WHERE clause now handles security, ensuring an ANO can't approve another's cadet.
    const updateUserQuery = `
      UPDATE users
      SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND ano_id = $2
      RETURNING regimental_number;
    `;
    const userResult = await client.query(updateUserQuery, [userId, ano_id]);

    // If no rows were updated, the cadet doesn't exist or doesn't belong to this ANO.
    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK'); // Abort the transaction
      return res.status(404).json({ msg: 'Cadet not found or not under your command.' });
    }
    const { regimental_number } = userResult.rows[0];

    // 2. Insert the approval notification for the user.
    const notificationQuery = `
      INSERT INTO notifications (regimental_number, type, message, link)
      VALUES ($1, 'ManageUsers', 'Your account has been approved! You may now log in.', '/cadet/dashboard');
    `;
    await client.query(notificationQuery, [regimental_number]);

    // 3. Commit the transaction if both operations succeeded.
    await client.query('COMMIT');

    return res.json({ msg: 'Cadet approved and notification sent.' });
  } catch (err) {
    // If any error occurs, roll back the entire transaction.
    await client.query('ROLLBACK');
    console.error('[Approve User Error]', err);
    return res.status(500).json({ msg: 'Database error while approving cadet.' });
  } finally {
    // ALWAYS release the client back to the pool.
    client.release();
  }
};



/**
 * DELETE /api/admin/manage-users/:userId
 * Remove a cadet's user row securely.
 */
exports.deleteUser = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may delete cadets.' });
  }

  const ano_id = req.user.ano_id;
  const { userId } = req.params;

  try {
    // A single, secure DELETE query is sufficient.
    // The WHERE clause ensures an ANO can only delete cadets assigned to them.
    // Note: Notifying a user about their deletion in-app is logically flawed,
    // as their account won't exist to receive the notification.
    // The notification step from the original code has been removed.
    const deleteQuery = `
      DELETE FROM users
      WHERE id = $1 AND ano_id = $2;
    `;
    const deleteResult = await pool.query(deleteQuery, [userId, ano_id]);

    // If rowCount is 0, the user didn't exist or didn't belong to this ANO.
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ msg: 'Cadet not found or not under your command.' });
    }

    return res.json({ msg: 'Cadet deleted successfully.' });
  } catch (err) {
    console.error('[Delete User Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting cadet.' });
  }
};