const express = require('express');
const router = express.Router();
const Join = require('../models/Join');
const { sendEmail, ADMIN_EMAIL } = require('../utils/emailService');

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
    const { name, email, phone, role, skills, message, recaptchaToken } = req.body;
    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Name, email and phone are required.' });
    }
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Captcha verification failed. Please try again.' });
    }
    const join = new Join({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      role: (role || '').trim(),
      skills: (skills || '').trim(),
      message: (message || '').trim(),
    });
    await join.save();

    if (ADMIN_EMAIL) {
      const subject = `[OVA Join Us] New volunteer application – ${name}`;
      const html = `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Preferred role:</strong> ${role || '—'}</p>
        <p><strong>Skills / interests:</strong> ${skills || '—'}</p>
        <p><strong>Message:</strong></p>
        <p>${(message || '—').replace(/\n/g, '<br/>')}</p>
      `;
      try {
        await sendEmail(ADMIN_EMAIL, subject, html);
      } catch (e) {
        console.error('Join admin email failed:', e.message);
      }
    }

    res.status(201).json({ success: true, message: 'Application submitted successfully! We\'ll get back to you soon.' });
  } catch (error) {
    console.error('Join submit error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to submit application. Please try again.' });
  }
});

module.exports = router;
