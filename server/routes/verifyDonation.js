const express = require('express');
const router = express.Router();
const Donate = require('../models/Donate');
const { amountInWords } = require('../utils/amountInWords');

/**
 * Format date for display (e.g. "7 March 2026").
 */
function formatDateOfDonation(date) {
  if (!date) return null;
  const d = new Date(date);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * GET /api/donations/verify/:receiptNumber
 * Public endpoint for QR-based donation verification. Returns only safe, display-only fields.
 * Optional query: ?token= for verificationToken match.
 */
async function verifyDonation(req, res) {
  try {
    const receiptNumber = (req.params.receiptNumber || '').trim();
    const token = (req.query.token || '').trim();

    if (!receiptNumber) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Receipt number is required.',
      });
    }

    const filter = { receiptNumber };
    if (token) filter.verificationToken = token;

    const donation = await Donate.findOne(filter).lean();

    if (!donation) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Invalid or unverified donation receipt.',
      });
    }

    if (donation.paymentStatus !== 'success') {
      return res.status(200).json({
        success: true,
        verified: false,
        message: 'Receipt found but payment is not completed.',
        data: null,
      });
    }

    const totalAmount = (Number(donation.amount) || 0) + (Number(donation.educationAmount) || 0);
    const dateOfDonation = formatDateOfDonation(donation.createdAt);
    const purpose = donation.remark && donation.remark.trim() ? donation.remark.trim() : 'Donation to OVA™';
    const modeOfDonation = donation.paymentMethod === 'razorpay' ? 'Online / Razorpay' : (donation.paymentMethod || '—');

    // Return only safe, display-only fields (no _id, Razorpay IDs, tokens, timestamps).
    res.status(200).json({
      success: true,
      verified: true,
      message: 'Verified Donation Receipt',
      data: {
        receiptNumber: donation.receiptNumber,
        donorName: donation.name,
        email: donation.email || '—',
        mobile: donation.phone || '—',
        address: donation.address || '—',
        amount: totalAmount,
        amountWords: amountInWords(Math.round(totalAmount)),
        purpose,
        modeOfDonation,
        dateOfDonation: dateOfDonation || '—',
      },
    });
  } catch (err) {
    console.error('Verify donation error:', err.message);
    res.status(500).json({
      success: false,
      verified: false,
      message: 'Verification failed. Please try again.',
    });
  }
}

router.get('/verify/:receiptNumber', verifyDonation);

module.exports = router;
