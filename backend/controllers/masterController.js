const pool = require('../config/db'); // Your PostgreSQL pool
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

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
        p.profile_pic_base64
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

    const phone = req.user.phone;

    await pool.query(
      `
      INSERT INTO master_profile (
        phone, 
        profile_pic_base64
      )
      VALUES ($1, $2)
      ON CONFLICT (phone) DO UPDATE SET
        profile_pic_base64 = EXCLUDED.profile_pic_base64,
        updated_at = CURRENT_TIMESTAMP
      `,
      [phone, profilePicBase64]
    );

    res.json({ success: true, message: 'Profile picture updated successfully' });
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
      SELECT profile_pic_base64
      FROM master_profile
      WHERE phone = $1
      `,
      [phone]
    );

    if (!result.rows.length || !result.rows[0].profile_pic_base64) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    res.json({ profilePicBase64: result.rows[0].profile_pic_base64 });
  } catch (err) {
    console.error('[Get Master Profile Pic Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all users for master nominal roll
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users from different tables with only required fields
    const usersResult = await pool.query(
      `
      -- Get all cadets/users
      SELECT 
        u.id::text as id,
        u.name,
        u.email,
        u.regimental_number,
        'user' as role,
        u.ano_id,
        p.current_year,
        p.wing,
        p.category,
        CASE 
          WHEN u.ano_id LIKE '%GNL%' THEN 'GNL'
          WHEN u.ano_id LIKE '%FSFS%' THEN 'FSFS'
          ELSE 'OTHER'
        END as type,
        1 as sort_order
      FROM users u
      LEFT JOIN users_profile p ON u.regimental_number = p.regimental_number
      WHERE u.is_approved = true
      
      UNION ALL
      
      -- Get all admins
      SELECT 
        a.id::text as id,
        a.name,
        a.email,
        a.ano_id as regimental_number,
        'admin' as role,
        a.ano_id,
        NULL as current_year,
        NULL as wing,
        NULL as category,
        a.type,
        2 as sort_order
      FROM admins a
      WHERE a.is_approved = true
      
      UNION ALL
      
      -- Get all masters
      SELECT 
        m.phone as id,
        m.name,
        m.email,
        m.phone as regimental_number,
        'master' as role,
        'MASTER' as ano_id,
        NULL as current_year,
        NULL as wing,
        NULL as category,
        'MASTER' as type,
        0 as sort_order
      FROM masters m
      
      ORDER BY sort_order, name
      `
    );

    if (!usersResult.rows.length) {
      return res.status(404).json({ 
        success: false, 
        msg: 'No users found in the system' 
      });
    }

    res.json({
      success: true,
      users: usersResult.rows,
      total: usersResult.rows.length,
      msg: `Found ${usersResult.rows.length} users in the system`
    });

  } catch (err) {
    console.error('[Get All Users Error]', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Server error while fetching users' 
    });
  }
};

// Generate Master Nominal Roll in Excel format
exports.generateMasterNominalRoll = async (req, res) => {
  try {
    const { selectedUsers, heading } = req.body; // Array of user IDs and custom heading

    if (!selectedUsers || !Array.isArray(selectedUsers) || selectedUsers.length === 0) {
      return res.status(400).json({ msg: 'Please provide selected user IDs' });
    }

    // Build query for selected users with only required fields
    const placeholders = selectedUsers.map((_, index) => `$${index + 1}`).join(',');
    
    // Fetch selected users data from all user types
    const usersResult = await pool.query(
      `
      -- Get selected cadets/users
      SELECT 
        u.id::text as id,
        u.name,
        u.email,
        u.contact as mobile_no,
        u.regimental_number,
        'user' as role,
        u.ano_id,
        p.current_year,
        p.wing,
        p.category,
        CASE 
          WHEN u.ano_id LIKE '%GNL%' THEN 'GNL'
          WHEN u.ano_id LIKE '%FSFS%' THEN 'FSFS'
          ELSE 'OTHER'
        END as type,
        3 as sort_order
      FROM users u
      LEFT JOIN users_profile p ON u.regimental_number = p.regimental_number
      WHERE u.id IN (${placeholders})
      
      UNION ALL
      
      -- Get selected admins
      SELECT 
        a.id::text as id,
        a.name,
        a.email,
        a.contact as mobile_no,
        a.ano_id as regimental_number,
        'admin' as role,
        a.ano_id,
        NULL as current_year,
        NULL as wing,
        NULL as category,
        a.type,
        2 as sort_order
      FROM admins a
      WHERE a.id IN (${placeholders})
      
      UNION ALL
      
      -- Get selected masters
      SELECT 
        m.phone as id,
        m.name,
        m.email,
        m.phone as mobile_no,
        m.phone as regimental_number,
        'master' as role,
        'MASTER' as ano_id,
        NULL as current_year,
        NULL as wing,
        NULL as category,
        'MASTER' as type,
        1 as sort_order
      FROM masters m
      WHERE m.phone IN (${placeholders})
      
      ORDER BY sort_order, regimental_number, name
      `,
      [...selectedUsers, ...selectedUsers, ...selectedUsers]
    );

    if (!usersResult.rows.length) {
      return res.status(404).json({ msg: 'No selected users found' });
    }

    // Prepare data for Excel
    const excelData = usersResult.rows.map((user, index) => ({
      'SL NO': index + 1,
      'NAME': user.name || '',
      'REG NO.': user.regimental_number || '',
      'ROLE': user.role?.toUpperCase() || '',
      'EMAIL': user.email || '',
      'MOBILE NO': user.mobile_no || '',
      'TYPE': user.type || 'N/A',
      'WING': user.wing || 'N/A',
      'CATEGORY': user.category || 'N/A',
      'YEAR': user.current_year || 'N/A',
      'ADMIN ID': user.ano_id || 'N/A'
    }));

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet with heading
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    
    // Add custom heading if provided
    if (heading && heading.trim()) {
      XLSX.utils.sheet_add_aoa(worksheet, [[heading.trim()]], { origin: 'A1' });
      // Add an empty row after heading
      XLSX.utils.sheet_add_aoa(worksheet, [['']], { origin: 'A2' });
      // Add data starting from row 3
      XLSX.utils.sheet_add_json(worksheet, excelData, { origin: 'A3', skipHeader: false });
    } else {
      // Add data without heading
      XLSX.utils.sheet_add_json(worksheet, excelData, { origin: 'A1', skipHeader: false });
    }

    // Set column widths for better formatting
    const columnWidths = [
      { wch: 8 },  // SL NO
      { wch: 25 }, // NAME
      { wch: 15 }, // REG NO
      { wch: 10 }, // ROLE
      { wch: 30 }, // EMAIL
      { wch: 15 }, // MOBILE NO
      { wch: 12 }, // TYPE
      { wch: 10 }, // WING
      { wch: 12 }, // CATEGORY
      { wch: 8 },  // YEAR
      { wch: 15 }  // ADMIN ID
    ];
    worksheet['!cols'] = columnWidths;

    // Style the heading if it exists
    if (heading && heading.trim()) {
      // Merge cells across all columns for the heading
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];
      
      // Center align the heading
      if (!worksheet['A1'].s) worksheet['A1'].s = {};
      worksheet['A1'].s.alignment = { horizontal: 'center', vertical: 'center' };
      worksheet['A1'].s.font = { bold: true, size: 14 };
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Nominal Roll');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    });

    // Set response headers for file download
    const fileName = `Master_Nominal_Roll_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);

  } catch (err) {
    console.error('[Generate Master Nominal Roll Error]', err);
    res.status(500).json({ msg: 'Server error while generating master nominal roll' });
  }
};