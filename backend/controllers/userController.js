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
        p.profile_pic_base64,
        p.dietary_preference,
        p.blood_group,
        p.created_at,
        p.updated_at
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
      year_class,
      dietary_preference,
      blood_group
    } = req.body;

    // Input validation
    const allowedWings = ['army', 'navy', 'air-force'];
    const allowedCategories = ['SD', 'SW', 'JD', 'JW'];
    const allowedYears = ['A1', 'A2', 'B1', 'B2', 'C'];
    const allowedStudying = ['school', 'intermediate', 'ug', 'pg'];
    const allowedDietary = ['vegetarian', 'non-vegetarian', 'vegan', 'jain'];
    const allowedBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    if (wing && !allowedWings.includes(wing)) {
      return res.status(400).json({ msg: 'Invalid wing selection' });
    }
    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({ msg: 'Invalid category selection' });
    }
    if (current_year && !allowedYears.includes(current_year)) {
      return res.status(400).json({ msg: 'Invalid year selection' });
    }
    if (studying && !allowedStudying.includes(studying)) {
      return res.status(400).json({ msg: 'Invalid studying level selection' });
    }
    if (dietary_preference && !allowedDietary.includes(dietary_preference)) {
      return res.status(400).json({ msg: 'Invalid dietary preference selection' });
    }
    if (blood_group && !allowedBloodGroups.includes(blood_group)) {
      return res.status(400).json({ msg: 'Invalid blood group selection' });
    }

    await pool.query(
      `
      INSERT INTO users_profile (
        regimental_number, 
        dob, 
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
        year_class,
        dietary_preference,
        blood_group,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (regimental_number) DO UPDATE SET
        dob = EXCLUDED.dob,
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
        dietary_preference = EXCLUDED.dietary_preference,
        blood_group = EXCLUDED.blood_group,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        regimental_number,
        dob,
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
        year_class,
        dietary_preference,
        blood_group
      ]
    );

    res.json({ success: true, msg: 'Profile updated successfully' });
  } catch (err) {
    console.error('[Update Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    const { profilePicBase64 } = req.body;
    
    if (!profilePicBase64) {
      return res.status(400).json({ success: false, msg: 'No image data provided' });
    }
    
    // Validate Base64 size (approximately 1.33x original file size)
    // For 2MB original limit, Base64 will be ~2.7MB
    const base64SizeInBytes = (profilePicBase64.length * 3) / 4;
    const maxSizeInMB = 2;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    
    if (base64SizeInBytes > maxSizeInBytes) {
      return res.status(400).json({ 
        success: false, 
        msg: `Profile picture is too large. Maximum size allowed is ${maxSizeInMB}MB. Your image is approximately ${(base64SizeInBytes / (1024 * 1024)).toFixed(1)}MB.` 
      });
    }
    
    // Validate Base64 format
    if (!profilePicBase64.startsWith('data:image/')) {
      return res.status(400).json({ success: false, msg: 'Invalid image format. Please upload a valid image file.' });
    }

    const userId = req.user.id;

    // Get user's regimental number
    const userResult = await pool.query(
      'SELECT regimental_number FROM users WHERE id = $1',
      [userId]
    );
    if (!userResult.rows.length) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const regimental_number = userResult.rows[0].regimental_number;

    // Update profile picture in database
    await pool.query(
      `
      INSERT INTO users_profile (
        regimental_number, 
        profile_pic_base64
      )
      VALUES ($1, $2)
      ON CONFLICT (regimental_number) DO UPDATE SET
        profile_pic_base64 = EXCLUDED.profile_pic_base64,
        updated_at = CURRENT_TIMESTAMP
      `,
      [regimental_number, profilePicBase64]
    );

    res.json({ success: true, message: 'Profile picture updated successfully' });
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
      SELECT p.profile_pic_base64
      FROM users u
      LEFT JOIN users_profile p ON u.regimental_number = p.regimental_number
      WHERE u.id = $1
      `,
      [userId]
    );

    if (!result.rows.length || !result.rows[0].profile_pic_base64) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    res.json({ profilePicBase64: result.rows[0].profile_pic_base64 });
  } catch (err) {
    console.error('[Get Profile Pic Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
