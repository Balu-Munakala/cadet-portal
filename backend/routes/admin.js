const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// GET full admin profile
router.get('/profile', authenticate, adminController.getProfile);

// POST: Update admin profile
router.post('/update-admin-profile', authenticate, adminController.updateProfile);

// POST: Upload admin profile picture (Base64)
router.post(
  '/upload-profile-pic',
  authenticate,
  adminController.uploadProfilePic
);

// GET: Serve admin profile picture
router.get('/profile-pic', authenticate, adminController.getProfilePic);

// GET: Get list of cadets under admin
router.get('/cadets', authenticate, adminController.getCadetsUnderAdmin);

// POST: Generate nominal roll in Excel format
router.post('/generate-nominal-roll', authenticate, adminController.generateNominalRoll);

module.exports = router;
