const pool = require('../config/db');

// --- NEW FUNCTION for Admins to create notifications ---
/**
 * POST /api/notifications
 * Creates notifications for all cadets under an admin's command.
 * This is done in a transaction to ensure all or no notifications are sent.
 */
exports.createCadetNotification = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only admins may post notifications.' });
  }

  const { ano_id } = req.user;
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ msg: 'Title and message are required.' });
  }

  const fullMessage = `${title}\n\n${message}`;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const cadetsResult = await client.query(
      `SELECT regimental_number FROM users WHERE ano_id = $1`,
      [ano_id]
    );

    if (cadetsResult.rows.length === 0) {
      return res.json({ msg: 'Notification posted, but you have no cadets to notify.' });
    }

    const notificationPromises = cadetsResult.rows.map(cadet => {
      const query = `
        INSERT INTO notifications (regimental_number, type, message, link)
        VALUES ($1, 'ANO Announcement', $2, '/cadet/dashboard')
      `;
      return client.query(query, [cadet.regimental_number, fullMessage]);
    });

    await Promise.all(notificationPromises);
    await client.query('COMMIT');
    res.json({ msg: `Notification sent to ${cadetsResult.rows.length} cadets.` });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Create Cadet Notification Error]', err);
    res.status(500).json({ msg: 'Database error while posting notification.' });
  } finally {
    client.release();
  }
};

// --- NEW FUNCTION for Admins to get their sent notifications ---
/**
 * GET /api/notifications/admin
 * Returns a distinct list of notifications sent by the logged-in admin.
 */
exports.getAdminNotifications = async (req, res) => {
  // --- DEBUG LOG ---
  console.log('✅ EXECUTING: getAdminNotifications controller function');
  // --- END DEBUG LOG ---
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only admins may view their notifications.' });
  }

  const { ano_id } = req.user;

  try {
    const query = `
      SELECT DISTINCT ON (n.message, n.created_at)
        n.message,
        n.created_at,
        n.type
      FROM notifications n
      JOIN users u ON n.regimental_number = u.regimental_number
      WHERE u.ano_id = $1 AND n.type = 'ANO Announcement'
      ORDER BY n.created_at DESC, n.message;
    `;
    const result = await pool.query(query, [ano_id]);
    return res.json(result.rows);
  } catch (err) {
    console.error('[Get Admin Notifications Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching notifications.' });
  }
};


/**
 * GET /api/notifications/user
 * Returns all notifications (newest first) for the logged-in cadet.
 */
exports.getUserNotifications = async (req, res) => {
  // ... (existing code is unchanged)
  if (req.user.userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets may view notifications.' });
  }

  const regimental_number = req.user.regimental_number;
  try {
    const result = await pool.query(
      `SELECT notification_id,
              type,
              message,
              link,
              is_read,
              created_at
         FROM notifications
        WHERE regimental_number = $1
        ORDER BY created_at DESC`,
      [regimental_number]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[Get User Notifications Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching notifications.' });
  }
};

/**
 * PUT /api/notifications/:notificationId/read
 * Marks a single notification as "read" (is_read = TRUE).
 */
exports.markAsRead = async (req, res) => {
  // ... (existing code is unchanged)
  if (req.user.userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets may mark notifications.' });
  }

  const regimental_number = req.user.regimental_number;
  const notificationId = req.params.notificationId;

  try {
    const checkResult = await pool.query(
      `SELECT notification_id
         FROM notifications
        WHERE notification_id = $1
          AND regimental_number = $2`,
      [notificationId, regimental_number]
    );
    if (!checkResult.rows.length) {
      return res.status(404).json({ msg: 'Notification not found.' });
    }

    const updateResult = await pool.query(
      `UPDATE notifications
          SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE notification_id = $1`,
      [notificationId]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ msg: 'Notification not found.' });
    }

    return res.json({ msg: 'Notification marked as read.' });
  } catch (err) {
    console.error('[Mark Notification As Read Error]', err);
    return res.status(500).json({ msg: 'Database error while updating notification.' });
  }
};