const pool = require('../config/db');

/**
 * GET /api/master/system-reports/summary
 * Returns overall counts: totalCadets, totalAdmins, totalMasters, totalFallins, totalEvents, totalAchievements, etc.
 */
exports.getSummary = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may view system reports.' });
  }
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*)::integer FROM users) AS "totalCadets",
        (SELECT COUNT(*)::integer FROM admins) AS "totalAdmins",
        (SELECT COUNT(*)::integer FROM masters) AS "totalMasters",
        (SELECT COUNT(*)::integer FROM fallin) AS "totalFallins",
        (SELECT COUNT(*)::integer FROM events) AS "totalEvents",
        (SELECT COUNT(*)::integer FROM achievements) AS "totalAchievements",
        (SELECT COUNT(*)::integer FROM support_queries) AS "totalQueries"
    `);
    
    // PostgreSQL returns an object directly on the first row
    const summary = result.rows[0];

    return res.json({
      totalCadets: summary.totalCadets,
      totalAdmins: summary.totalAdmins,
      totalMasters: summary.totalMasters,
      totalFallins: summary.totalFallins,
      totalEvents: summary.totalEvents,
      totalAchievements: summary.totalAchievements,
      totalQueries: summary.totalQueries
    });
  } catch (err) {
    console.error('[Get Summary Error]', err);
    return res.status(500).json({ msg: 'Database error while generating summary.' });
  }
};

/**
 * GET /api/master/system-reports/attendance-trends
 * Returns last N fall-in dates with overall attendance percentages across the entire platform.
 */
exports.getAttendanceTrends = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may view attendance trends.' });
  }
  try {
    const result = await pool.query(`
      SELECT 
        f.fallin_id,
        f.date,
        f.time,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::integer AS "presentCount",
        COUNT(a.regimental_number)::integer AS "totalCount",
        ROUND(
          (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::numeric / COUNT(a.regimental_number)) * 100,
          2
        )::numeric(5, 2) AS "percentage"
      FROM fallin f
      LEFT JOIN attendance a ON f.fallin_id = a.fallin_id
      GROUP BY f.fallin_id, f.date, f.time
      ORDER BY f.date DESC, f.time DESC
      LIMIT 5
    `);
    
    return res.json(result.rows);
  } catch (err) {
    console.error('[Get Attendance Trends Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching attendance trends.' });
  }
};
