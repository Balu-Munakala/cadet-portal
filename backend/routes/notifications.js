// routes/notifications.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const notificationsController = require('../controllers/notificationsController');

/**
 * @route   GET /api/notifications/user
 * @desc    Fetch all notifications for the logged-in cadet
 * @access  Private
 */
router.get('/user', authenticate, notificationsController.getUserNotifications);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.put('/:notificationId/read', authenticate, notificationsController.markAsRead);

module.exports = router;