// routes/notifications.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const notificationsController = require('../controllers/notificationsController');

// --- NEW ROUTE for Admins to post notifications ---
/**
 * @route   POST /api/notifications
 * @desc    Admin (ANO) posts a notification to all their assigned cadets
 * @access  Private (Admin)
 */
router.post('/', authenticate, notificationsController.createCadetNotification);

// --- NEW ROUTE for Admins to view their sent notifications ---
/**
 * @route   GET /api/notifications/admin
 * @desc    Fetch all notifications sent by the logged-in admin
 * @access  Private (Admin)
 */
router.get('/admin', authenticate, notificationsController.getAdminNotifications);

/**
 * @route   GET /api/notifications/user
 * @desc    Fetch all notifications for the logged-in cadet
 * @access  Private (User)
 */
router.get('/user', authenticate, notificationsController.getUserNotifications);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark a single notification as read
 * @access  Private (User)
 */
router.put('/:notificationId/read', authenticate, notificationsController.markAsRead);

module.exports = router;