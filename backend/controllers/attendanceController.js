const pool = require('../config/db'); // Your PostgreSQL pool

/**
 * List all fallins for the logged-in ANO (admin).
 * GET /api/attendance/fallins
 */
exports.listFallinsForAttendance = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may view fallins for attendance.' });
  }

  const ano_id = req.user.ano_id;
  try {
    const result = await pool.query(
      `SELECT fallin_id, date, time, type, location 
       FROM fallin 
       WHERE ano_id = $1
       ORDER BY date DESC, time DESC`,
      [ano_id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[List Fallins for Attendance Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching fallins.' });
  }
};

/**
 * Given a fallin_id, return all cadets (regimental_number + name)
 * who belong to the same ANO. (Cadets implicitly enrolled if under the ANO.)
 * GET /api/attendance/students/:fallinId
 */
exports.getEligibleCadetsForFallin = async (req, res) => {
  const fallinId = req.params.fallinId;

  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may take attendance.' });
  }

  const ano_id = req.user.ano_id;
  try {
    // 1) Verify that this fallin belongs to this ANO
    const fallinResult = await pool.query(
      `SELECT ano_id FROM fallin WHERE fallin_id = $1`,
      [fallinId]
    );
    if (!fallinResult.rows.length) {
      return res.status(404).json({ msg: 'Fallin not found.' });
    }
    if (fallinResult.rows[0].ano_id !== ano_id) {
      return res.status(403).json({ msg: 'Not authorized for this fallin.' });
    }

    // 2) Fetch all cadets under this ANO
    const cadetResult = await pool.query(
      `SELECT u.regimental_number, u.name
       FROM users u
       WHERE u.ano_id = $1
       ORDER BY u.name ASC`,
      [ano_id]
    );
    return res.json(cadetResult.rows);
  } catch (err) {
    console.error('[Get Eligible Cadets Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching cadets.' });
  }
};

/**
 * Bulk upsert attendance for a given fallin_id.
 * POST /api/attendance/mark/:fallinId
 * Body: { records: [ { regimental_number, status, remarks? }, ... ] }
 */
exports.markAttendance = async (req, res) => {
  const fallinId = req.params.fallinId;
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may mark attendance.' });
  }
  const ano_id = req.user.ano_id;
  const records = req.body.records;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ msg: 'No attendance records provided.' });
  }

  try {
    // 1) Verify fallin belongs to this ANO
    const fallinResult = await pool.query(
      `SELECT ano_id FROM fallin WHERE fallin_id = $1`,
      [fallinId]
    );
    if (!fallinResult.rows.length || fallinResult.rows[0].ano_id !== ano_id) {
      return res.status(403).json({ msg: 'Not authorized for this fallin.' });
    }

    // 2) Bulk upsert each record
    const upsertPromises = records.map(({ regimental_number, status, remarks }) => {
      return pool.query(
        `INSERT INTO attendance 
         (fallin_id, regimental_number, ano_id, status, remarks)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (fallin_id, regimental_number) DO UPDATE SET
           status = EXCLUDED.status,
           remarks = EXCLUDED.remarks,
           updated_at = CURRENT_TIMESTAMP`,
        [fallinId, regimental_number, ano_id, status, remarks || null]
      );
    });

    await Promise.all(upsertPromises);
    return res.json({ msg: 'Attendance recorded successfully.' });
  } catch (err) {
    console.error('[Mark Attendance Error]', err);
    return res.status(500).json({ msg: 'Database error while marking attendance.' });
  }
};

/**
 * View all attendance records for a given fallin_id.
 * GET /api/attendance/view/:fallinId
 */
