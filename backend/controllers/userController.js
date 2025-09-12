const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `
      SELECT 
        u.name, 
        u.email, 
        u.contact, 
        u.regimental_number,
        p.dob, 
        p.age, 
        p.mother_name, 
        p.father_name, 
        p.parent_phone,
        p.parent_email, 
        p.address, 
        p.wing, 
        p.category,
        u.ano_id,
        a.name AS ano_name, 
        a.type,
        p.current_year, 
        p.institution_name,
        p.studying, 
        p.year_class, 
        p.profile_pic_path
      FROM users u
      LEFT JOIN users_profile p 
        ON u.regimental_number = p.regimental_number
      LEFT JOIN admins a 
        ON u.ano_id = a.ano_id
      WHERE u.id = $1
      `,
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[User Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userResult = await pool.query(
      'SELECT regimental_number FROM users WHERE id = $1',
      [userId]
    );
    if (!userResult.rows.length) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const regimental_number = userResult.rows[0].regimental_number;
    const {
      dob,
      age,
      mother_name,
      father_name,
      parent_phone,
      parent_email,
      address,
      wing,
      category,
      current_year,
      institution_name,
      studying,
      year_class
    } = req.body;

    await pool.query(
      `
      INSERT INTO users_profile (
        regimental_number, 
        dob, 
        age, 
        mother_name, 
        father_name, 
        parent_phone,
        parent_email, 
        address, 
        wing, 
        category,
        current_year, 
        institution_name, 
        studying, 
        year_class
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (regimental_number) DO UPDATE SET
        dob = EXCLUDED.dob,
        age = EXCLUDED.age,
        mother_name = EXCLUDED.mother_name,
        father_name = EXCLUDED.father_name,
        parent_phone = EXCLUDED.parent_phone,
        parent_email = EXCLUDED.parent_email,
        address = EXCLUDED.address,
        wing = EXCLUDED.wing,
        category = EXCLUDED.category,
        current_year = EXCLUDED.current_year,
        institution_name = EXCLUDED.institution_name,
        studying = EXCLUDED.studying,
        year_class = EXCLUDED.year_class,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        regimental_number,
        dob,
        age,
        mother_name,
        father_name,
        parent_phone,
        parent_email,
        address,
        wing,
        category,
        current_year,
        institution_name,
        studying,
        year_class
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Update Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const userId = req.user.id;
    const userResult = await pool.query(
      'SELECT regimental_number FROM users WHERE id = $1',
      [userId]
    );
    if (!userResult.rows.length) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const regimental_number = userResult.rows[0].regimental_number;
    const filename = req.file.filename;

    await pool.query(
      `
      UPDATE users_profile
      SET profile_pic_path = $1
      WHERE regimental_number = $2
      `,
      [filename, regimental_number]
    );

    res.json({ success: true, filename });
  } catch (err) {
    console.error('[Upload Profile Pic Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getProfilePic = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `
      SELECT p.profile_pic_path
      FROM users u
      LEFT JOIN users_profile p ON u.regimental_number = p.regimental_number
      WHERE u.id = $1
      `,
      [userId]
    );

    if (!result.rows.length || !result.rows[0].profile_pic_path) {
      return res.status(404).send('Profile picture not found');
    }

    const filePath = path.resolve(
      __dirname,
      '..',
      'uploads',
      result.rows[0].profile_pic_path
    );
    return res.sendFile(filePath);
  } catch (err) {
    console.error('[Serve Profile Pic Error]', err);
    res.status(500).send('Error');
  }
};
