const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// GET full user profile
router.get('/profile', authenticate, userController.getProfile);

// POST: Update user profile
router.post('/update-profile', authenticate, userController.updateProfile);

// POST: Upload profile picture (Base64)
router.post(
  '/upload-profile-pic',
  authenticate,
  userController.uploadProfilePic
);

// GET: Serve profile picture
router.get('/profile-pic', authenticate, userController.getProfilePic);

module.exports = router;
