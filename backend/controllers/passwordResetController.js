const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure nodemailer (you'll need to set up your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER, // Add to your .env file
    pass: process.env.EMAIL_PASS  // Add to your .env file
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request password reset - send OTP
const requestPasswordReset = async (req, res) => {
  const { email, userType } = req.body;

  if (!email || !userType) {
    return res.status(400).json({ message: 'Email and user type are required' });
  }

  try {
    // Check if user exists in the appropriate table
    let userCheckQuery;
    let userTable;
    
    switch (userType) {
      case 'user':
        userCheckQuery = 'SELECT email, name FROM users WHERE email = $1';
        userTable = 'users';
        break;
      case 'admin':
        userCheckQuery = 'SELECT email, name FROM admins WHERE email = $1';
        userTable = 'admins';
        break;
      case 'master':
        userCheckQuery = 'SELECT email, name FROM masters WHERE email = $1';
        userTable = 'masters';
        break;
      default:
        return res.status(400).json({ message: 'Invalid user type' });
    }

    const userResult = await db.query(userCheckQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    const user = userResult.rows[0];
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in password_resets table (PostgreSQL syntax)
    // First, delete any existing reset request for this email and user type
    await db.query(
      'DELETE FROM password_resets WHERE email = $1 AND user_type = $2',
      [email, userType]
    );
    
    // Then insert the new OTP request
    await db.query(
      'INSERT INTO password_resets (email, otp, user_type, expires_at) VALUES ($1, $2, $3, $4)',
      [email, otp, userType, expiresAt]
    );

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - Cadet Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You have requested to reset your password for the Cadet Portal. Please use the following OTP:</p>
          <div style="background: #f0f8ff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #d4af37; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from Cadet Portal. Please do not reply.</p>
        </div>
      `
    };

    // Send OTP via email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'OTP sent successfully to your email address',
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2') // Partially hide email
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  const { email, otp, userType } = req.body;

  if (!email || !otp || !userType) {
    return res.status(400).json({ message: 'Email, OTP, and user type are required' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM password_resets WHERE email = $1 AND user_type = $2 AND otp = $3 AND expires_at > NOW()',
      [email, userType, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.status(200).json({ message: 'OTP verified successfully' });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'OTP verification failed' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword, userType } = req.body;

  if (!email || !otp || !newPassword || !userType) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // Verify OTP again
    const otpResult = await db.query(
      'SELECT * FROM password_resets WHERE email = $1 AND user_type = $2 AND otp = $3 AND expires_at > NOW()',
      [email, userType, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in the appropriate table
    let updateQuery;
    switch (userType) {
      case 'user':
        updateQuery = 'UPDATE users SET password_hash = $1 WHERE email = $2';
        break;
      case 'admin':
        updateQuery = 'UPDATE admins SET password_hash = $1 WHERE email = $2';
        break;
      case 'master':
        updateQuery = 'UPDATE masters SET password_hash = $1 WHERE email = $2';
        break;
      default:
        return res.status(400).json({ message: 'Invalid user type' });
    }

    await db.query(updateQuery, [hashedPassword, email]);

    // Delete the used OTP
    await db.query('DELETE FROM password_resets WHERE email = $1 AND user_type = $2', [email, userType]);

    res.status(200).json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Password reset failed' });
  }
};

// Clean up expired OTPs (optional - can be called periodically)
const cleanupExpiredOTPs = async () => {
  try {
    await db.execute('DELETE FROM password_resets WHERE expires_at < NOW()');
  } catch (error) {
    console.error('Cleanup expired OTPs error:', error);
  }
};

module.exports = {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
  cleanupExpiredOTPs
};