exports.viewAttendance = async (req, res) => {
  const fallinId = req.params.fallinId;
  const { userType, ano_id } = req.user;

  try {
    // 1) Verify fallin exists and get its ano_id
    const fallinResult = await pool.query(
      `SELECT ano_id FROM fallin WHERE fallin_id = $1`,
      [fallinId]
    );
    if (!fallinResult.rows.length) {
      return res.status(404).json({ msg: 'Fallin not found.' });
    }
    const fallinAno = fallinResult.rows[0].ano_id;

    // 2) Authorization:
    if (userType === 'admin' || userType === 'user') {
      if (ano_id !== fallinAno) {
        return res.status(403).json({ msg: 'Not authorized for this fallin.' });
      }
    } else {
      return res.status(403).json({ msg: 'Only cadets or ANOs may view attendance.' });
    }

    // 3) Fetch joined attendance + user name
    const result = await pool.query(
      `SELECT 
         a.attendance_id,
         a.regimental_number,
         u.name,
         a.status,
         a.remarks,
         a.recorded_at,
         a.updated_at
       FROM attendance a
       JOIN users u ON a.regimental_number = u.regimental_number
       WHERE a.fallin_id = $1
       ORDER BY u.name ASC`,
      [fallinId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[View Attendance Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching attendance.' });
  }
};

/**
 * GET a single attendance record by attendance_id.
 * GET /api/attendance/:attendanceId
 */
exports.getAttendanceById = async (req, res) => {
  const attendanceId = req.params.attendanceId;
  const { userType, ano_id, regimental_number } = req.user;

  try {
    const result = await pool.query(
      `SELECT 
         a.attendance_id,
         a.fallin_id,
         a.regimental_number,
         a.ano_id AS record_ano,
         a.status,
         a.remarks,
         a.recorded_at,
         a.updated_at,
         f.ano_id AS fallin_ano
       FROM attendance a
       JOIN fallin f ON a.fallin_id = f.fallin_id
       WHERE a.attendance_id = $1`,
      [attendanceId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ msg: 'Attendance record not found.' });
    }
    const record = result.rows[0];

    if (userType === 'admin') {
      if (record.fallin_ano !== ano_id) {
        return res.status(403).json({ msg: 'Not authorized to view this record.' });
      }
    } else if (userType === 'user') {
      if (record.regimental_number !== regimental_number) {
        return res.status(403).json({ msg: 'Not authorized to view this record.' });
      }
    } else {
      return res.status(403).json({ msg: 'Not authorized to view attendance.' });
    }

    return res.json(record);
  } catch (err) {
    console.error('[Get Attendance By ID Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching attendance.' });
  }
};

/**
 * UPDATE a single attendance record by attendance_id.
 * PUT /api/attendance/:attendanceId
 * Body: { status, remarks? }
 */
exports.updateAttendanceById = async (req, res) => {
  const attendanceId = req.params.attendanceId;
  const { status, remarks } = req.body;
  const { userType, ano_id, regimental_number } = req.user;

  if (!status) {
    return res.status(400).json({ msg: 'Missing required field: status.' });
  }

  try {
    const result = await pool.query(
      `SELECT 
         a.ano_id AS record_ano,
         a.fallin_id,
         f.ano_id AS fallin_ano,
         a.regimental_number
       FROM attendance a
       JOIN fallin f ON a.fallin_id = f.fallin_id
       WHERE a.attendance_id = $1`,
      [attendanceId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ msg: 'Attendance record not found.' });
    }
    const record = result.rows[0];

    if (userType === 'admin') {
      if (record.fallin_ano !== ano_id) {
        return res.status(403).json({ msg: 'Not authorized to update this record.' });
      }
    } else if (userType === 'user') {
      if (record.regimental_number !== regimental_number) {
        return res.status(403).json({ msg: 'Not authorized to update this record.' });
      }
    } else {
      return res.status(403).json({ msg: 'Not authorized to update attendance.' });
    }

    const updateResult = await pool.query(
      `UPDATE attendance
       SET status = $1, remarks = $2, updated_at = CURRENT_TIMESTAMP
       WHERE attendance_id = $3`,
      [status, remarks || null, attendanceId]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ msg: 'Attendance record not found.' });
    }
    return res.json({ msg: 'Attendance record updated.' });
  } catch (err) {
    console.error('[Update Attendance By ID Error]', err);
    return res.status(500).json({ msg: 'Database error while updating attendance.' });
  }
};

/**
 * DELETE a single attendance record by attendance_id.
 * DELETE /api/attendance/:attendanceId
 */
exports.deleteAttendanceById = async (req, res) => {
  const attendanceId = req.params.attendanceId;
  const { userType, ano_id, regimental_number } = req.user;

  try {
    const result = await pool.query(
      `SELECT 
         a.ano_id AS record_ano,
         a.fallin_id,
         f.ano_id AS fallin_ano,
         a.regimental_number
       FROM attendance a
       JOIN fallin f ON a.fallin_id = f.fallin_id
       WHERE a.attendance_id = $1`,
      [attendanceId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ msg: 'Attendance record not found.' });
    }
    const record = result.rows[0];

    if (userType === 'admin') {
      if (record.fallin_ano !== ano_id) {
        return res.status(403).json({ msg: 'Not authorized to delete this record.' });
      }
    } else if (userType === 'user') {
      if (record.regimental_number !== regimental_number) {
        return res.status(403).json({ msg: 'Not authorized to delete this record.' });
      }
    } else {
      return res.status(403).json({ msg: 'Not authorized to delete attendance.' });
    }

    const deleteResult = await pool.query(
      `DELETE FROM attendance WHERE attendance_id = $1`,
      [attendanceId]
    );
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ msg: 'Attendance record not found.' });
    }
    return res.json({ msg: 'Attendance record deleted.' });
  } catch (err) {
    console.error('[Delete Attendance By ID Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting attendance.' });
  }
};
