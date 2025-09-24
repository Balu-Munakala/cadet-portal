const express = require('express');
const router = express.Router();
const {
  requestPasswordReset,
  verifyOTP,
  resetPassword
} = require('../controllers/passwordResetController');

// Request password reset (send OTP)
router.post('/request', requestPasswordReset);

// Verify OTP
router.post('/verify-otp', verifyOTP);

// Reset password
router.post('/reset', resetPassword);

module.exports = router;