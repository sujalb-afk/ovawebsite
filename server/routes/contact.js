const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { sendContactAdminEmail, sendContactUserConfirmation } = require('../utils/emailService');

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

async function verifyRecaptcha(token) {
  if (!RECAPTCHA_SECRET || !token) return false;
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token }),
    });
    const data = await res.json();
    return data?.success === true;
  } catch (e) {
    console.error('Recaptcha verify error:', e.message);
    return false;
  }
}

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, phone, recaptchaToken } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    }
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Captcha verification failed. Please try again.' });
    }
    const contact = new Contact({ name, email, subject: subject || '', message });
    await contact.save();

    // 1. Email to OVA admin (branded template with logo, all ADMIN_EMAIL from .env)
    try {
      await sendContactAdminEmail({ name, email, phone: phone || '', subject: subject || '', message: message || '' });
    } catch (e) {
      console.error('Contact admin email failed:', e.message);
    }

    // 2. Email to user (branded confirmation with logo)
    try {
      await sendContactUserConfirmation({ name, email });
    } catch (e) {
      console.error('Contact user confirmation email failed:', e.message);
    }

    res.status(201).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

module.exports = router;
