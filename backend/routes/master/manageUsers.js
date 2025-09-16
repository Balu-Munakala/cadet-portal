const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const manageUsersController = require('../../controllers/masterManageUsersController');

// All routes under /api/master/manage-users

// GET /api/master/manage-users
// Return all cadets (only Master may call)
router.get('/', authenticate, manageUsersController.getAllCadets);

// PUT /api/master/manage-users/:regimental_number/enable
// Approve a cadet (set is_approved = TRUE)
router.put('/:regimental_number/enable', authenticate, manageUsersController.enableCadet);

// PUT /api/master/manage-users/:regimental_number/disable
// Disapprove a cadet (set is_approved = FALSE)
router.put('/:regimental_number/disable', authenticate, manageUsersController.disableCadet);

// DELETE /api/master/manage-users/:regimental_number
// Permanently delete a cadet
router.delete('/:regimental_number', authenticate, manageUsersController.deleteCadet);

module.exports = router;