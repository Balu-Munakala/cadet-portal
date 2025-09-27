const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const masterController = require('../controllers/masterController');

// GET master full profile
router.get('/profile', authenticate, masterController.getProfile);

// POST: Update master profile
router.post('/update-master-profile', authenticate, masterController.updateProfile);

// POST: Upload master profile picture (Base64)
router.post(
  '/upload-profile-pic',
  authenticate,
  masterController.uploadProfilePic
);

// GET: Serve master profile picture
router.get('/profile-pic', authenticate, masterController.getProfilePic);

// GET: Get all users for master nominal roll
router.get('/all-users', authenticate, masterController.getAllUsers);

// POST: Generate master nominal roll
router.post('/generate-nominal-roll', authenticate, masterController.generateMasterNominalRoll);

module.exports = router;
