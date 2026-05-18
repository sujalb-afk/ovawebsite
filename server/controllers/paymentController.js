const crypto = require('crypto');
const Razorpay = require('razorpay');
const Donate = require('../models/Donate');
const {
  sendDonationReceiptEmail,
  sendAdminNotification,
} = require('../utils/sendEmail');
const {
  generateReceiptNumber,
  generateReceiptPDF,
  formatDate,
} = require('../utils/generateReceipt');
const { amountInWords } = require('../utils/amountInWords');
const { generateVerificationUrl } = require('../utils/qrCode');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const MIN_AMOUNT_PAISE = 100; // ₹1 minimum
const MAX_AMOUNT_PAISE = 100000000; // ₹10 lakh max (1 crore paise = 1 lakh INR... 100000000 paise = 10 lakh)

/**
 * POST /api/create-order
 * Creates a Razorpay order for the donation amount (amount in INR, we convert to paise).
 */
async function createOrder(req, res) {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Create order: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in .env');
      return res.status(503).json({
        success: false,
        message: 'Payment gateway is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server .env file.',
      });
    }

    const amountINR = Number(req.body.amount);
    if (Number.isNaN(amountINR) || amountINR < 1) {
      return res.status(400).json({ success: false, message: 'Invalid or missing donation amount.' });
    }

    const amountPaise = Math.round(amountINR * 100);
    if (amountPaise < MIN_AMOUNT_PAISE) {
      return res.status(400).json({ success: false, message: 'Minimum donation amount is ₹1.' });
    }
    if (amountPaise > MAX_AMOUNT_PAISE) {
      return res.status(400).json({ success: false, message: 'Donation amount exceeds maximum allowed.' });
    }

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `ova_donation_${Date.now()}`,
    });

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error.message || error);
    const isConfig = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET;
    const message = isConfig
      ? 'Payment gateway is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the server .env file.'
      : (error.description || error.message || 'Failed to create payment order. Check server logs.');
    res.status(isConfig ? 503 : 500).json({
      success: false,
      message,
    });
  }
}

/**
 * Verify Razorpay signature using HMAC SHA256.
 */
function verifySignature(orderId, paymentId, signature) {
  if (!RAZORPAY_KEY_SECRET) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
}

/**
 * Run receipt generation, donor email, and admin email in background.
 * Does not block the HTTP response. Logs each step.
 */
function runPostVerificationTasks(payload) {
  const {
    donateId,
    name,
    email,
    phone,
    address,
    pan,
    remark,
    totalAmount,
    razorpay_payment_id,
    receiptNumber,
  } = payload;

  const dateOfDonationStr = payload.dateOfDonationStr;
  const amountWords = payload.amountInWords;

  (async () => {
    let pdfBuffer = null;
    let receiptPath = null;

    try {
      console.log('[VerifyPayment] receipt generation started', { donateId, receiptNumber });
      const verificationUrl = generateVerificationUrl(receiptNumber);
      const result = await generateReceiptPDF({
        receiptNumber,
        donorName: name,
        address: address || '—',
        mobile: phone || '—',
        email,
        purpose: remark ? `Donation to OVA – ${remark}` : 'Donation to OVA',
        modeOfDonation: 'Online / Razorpay',
        dateOfDonation: dateOfDonationStr,
        amount: totalAmount,
        amountInWords: amountWords,
        pan: pan || undefined,
        razorpayPaymentId: razorpay_payment_id,
        verificationUrl,
      });
      pdfBuffer = result.buffer;
      receiptPath = result.filePath;
      await Donate.updateOne(
        { _id: donateId },
        { $set: { receiptNumber, receiptPath } }
      );
      console.log('[VerifyPayment] receipt generation completed', { receiptNumber });
    } catch (e) {
      console.error('[VerifyPayment] receipt generation failed:', e.message);
    }

    try {
      console.log('[VerifyPayment] donor email started', { email });
      if (pdfBuffer && pdfBuffer.length > 0) {
        const donorEmailResult = await sendDonationReceiptEmail(email, name, pdfBuffer, {
          amount: totalAmount,
          date: dateOfDonationStr,
          modeOfDonation: 'Online (Razorpay)',
          receiptNumber,
        });
        if (donorEmailResult.success) {
          console.log('[VerifyPayment] donor email completed', { email });
        } else {
          console.error('[VerifyPayment] donor email failed:', donorEmailResult.error || 'unknown');
        }
      } else {
        console.log('[VerifyPayment] donor email skipped (no PDF buffer)');
      }
    } catch (e) {
      console.error('[VerifyPayment] donor email failed:', e.message);
    }

    try {
      console.log('[VerifyPayment] admin email started');
      const adminResult = await sendAdminNotification({
        name,
        email,
        phone: phone || '—',
        amount: totalAmount,
        paymentId: razorpay_payment_id,
        date: dateOfDonationStr,
        receiptNumber: receiptNumber || undefined,
        modeOfDonation: 'Online (Razorpay)',
        pdfBuffer: pdfBuffer || undefined,
      });
      if (adminResult.success) {
        console.log('[VerifyPayment] admin email completed');
      } else if (adminResult.skipped) {
        console.log('[VerifyPayment] admin email skipped (no SMTP)');
      } else {
        console.error('[VerifyPayment] admin email failed:', adminResult.error || 'unknown');
      }
    } catch (e) {
      console.error('[VerifyPayment] admin email failed:', e.message);
    }
  })();
}

/**
 * POST /api/verify-payment
 * Verifies Razorpay signature and saves donation record. Responds immediately;
 * receipt PDF and emails are sent in the background.
 */
async function verifyPayment(req, res) {
  try {
    console.log('[VerifyPayment] request received', {
      razorpay_order_id: req.body?.razorpay_order_id,
      razorpay_payment_id: req.body?.razorpay_payment_id ? '[present]' : undefined,
    });

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
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
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details.',
      });
    }

    const valid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Signature invalid.',
      });
    }
    console.log('[VerifyPayment] payment verified', { razorpay_order_id, razorpay_payment_id });

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const totalAmount = (Number(amount) || 0) + (Number(educationAmount) || 0);
    const donate = new Donate({
      name: name.trim(),
      email: email.trim(),
      phone: phone || '',
      address: address || '',
      pan: pan || '',
      currency: currency || 'INR',
      transactionNumber: transactionNumber || '',
      remark: remark || '',
      amount: Number(amount) || 0,
      educationAmount: Number(educationAmount) || 0,
      citizenship: citizenship || 'indian',
      paymentMethod: 'razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentStatus: 'success',
    });
    await donate.save();
    console.log('[VerifyPayment] donation saved', { donateId: donate._id, email: donate.email });

    const totalDonations = await Donate.countDocuments();
    const receiptNumber = generateReceiptNumber(99 + totalDonations);
    const donationDate = donate.createdAt || new Date();
    const dateOfDonationStr = formatDate(donationDate);
    const amountWords = amountInWords(Math.round(totalAmount));

    // Respond immediately; do not block on PDF or emails
    res.status(200).json({
      success: true,
      message: 'Payment verified. Thank you for your donation!',
      receiptNumber,
    });

    // Run receipt + emails in background (fire-and-forget)
    runPostVerificationTasks({
      donateId: donate._id,
      name: name.trim(),
      email: email.trim(),
      phone: phone || '',
      address: address || '',
      pan: pan || '',
      remark: remark || '',
      totalAmount,
      razorpay_payment_id,
      receiptNumber,
      dateOfDonationStr,
      amountInWords: amountWords,
    });
  } catch (error) {
    console.error('[VerifyPayment] error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment.',
    });
  }
}

module.exports = { createOrder, verifyPayment };
