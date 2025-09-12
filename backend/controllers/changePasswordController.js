const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { tokenBlacklist } = require('../middleware/authMiddleware');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  secure: process.env.NODE_ENV === 'production',
};

exports.changePassword = async (req, res) => {
  const { userType } = req.user;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Both current and new passwords are required.' });
  }

  try {
    // ── 1) Handle cadet (user)
    if (userType === 'user') {
      const userId = req.user.id;
      const userResult = await pool.query(
        `SELECT password_hash, regimental_number FROM users WHERE id = $1`,
        [userId]
      );
      if (!userResult.rows.length) {
        return res.status(404).json({ message: 'Cadet not found.' });
      }
      const { password_hash, regimental_number } = userResult.rows[0];
      const isMatch = await bcrypt.compare(current_password, password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }
      const newIsSame = await bcrypt.compare(new_password, password_hash);
      if (newIsSame) {
        return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
      }
      const newHash = await bcrypt.hash(new_password, 12);
      await pool.query(
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newHash, userId]
      );
      const notifMessage = 'Your password was changed successfully.';
      const notifLink = '/cadet/profile';
      await pool.query(
        `INSERT INTO notifications (regimental_number, type, message, link) VALUES ($1, $2, $3, $4)`,
        [regimental_number, 'Password', notifMessage, notifLink]
      );
      return res.json({ success: true });
    }

    // ── 2) Handle admin (ANO)
    if (userType === 'admin') {
      const adminId = req.user.id;
      const adminResult = await pool.query(
        `SELECT password_hash FROM admins WHERE id = $1`,
        [adminId]
      );
      if (!adminResult.rows.length) {
        return res.status(404).json({ message: 'Admin not found.' });
      }
      const { password_hash } = adminResult.rows[0];
      const isMatch = await bcrypt.compare(current_password, password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }
      const newIsSame = await bcrypt.compare(new_password, password_hash);
      if (newIsSame) {
        return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
      }
      const newHash = await bcrypt.hash(new_password, 12);
      await pool.query(
        `UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newHash, adminId]
      );
      return res.json({ success: true });
    }

    // ── 3) Handle master
    if (userType === 'master') {
      const masterPhone = req.user.phone;
      const masterResult = await pool.query(
        `SELECT password_hash FROM masters WHERE phone = $1`,
        [masterPhone]
      );
      if (!masterResult.rows.length) {
        return res.status(404).json({ message: 'Master not found.' });
      }
      const { password_hash } = masterResult.rows[0];
      const isMatch = await bcrypt.compare(current_password, password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }
      const newIsSame = await bcrypt.compare(new_password, password_hash);
      if (newIsSame) {
        return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
      }
      const newHash = await bcrypt.hash(new_password, 12);
      await pool.query(
        `UPDATE masters SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE phone = $2`,
        [newHash, masterPhone]
      );
      return res.json({ success: true });
    }

    return res.status(403).json({ message: 'Not authorized to change password.' });
  } catch (err) {
    console.error('[Change Password Error]', err);
    return res.status(500).json({ message: 'Server error while changing password.' });
  }
};
