// backend/routes/events.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
// It's good practice to also have a role-check middleware
// const { isAdmin } = require('../middleware/roleMiddleware');
const eventsController = require('../controllers/eventsController');

// For this example, we'll assume 'authenticate' handles basic login checks,
// and the controller logic will handle if the user is an admin (ANO).

// ────────────────────────────────────────────────────────────────────────────────
//   ADMIN (ANO) ENDPOINTS
//   Scoped under /api/events/admin/*
// ────────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/events/admin
 * @desc    Create a new event
 * @access  Private (Admin)
 */
router.post('/admin', authenticate, eventsController.createEvent);

/**
 * @route   GET /api/events/admin
 * @desc    List all events managed by the admin (ANO)
 * @access  Private (Admin)
 */
router.get('/admin', authenticate, eventsController.getAdminEvents);

/**
 * @route   GET /api/events/admin/:eventId
 * @desc    Get details for a single event (admin view)
 * @access  Private (Admin)
 */
router.get('/admin/:eventId', authenticate, eventsController.getAdminEventById);

/**
 * @route   GET /api/events/admin/:eventId/attendees
 * @desc    Get a list of cadets who have RSVP'd to an event
 * @access  Private (Admin)
 */
router.get('/admin/:eventId/attendees', authenticate, eventsController.getEventAttendees);

/**
 * @route   PUT /api/events/admin/:eventId
 * @desc    Update an existing event
 * @access  Private (Admin)
 */
router.put('/admin/:eventId', authenticate, eventsController.updateEvent);

/**
 * @route   DELETE /api/events/admin/:eventId
 * @desc    Delete an event
 * @access  Private (Admin)
 */
router.delete('/admin/:eventId', authenticate, eventsController.deleteEvent);


// ────────────────────────────────────────────────────────────────────────────────
//   CADET (USER) ENDPOINTS
//   Scoped under /api/events/*
// ────────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/events
 * @desc    List all available events for the cadet
 * @access  Private
 */
router.get('/', authenticate, eventsController.getUserEvents);

/**
 * @route   GET /api/events/upcoming
 * @desc    Get a list of upcoming events
 * @access  Private
 */
router.get('/upcoming', authenticate, eventsController.getUpcomingEvents);

/**
 * @route   GET /api/events/past
 * @desc    Get a list of past events
 * @access  Private
 */
router.get('/past', authenticate, eventsController.getPastEvents);

/**
 * @route   GET /api/events/:eventId
 * @desc    Get details for a single event
 * @access  Private
 */
router.get('/:eventId', authenticate, eventsController.getEventById);

/**
 * @route   POST /api/events/:eventId/rsvp
 * @desc    Register (RSVP) for an event
 * @access  Private
 */
router.post('/:eventId/rsvp', authenticate, eventsController.rsvpForEvent);

/**
 * @route   DELETE /api/events/:eventId/rsvp
 * @desc    Cancel an RSVP for an event
 * @access  Private
 */
router.delete('/:eventId/rsvp', authenticate, eventsController.cancelRsvp);


module.exports = router;