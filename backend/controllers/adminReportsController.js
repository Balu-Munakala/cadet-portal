const pool = require('../config/db'); // Your PostgreSQL pool

/**
 * GET /api/admin/reports/users
 * Returns { totalCadets: number, pendingCadets: number }
 */
exports.getUserCounts = async (req, res) => {
  const ano_id = req.user.ano_id;
  try {
    const result = await pool.query(
      `
      SELECT 
        COUNT(*)::integer AS "totalCadets",
        SUM(CASE WHEN is_approved = FALSE THEN 1 ELSE 0 END)::integer AS "pendingCadets"
      FROM users
      WHERE ano_id = $1
      `,
      [ano_id]
    );
    const { totalCadets, pendingCadets } = result.rows[0];
    return res.json({ totalCadets, pendingCadets });
  } catch (err) {
    console.error('[Get User Counts Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching user counts.' });
  }
};

/**
 * GET /api/admin/reports/events-count
 * Returns { totalEvents: number }
 *
 * Note: switched to count rows in `fallin` instead of `events`.
 */
exports.getEventsCount = async (req, res) => {
  const ano_id = req.user.ano_id;
  try {
    const result = await pool.query(
      `
      SELECT COUNT(*)::integer AS "totalEvents"
      FROM fallin
      WHERE ano_id = $1
      `,
      [ano_id]
    );
    const { totalEvents } = result.rows[0];
    return res.json({ totalEvents });
  } catch (err) {
    console.error('[Get Events Count Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching events count.' });
  }
};

/**
 * GET /api/admin/reports/attendance-summary
 * Returns { avgAttendance: number }
 */
exports.getAttendanceSummary = async (req, res) => {
  const ano_id = req.user.ano_id;
  try {
    const result = await pool.query(
      `
      SELECT AVG(pcnt)::numeric(5, 2) AS "avgAttendance" FROM (
        SELECT 
          (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::numeric / COUNT(*)) * 100 AS pcnt
        FROM attendance a
        JOIN fallin f ON a.fallin_id = f.fallin_id
        WHERE f.ano_id = $1
        GROUP BY a.fallin_id
      ) t
      `,
      [ano_id]
    );

    const avgAttendance = result.rows[0].avgAttendance;
    return res.json({ avgAttendance });
  } catch (err) {
    console.error('[Get Attendance Summary Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching attendance summary.' });
  }
};

/**
 * GET /api/admin/reports/attendance-details
 * Returns an array of recent fall-in attendance summaries
 */
exports.getAttendanceDetails = async (req, res) => {
  const ano_id = req.user.ano_id;
  try {
    const result = await pool.query(
      `
      SELECT 
        f.fallin_id,
        f.date,
        f.time,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::integer AS "attendedCount",
        COUNT(a.regimental_number)::integer AS "totalCadets",
        (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::numeric / COUNT(a.regimental_number)) * 100 AS "percentage"
      FROM attendance a
      JOIN fallin f ON a.fallin_id = f.fallin_id
      WHERE f.ano_id = $1
      GROUP BY f.fallin_id
      ORDER BY f.date DESC, f.time DESC
      LIMIT 5
      `,
      [ano_id]
    );

    const details = result.rows.map((r) => {
      // The percentage column is already a numeric type in PostgreSQL, so we don't need to cast it
      return {
        fallin_id: r.fallin_id,
        date: r.date,
        time: r.time,
        attendedCount: r.attendedCount,
        totalCadets: r.totalCadets,
        percentage: Number(r.percentage).toFixed(2), // Format the percentage
      };
    });

    return res.json(details);
  } catch (err) {
    console.error('[Get Attendance Details Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching attendance details.' });
  }
};
