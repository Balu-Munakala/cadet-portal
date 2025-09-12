const pool = require('../config/db'); // Your PostgreSQL pool
const path = require('path');

exports.getProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        a.name, 
        a.email, 
        a.contact, 
        a.ano_id, 
        a.role, 
        a.type,
        p.dob, 
        p.address, 
        p.unit_name, 
        p.institution_name, 
        p.profile_pic_path
      FROM admins a
      LEFT JOIN admin_profile p 
        ON a.ano_id = p.ano_id
      WHERE a.id = $1
      `,
      [adminId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Admin Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminResult = await pool.query(
      'SELECT ano_id FROM admins WHERE id = $1',
      [adminId]
    );
    if (!adminResult.rows.length) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    const ano_id = adminResult.rows[0].ano_id;
    const { dob, address, role, unit_name, institution_name } = req.body;

    await pool.query(
      `
      INSERT INTO admin_profile (
        ano_id, 
        dob, 
        address, 
        role, 
        unit_name, 
        institution_name
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (ano_id) DO UPDATE SET
        dob = EXCLUDED.dob,
        address = EXCLUDED.address,
        role = EXCLUDED.role,
        unit_name = EXCLUDED.unit_name,
        institution_name = EXCLUDED.institution_name,
        updated_at = CURRENT_TIMESTAMP
      `,
      [ano_id, dob, address, role, unit_name, institution_name]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Update Admin Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const adminId = req.user.id;
    const adminResult = await pool.query(
      'SELECT ano_id FROM admins WHERE id = $1',
      [adminId]
    );
    if (!adminResult.rows.length) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    const ano_id = adminResult.rows[0].ano_id;
    const filename = req.file.filename;

    await pool.query(
      'UPDATE admin_profile SET profile_pic_path = $1 WHERE ano_id = $2',
      [filename, ano_id]
    );

    res.json({ success: true, filename });
  } catch (err) {
    console.error('[Admin Upload Pic Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getProfilePic = async (req, res) => {
  try {
    const adminId = req.user.id;
    const result = await pool.query(
      `
      SELECT p.profile_pic_path
      FROM admins a
      LEFT JOIN admin_profile p ON a.ano_id = p.ano_id
      WHERE a.id = $1
      `,
      [adminId]
    );

    if (!result.rows.length || !result.rows[0].profile_pic_path) {
      return res.status(404).send('Not found');
    }

    const filePath = path.resolve(
      __dirname,
      '..',
      'uploads',
      result.rows[0].profile_pic_path
    );
    return res.sendFile(filePath);
  } catch (err) {
    console.error('[Serve Admin Pic Error]', err);
    res.status(500).send('Error');
  }
};
