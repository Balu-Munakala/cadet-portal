const pool = require('../config/db');

/**
 * GET /api/admin/events
 * Return all events for the logged-in ANO, sorted newest first.
 */
exports.getAdminEvents = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may view their events.' });
  }
  const ano_id = req.user.ano_id;
  try {
    const result = await pool.query(
      `SELECT
          event_id,
          event_date,
          fallin_time,
          dress_code,
          location,
          instructions,
          created_at
        FROM events
        WHERE ano_id = $1
        ORDER BY event_date DESC, fallin_time DESC`,
      [ano_id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[Get Admin Events Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching events.' });
  }
};

/**
 * POST /api/admin/events
 * Body: { event_date (YYYY-MM-DD), fallin_time (HH:MM:SS), dress_code, location, instructions }
 * Creates a new event under this ANO.
 * After creation, notifies all cadets under that ANO.
 */
exports.createEvent = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may create events.' });
  }
  const ano_id = req.user.ano_id;
  const { event_date, fallin_time, dress_code, location, instructions } = req.body;

  if (!event_date || !fallin_time || !dress_code || !location || !instructions) {
    return res.status(400).json({ msg: 'All fields are required.' });
  }

  try {
    // 1) Insert into events table
    const eventResult = await pool.query(
      `INSERT INTO events
          (ano_id, event_date, fallin_time, dress_code, location, instructions)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING event_id`,
      [ano_id, event_date, fallin_time, dress_code, location, instructions]
    );
    const newEventId = eventResult.rows[0].event_id;

    // 2) Fetch all cadets under this ANO
    const cadetsResult = await pool.query(
      `SELECT regimental_number FROM users WHERE ano_id = $1`,
      [ano_id]
    );
    const cadets = cadetsResult.rows;

    // 3) Build notification message & link
    const formattedDate = new Date(event_date).toLocaleDateString();
    const message = `New Event: "${location}" on ${formattedDate} at ${fallin_time}.`;
    const link = `/cadet/events`;

    // 4) Bulk-insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.query(
        `INSERT INTO notifications (regimental_number, type, message, link)
          VALUES ($1, $2, $3, $4)`,
        [c.regimental_number, 'Event', message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.json({ msg: 'Event created and notifications sent.', event_id: newEventId });
  } catch (err) {
    console.error('[Create Event Error]', err);
    return res.status(500).json({ msg: 'Database error while creating event.' });
  }
};

/**
 * PUT /api/admin/events/:eventId
 * Body: { event_date, fallin_time, dress_code, location, instructions }
 * Updates a single event, if it belongs to this ANO.
 * After updating, notifies all cadets under that ANO.
 */
exports.updateEvent = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may update events.' });
  }
  const ano_id = req.user.ano_id;
  const eventId = req.params.eventId;
  const { event_date, fallin_time, dress_code, location, instructions } = req.body;

  if (!event_date || !fallin_time || !dress_code || !location || !instructions) {
    return res.status(400).json({ msg: 'All fields are required.' });
  }

  try {
    // 1) Verify ownership
    const result = await pool.query(
      `SELECT event_id FROM events WHERE event_id = $1 AND ano_id = $2`,
      [eventId, ano_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ msg: 'Event not found or unauthorized.' });
    }

    // 2) Update the event
    await pool.query(
      `UPDATE events
        SET event_date = $1,
            fallin_time = $2,
            dress_code = $3,
            location = $4,
            instructions = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE event_id = $6`,
      [event_date, fallin_time, dress_code, location, instructions, eventId]
    );

    // 3) Fetch all cadets under this ANO
    const cadetsResult = await pool.query(
      `SELECT regimental_number FROM users WHERE ano_id = $1`,
      [ano_id]
    );
    const cadets = cadetsResult.rows;

    // 4) Build notification message & link
    const formattedDate = new Date(event_date).toLocaleDateString();
    const message = `Event updated: "${location}" on ${formattedDate} at ${fallin_time}.`;
    const link = `/cadet/events`;

    // 5) Bulk-insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.query(
        `INSERT INTO notifications (regimental_number, type, message, link)
          VALUES ($1, $2, $3, $4)`,
        [c.regimental_number, 'Event', message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.json({ msg: 'Event updated and notifications sent.' });
  } catch (err) {
    console.error('[Update Event Error]', err);
    return res.status(500).json({ msg: 'Database error while updating event.' });
  }
};

/**
 * DELETE /api/admin/events/:eventId
 * Deletes a single event if it belongs to this ANO.
 * After deletion, notifies all cadets under that ANO.
 */
exports.deleteEvent = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may delete events.' });
  }
  const ano_id = req.user.ano_id;
  const eventId = req.params.eventId;

  try {
    // 1) Verify ownership and fetch event_date/fallin_time/location
    const result = await pool.query(
      `SELECT event_date, fallin_time, location
        FROM events
        WHERE event_id = $1 AND ano_id = $2`,
      [eventId, ano_id]
    );
    const rows = result.rows;
    if (!rows.length) {
      return res.status(404).json({ msg: 'Event not found or unauthorized.' });
    }
    const { event_date, fallin_time, location } = rows[0];

    // 2) Delete the event
    const deleteResult = await pool.query(
      `DELETE FROM events WHERE event_id = $1`,
      [eventId]
    );
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ msg: 'Event not found.' });
    }

    // 3) Fetch all cadets under this ANO
    const cadetsResult = await pool.query(
      `SELECT regimental_number FROM users WHERE ano_id = $1`,
      [ano_id]
    );
    const cadets = cadetsResult.rows;

    // 4) Build notification message & link
    const formattedDate = new Date(event_date).toLocaleDateString();
    const message = `Event removed: "${location}" on ${formattedDate} at ${fallin_time}.`;
    const link = `/cadet/events`;

    // 5) Bulk-insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.query(
        `INSERT INTO notifications (regimental_number, type, message, link)
          VALUES ($1, $2, $3, $4)`,
        [c.regimental_number, 'Event', message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.json({ msg: 'Event deleted and notifications sent.' });
  } catch (err) {
    console.error('[Delete Event Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting event.' });
  }
};

/**
 * GET /api/events
 * Returns all events for a cadet’s ANO (logged-in userType === 'user'), sorted newest first.
 */
exports.getUserEvents = async (req, res) => {
  if (req.user.userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets may view events.' });
  }
  const ano_id = req.user.ano_id;
  try {
    const result = await pool.query(
      `SELECT
          event_id,
          event_date,
          fallin_time,
          dress_code,
          location,
          instructions,
          created_at
        FROM events
        WHERE ano_id = $1
        ORDER BY event_date DESC, fallin_time DESC`,
      [ano_id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[Get User Events Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching events.' });
  }
};
