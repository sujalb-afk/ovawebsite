const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { sendEmail } = require('../utils/emailService');

router.post('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Subscription service is temporarily unavailable. Please try again later.',
      });
    }

    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await Newsletter.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(200).json({ success: false, message: 'This email is already subscribed.' });
    }

    const newsletter = new Newsletter({ email: normalizedEmail });
    await newsletter.save();

    // Send one email to the user only (welcome/confirmation)
    const subject = 'You\'re subscribed to OVA™ Newsletter';
    const html = `
      <p>Thank you for subscribing to OVA™ (Open Volunteer Association).</p>
      <p>You will receive our latest updates, events, and impact stories.</p>
      <p>— OVA™ Team</p>
    `;
    try {
      await sendEmail(normalizedEmail, subject, html);
    } catch (emailErr) {
      console.error('Newsletter confirmation email failed:', emailErr.message);
      // Still return success; subscription was saved
    }

    res.status(201).json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ success: false, message: 'This email is already subscribed.' });
    }
    const isDbError = mongoose.connection.readyState !== 1;
    res.status(isDbError ? 503 : 500).json({
      success: false,
      message: isDbError
        ? 'Subscription service is temporarily unavailable. Please try again later.'
        : 'Failed to subscribe. Please try again.',
    });
  }
});

module.exports = router;
