const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { tokenBlacklist } = require('../middleware/authMiddleware');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  secure: process.env.NODE_ENV === 'production',
};

// ─── Register a new cadet (user) ─────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  const { regimental_number, name, email, contact, password, ano_id } = req.body;
  if (!regimental_number || !name || !email || !password || !ano_id) {
    return res.status(400).json({ msg: 'Missing required fields.' });
  }
  try {
    const existsResult = await pool.query(
      `SELECT id
       FROM users
       WHERE email = $1 OR regimental_number = $2`,
      [email, regimental_number]
    );
    if (existsResult.rows.length) {
      return res.status(400).json({ msg: 'User already exists.' });
    }

    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO users
       (regimental_number, name, email, contact, password_hash, ano_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [regimental_number, name, email, contact || null, hash, ano_id]
    );

    return res.json({ msg: 'User registration successful.' });
  } catch (err) {
    console.error('registerUser error:', err);
    return res.status(500).json({ msg: 'Server error.' });
  }
};

// ─── Register a new admin (ANO / Caretaker) ────────────────────────────
exports.registerAdmin = async (req, res) => {
  const { anoId, role, name, email, contact, password, type } = req.body;
  if (!anoId || !role || !name || !email || !password || !type) {
    return res.status(400).json({ msg: 'Missing required fields.' });
  }
  try {
    const existsResult = await pool.query(
      `SELECT id
       FROM admins
       WHERE email = $1 OR ano_id = $2`,
      [email, anoId]
    );
    if (existsResult.rows.length) {
      return res.status(400).json({ msg: 'Admin already registered.' });
    }

    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO admins
       (ano_id, role, name, email, contact, password_hash, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [anoId, role, name, email, contact || null, hash, type]
    );

    return res.json({ msg: 'Admin registration successful (pending approval).' });
  } catch (err) {
    console.error('registerAdmin error:', err);
    return res.status(500).json({ msg: 'Server error.' });
  }
};

// ─── Unified login for cadets (users), masters, and admins ──────────────────
exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ msg: 'Missing credentials.' });
  }

  try {
    // 1) Check users table by regimental_number
    const userResult = await pool.query(
      `SELECT id, regimental_number, ano_id, password_hash, is_approved
       FROM users
       WHERE regimental_number = $1`,
      [identifier]
    );
    
    if (userResult.rows.length) {
      const cadet = userResult.rows[0];
      if (!cadet.is_approved) {
        return res.status(403).json({ msg: 'User account pending approval.' });
      }
      if (await bcrypt.compare(password, cadet.password_hash)) {
        const payload = {
          userType: 'user',
          id: cadet.id,
          regimental_number: cadet.regimental_number,
          ano_id: cadet.ano_id
        };
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
        return res
          .cookie('token', token, COOKIE_OPTS)
          .json({ redirect: '/cadet' });
      } else {
        return res.status(401).json({ msg: 'Invalid credentials.' });
      }
    }

    // 2) Check admins table by ano_id
    const adminResult = await pool.query(
      `SELECT id, ano_id, role, password_hash, is_approved
       FROM admins
       WHERE ano_id = $1`,
      [identifier]
    );
    
    if (adminResult.rows.length) {
      const admin = adminResult.rows[0];
      if (!admin.is_approved) {
        return res.status(403).json({ msg: 'Admin account pending approval.' });
      }
      if (await bcrypt.compare(password, admin.password_hash)) {
        const payload = {
          userType: 'admin',
          id: admin.id,
          ano_id: admin.ano_id,
          role: admin.role
        };
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
        return res
          .cookie('token', token, COOKIE_OPTS)
          .json({ redirect: '/admin' });
      } else {
        return res.status(401).json({ msg: 'Invalid credentials.' });
      }
    }

    // 3) Check masters table by phone
    const masterResult = await pool.query(
      `SELECT phone, password_hash, is_active
       FROM masters
       WHERE phone = $1`,
      [identifier]
    );
    
    if (masterResult.rows.length) {
      const master = masterResult.rows[0];
      if (!master.is_active) {
        return res.status(403).json({ msg: 'Master account disabled.' });
      }
      if (await bcrypt.compare(password, master.password_hash)) {
        const payload = {
          userType: 'master',
          phone: master.phone
        };
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
        return res
          .cookie('token', token, COOKIE_OPTS)
          .json({ redirect: '/administrator' });
      } else {
        return res.status(401).json({ msg: 'Invalid credentials.' });
      }
    }

    return res.status(401).json({ msg: 'Invalid credentials.' });
    
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ msg: 'Server error.' });
  }
};

// ─── Fetch list of all approved ANOs ────────────────────────────────────────
exports.getAnos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ano_id, name, role
       FROM admins
       WHERE is_approved = TRUE`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[Fetch ANOs Error]', err);
    return res.status(500).json({ msg: 'Server error.' });
  }
};

// ─── Logout: Clear the "token" cookie and blacklist the token ───────────────
exports.logout = (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    tokenBlacklist.add(token);
  }
  return res.clearCookie('token', COOKIE_OPTS).sendStatus(200);
};

// ─── Protected: Return the decoded JWT payload ──────────────────────────────
exports.validateRole = (req, res) => {
  return res.json({ user: req.user });
};