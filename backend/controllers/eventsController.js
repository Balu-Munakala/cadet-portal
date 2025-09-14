// backend/routes/events.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const eventsController = require('../controllers/eventsController');

// ────────────────────────────────────────────────────────────────────────────────
//   ADMIN (ANO) ENDPOINTS
// ────────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/events/admin
 * @desc    List all events for the logged-in ANO
 * @access  Private (Admin)
 */
router.get('/admin', authenticate, eventsController.getAdminEvents);

/**
 * @route   POST /api/events/admin
 * @desc    Create a new event and notify cadets
 * @access  Private (Admin)
 */
router.post('/admin', authenticate, eventsController.createEvent);

/**
 * @route   PUT /api/events/admin/:eventId
 * @desc    Update an existing event and notify cadets
 * @access  Private (Admin)
 */
router.put('/admin/:eventId', authenticate, eventsController.updateEvent);

/**
 * @route   DELETE /api/events/admin/:eventId
 * @desc    Delete an event and notify cadets
 * @access  Private (Admin)
 */
router.delete('/admin/:eventId', authenticate, eventsController.deleteEvent);


// ────────────────────────────────────────────────────────────────────────────────
//   CADET (USER) ENDPOINT
// ────────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/events
 * @desc    List all events available to the cadet
 * @access  Private
 */
router.get('/', authenticate, eventsController.getUserEvents);

module.exports = router;