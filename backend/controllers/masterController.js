const pool = require('../config/db'); // Your PostgreSQL pool
const path = require('path');
const fs = require('fs');

exports.getProfile = async (req, res) => {
  try {
    const phone = req.user.phone;
    const result = await pool.query(
      `
      SELECT 
        m.name, 
        m.email, 
        m.phone, 
        p.address, 
        p.profile_pic_path
      FROM masters m
      LEFT JOIN master_profile p 
        ON m.phone = p.phone
      WHERE m.phone = $1
      `,
      [phone]
    );

    if (!result.rows.length) {
      return res.status(404).json({ msg: 'Master not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Master Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const phone = req.user.phone;
    const { address } = req.body;

    await pool.query(
      `
      INSERT INTO master_profile (phone, address)
      VALUES ($1, $2)
      ON CONFLICT (phone) DO UPDATE SET
        address = EXCLUDED.address,
        updated_at = CURRENT_TIMESTAMP
      `,
      [phone, address]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Update Master Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const phone = req.user.phone;
    const filename = req.file.filename;

    await pool.query(
      `
      UPDATE master_profile
      SET profile_pic_path = $1
      WHERE phone = $2
      `,
      [filename, phone]
    );

    res.json({ success: true, filename });
  } catch (err) {
    console.error('[Upload Master Pic Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getProfilePic = async (req, res) => {
  try {
    const phone = req.user.phone;
    const result = await pool.query(
      `
      SELECT profile_pic_path
      FROM master_profile
      WHERE phone = $1
      `,
      [phone]
    );

    if (!result.rows.length || !result.rows[0].profile_pic_path) {
      return res.status(404).send('No profile picture');
    }

    const filePath = path.resolve(
      __dirname,
      '..',
      'uploads',
      result.rows[0].profile_pic_path
    );
    res.sendFile(filePath);
  } catch (err) {
    console.error('[Serve Master Pic Error]', err);
    res.status(500).send('Error');
  }
};
