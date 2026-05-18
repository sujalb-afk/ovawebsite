const express = require('express');
const router = express.Router();
const Donate = require('../models/Donate');
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
    const {
      name,
      email,
      phone,
      address,
      pan,
      currency,
      transactionNumber,
      remark,
      amount,
      educationAmount,
      citizenship,
      recaptchaToken,
    } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Captcha verification failed. Please try again.' });
    }

    const donate = new Donate({
      name,
      email,
      phone: phone || '',
      address: address || '',
      pan: pan || '',
      currency: currency || 'INR',
      transactionNumber: transactionNumber || '',
      remark: remark || '',
      amount: amount || 0,
      educationAmount: educationAmount || 0,
      citizenship: citizenship || 'indian',
    });
    await donate.save();

    const totalAmount = (Number(amount) || 0) + (Number(educationAmount) || 0);
    const amountLine = totalAmount > 0 ? `Total: ${currency === 'INR' || !currency ? '₹' : ''}${totalAmount.toLocaleString()}${currency && currency !== 'INR' ? ' ' + currency : ''}` : '';

    // 1. Email to OVA admin
    const adminSubject = `[OVA Donation] ${name} – ${amountLine}`;
    const adminHtml = `
      <p><strong>Donor:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Phone:</strong> ${phone || '—'}</p>
      <p><strong>Address:</strong> ${(address || '—').replace(/\n/g, '<br/>')}</p>
      <p><strong>Citizenship:</strong> ${citizenship || 'indian'}</p>
      <p><strong>Amount:</strong> ${amountLine}</p>
      ${pan ? `<p><strong>PAN:</strong> ${pan}</p>` : ''}
      ${transactionNumber ? `<p><strong>Transaction No:</strong> ${transactionNumber}</p>` : ''}
      ${remark ? `<p><strong>Remark:</strong> ${remark}</p>` : ''}
    `;
    try {
      await sendEmail(ADMIN_EMAIL, adminSubject, adminHtml);
    } catch (e) {
      console.error('Donate admin email failed:', e.message);
    }

    // 2. Email to donor (confirmation)
    const donorSubject = 'Thank you for your donation – OVA™';
    const donorHtml = `
      <p>Dear ${name},</p>
      <p>Thank you for your generous support to OVA™ (Open Volunteer Association). We have received your donation details.</p>
      ${amountLine ? `<p><strong>${amountLine}</strong></p>` : ''}
      <p>If you have shared your PAN and transaction details, a soft copy of the receipt will be sent to this email once processed.</p>
      <p>— OVA™ Team</p>
    `;
    try {
      await sendEmail(email, donorSubject, donorHtml);
    } catch (e) {
      console.error('Donate donor confirmation email failed:', e.message);
    }

    res.status(201).json({ success: true, message: 'Donation details received. A confirmation has been sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit donation details' });
  }
});

module.exports = router;
