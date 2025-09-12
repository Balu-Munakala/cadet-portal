// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const { Pool } = require('pg');

dotenv.config();

// PostgreSQL connection pool using DATABASE_URL from Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test the database connection
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err);
    process.exit(1);
  }
})();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Main API routes
app.use('/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/master', require('./routes/master'));
app.use('/api/fallin', require('./routes/fallin'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/achievements', require('./routes/achievements'));
// app.use('/api/events', require('./routes/admin/events'));
app.use('/api/support-queries', require('./routes/supportQueries'));
app.use('/api/change-password', require('./routes/changePassword'));

// Admin-specific sub-routes
app.use('/api/admin/manage-users', require('./routes/admin/manageUsers'));
app.use('/api/admin/reports', require('./routes/admin/adminReports'));
app.use('/api/admin/notifications', require('./routes/admin/notifications'));
app.use('/api/admin/events', require('./routes/admin/events')); // Assuming this is an admin event management route

// Master-specific sub-routes
app.use('/api/master/manage-admins', require('./routes/master/manageAdmins'));
app.use('/api/master/manage-users', require('./routes/admin/manageUsers'));
app.use('/api/master/notification-manager', require('./routes/master/notificationManager'));
app.use('/api/master/platform-config', require('./routes/master/platformConfig'));
app.use('/api/master/global-search', require('./routes/master/globalSearch'));
app.use('/api/master/support-queries', require('./routes/master/supportQueries'));
app.use('/api/master/system-logs', require('./routes/master/systemLogs'));
app.use('/api/master/system-reports', require('./routes/master/systemReports'));
app.use('/api/master/backup-restore', require('./routes/master/backupRestore'));

// Root health check
app.get('/', (req, res) => res.send('GITAM NCC API is live!'));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
