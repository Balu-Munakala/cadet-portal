// routes/notifications.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const notificationsController = require('../controllers/notificationsController');

// ----------------------------------------------------
// --           EXISTING ROUTES (IMPROVED)           --
// ----------------------------------------------------

/**
 * @route   GET /api/notifications/user
 * @desc    Fetch all notifications for the logged-in user
 * @access  Private
 */
router.get('/user', authenticate, notificationsController.getUserNotifications);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.put('/:notificationId/read', authenticate, notificationsController.markAsRead);


// ----------------------------------------------------
// --              NEW & EXPANDED ROUTES             --
// ----------------------------------------------------

/**
 * @route   GET /api/notifications/user/unread/count
 * @desc    Get the count of unread notifications for the user
 * @access  Private
 */
router.get('/user/unread/count', authenticate, notificationsController.getUnreadCount);

/**
 * @route   PUT /api/notifications/user/read-all
 * @desc    Mark all of a user's notifications as read
 * @access  Private
 */
router.put('/user/read-all', authenticate, notificationsController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a single notification by its ID
 * @access  Private
 */
router.delete('/:notificationId', authenticate, notificationsController.deleteNotification);

/**
 * @route   DELETE /api/notifications/user/clear-all
 * @desc    Delete ALL notifications for the logged-in user
 * @access  Private
 */
router.delete('/user/clear-all', authenticate, notificationsController.deleteAllNotifications);


module.exports = router;