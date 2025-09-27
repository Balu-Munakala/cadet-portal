const pool = require('../config/db'); // Your PostgreSQL pool
const path = require('path');
const XLSX = require('xlsx');

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
        p.profile_pic_base64
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

    const adminId = req.user.id;
    const adminResult = await pool.query(
      'SELECT ano_id FROM admins WHERE id = $1',
      [adminId]
    );
    if (!adminResult.rows.length) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    const ano_id = adminResult.rows[0].ano_id;

    await pool.query(
      `
      INSERT INTO admin_profile (
        ano_id, 
        profile_pic_base64
      )
      VALUES ($1, $2)
      ON CONFLICT (ano_id) DO UPDATE SET
        profile_pic_base64 = EXCLUDED.profile_pic_base64,
        updated_at = CURRENT_TIMESTAMP
      `,
      [ano_id, profilePicBase64]
    );

    res.json({ success: true, message: 'Profile picture updated successfully' });
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
      SELECT p.profile_pic_base64
      FROM admins a
      LEFT JOIN admin_profile p ON a.ano_id = p.ano_id
      WHERE a.id = $1
      `,
      [adminId]
    );

    if (!result.rows.length || !result.rows[0].profile_pic_base64) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    res.json({ profilePicBase64: result.rows[0].profile_pic_base64 });
  } catch (err) {
    console.error('[Get Admin Profile Pic Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Generate Nominal Roll in Excel format
exports.generateNominalRoll = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { selectedCadets, heading } = req.body; // Array of cadet IDs and custom heading

    // Get admin info to determine FSFS/GNL category
    const adminResult = await pool.query(
      'SELECT ano_id, type, name as admin_name FROM admins WHERE id = $1',
      [adminId]
    );

    if (!adminResult.rows.length) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    const admin = adminResult.rows[0];
    
    // Determine FSFS/GNL based on admin type
    const getFsfsGnl = (adminType) => {
      // Customize this logic based on your business rules
      switch (adminType?.toLowerCase()) {
        case 'fsfs':
        case 'free_ship':
          return 'FSFS';
        case 'gnl':
        case 'general':
        default:
          return 'GNL';
      }
    };

    // Build query based on selected cadets
    let whereClause = 'WHERE u.ano_id = $1';
    let queryParams = [admin.ano_id];

    if (selectedCadets && selectedCadets !== 'all' && Array.isArray(selectedCadets) && selectedCadets.length > 0) {
      const placeholders = selectedCadets.map((_, index) => `$${index + 2}`).join(',');
      whereClause += ` AND u.id IN (${placeholders})`;
      queryParams = [admin.ano_id, ...selectedCadets];
    }

    // Fetch cadets data with optimized single query
    const cadetsResult = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.regimental_number,
        u.contact as mobile_no,
        p.father_name,
        p.address,
        p.dob,
        p.dietary_preference
      FROM users u
      LEFT JOIN users_profile p ON u.regimental_number = p.regimental_number
      ${whereClause}
      ORDER BY u.regimental_number
      `,
      queryParams
    );

    if (!cadetsResult.rows.length) {
      return res.status(404).json({ msg: 'No cadets found under this admin' });
    }

    // Prepare data for Excel
    const excelData = cadetsResult.rows.map((cadet, index) => ({
      'SL NO': index + 1,
      'NAME': cadet.name || '',
      'REG NO.': cadet.regimental_number || '',
      'FATHER NAME': cadet.father_name || '',
      'ADDRESS': cadet.address || '',
      'DOB': cadet.dob ? new Date(cadet.dob).toLocaleDateString('en-GB') : '',
      'MOBILE NO': cadet.mobile_no || '',
      'VEG/NONVEG': cadet.dietary_preference === 'vegetarian' ? 'VEG' : 
                    cadet.dietary_preference === 'non-vegetarian' ? 'NONVEG' : 
                    cadet.dietary_preference || 'N/A',
      'FSFS/GNL': getFsfsGnl(admin.type)
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
      { wch: 25 }, // FATHER NAME
      { wch: 35 }, // ADDRESS
      { wch: 12 }, // DOB
      { wch: 15 }, // MOBILE NO
      { wch: 12 }, // VEG/NONVEG
      { wch: 10 }  // FSFS/GNL
    ];
    worksheet['!cols'] = columnWidths;

    // Style the heading if it exists
    if (heading && heading.trim()) {
      // Merge cells across all columns for the heading
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];
      
      // Center align the heading
      if (!worksheet['A1'].s) worksheet['A1'].s = {};
      worksheet['A1'].s.alignment = { horizontal: 'center', vertical: 'center' };
      worksheet['A1'].s.font = { bold: true, size: 14 };
    }

    // Add worksheet to workbook
    const sheetName = `Nominal Roll - ${admin.admin_name}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nominal Roll');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    });

    // Set response headers for file download
    const fileName = `Nominal_Roll_${admin.ano_id}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);

  } catch (err) {
    console.error('[Generate Nominal Roll Error]', err);
    res.status(500).json({ msg: 'Server error while generating nominal roll' });
  }
};

// Get list of cadets under admin for selection
exports.getCadetsUnderAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get admin's ano_id
    const adminResult = await pool.query(
      'SELECT ano_id FROM admins WHERE id = $1',
      [adminId]
    );

    if (!adminResult.rows.length) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    const anoId = adminResult.rows[0].ano_id;

    // Get all cadets under this admin
    const cadetsResult = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.regimental_number,
        u.email,
        p.current_year,
        p.wing,
        p.category
      FROM users u
      LEFT JOIN users_profile p ON u.regimental_number = p.regimental_number
      WHERE u.ano_id = $1
      ORDER BY u.regimental_number
      `,
      [anoId]
    );

    res.json({
      success: true,
      cadets: cadetsResult.rows,
      total: cadetsResult.rows.length
    });

  } catch (err) {
    console.error('[Get Cadets Under Admin Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
