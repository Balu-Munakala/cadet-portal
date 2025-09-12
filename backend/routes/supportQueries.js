const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const supportQueriesController = require('../controllers/supportQueriesController');

// USER endpoints:
// POST   /api/support-queries         → create a new query
// GET    /api/support-queries/user    → list own queries
router.post('/', authenticate, supportQueriesController.createQuery);
router.get('/user', authenticate, supportQueriesController.getUserQueries);

// ADMIN endpoints:
// GET    /api/support-queries/admin          → list all queries
// PUT    /api/support-queries/admin/:queryId → reply (and close) a query
// DELETE /api/support-queries/admin/:queryId → delete a query
router.get('/admin', authenticate, supportQueriesController.getAllQueries);
router.put('/admin/:queryId', authenticate, supportQueriesController.replyToQuery);
router.delete('/admin/:queryId', authenticate, supportQueriesController.deleteQuery);

module.exports = router;
