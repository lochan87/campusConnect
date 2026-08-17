const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { sendPasswordResetEmail } = require('../services/emailService');

/**
 * POST /api/auth/forgot-password
 * Generates a Firebase password reset link and sends a branded email via Nodemailer.
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email format.' });
  }

  try {
    // Step 1: Verify user exists in Firebase
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (err) {
      // Don't reveal if user exists (security best practice)
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Step 2: Generate Firebase password reset link (uses Firebase's secure token)
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/login?reset=success`,
      handleCodeInApp: false,
    };
    const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    // Step 3: Send our custom branded email
    await sendPasswordResetEmail(email, resetLink, userRecord.displayName || '');

    return res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully.',
    });

  } catch (error) {
    console.error('Error in forgot-password route:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send password reset email. Please try again.',
    });
  }
});

module.exports = router;
