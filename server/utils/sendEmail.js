const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const { generateVerificationUrl, generateQrCodeBuffer } = require('./qrCode');

// Amazon SES SMTP – trim env to avoid auth issues
const SMTP_HOST = (process.env.SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com').trim();
const SMTP_PORT = parseInt(String(process.env.SMTP_PORT || '587').trim(), 10);
const SMTP_USER = process.env.SMTP_USER ? String(process.env.SMTP_USER).trim() : '';
const SMTP_PASS = process.env.SMTP_PASS ? String(process.env.SMTP_PASS).trim() : '';

const EMAIL_FROM = (process.env.EMAIL_FROM || 'donation@ova.ngo').trim();
/** Admin inbox(es): from .env ADMIN_EMAIL only (comma-separated). No fallback. */
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim();

/**
 * Returns an array of admin email addresses from .env ADMIN_EMAIL only (comma-separated). Trimmed, trailing semicolons removed. Empty if ADMIN_EMAIL not set.
 */
function getAdminNotificationRecipients() {
  const raw = (process.env.ADMIN_EMAIL || '').trim().replace(/;\s*$/, '');
  return raw.split(',').map((e) => e.trim().replace(/;$/, '')).filter(Boolean);
}

/** Sender – EMAIL_FROM must be verified in Amazon SES */
const FROM_HEADER = `"OVA™ NGO" <${EMAIL_FROM}>`;

/** Path to donor receipt HTML email template */
const DONATION_EMAIL_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'donationEmail.html');
/** Path to admin donation notification HTML template */
const ADMIN_NOTIFICATION_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'adminDonationNotification.html');
/** Path to contact form admin notification HTML template */
const CONTACT_ADMIN_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'contactAdminNotification.html');
/** Path to contact form user confirmation HTML template */
const CONTACT_USER_CONFIRMATION_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'contactUserConfirmation.html');
/** Path to OVA logo for inline email use */
const OVA_LOGO_PATH = path.join(__dirname, '..', 'templates', 'ovafinal11.png');

let transporter = null;

/**
 * Get logo as inline attachment for emails (cid:ovalogo). Returns null if file missing.
 */
function getLogoAttachment() {
  try {
    const buf = fs.readFileSync(OVA_LOGO_PATH);
    if (buf && buf.length > 0) {
      return {
        filename: 'ovafinal11.png',
        content: buf,
        contentType: 'image/png',
        cid: 'ovalogo',
      };
    }
  } catch (_) {
    // logo optional
  }
  return null;
}

/**
 * Get or create Nodemailer transporter (Amazon SES SMTP).
 */
function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[Email] SES SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Emails will be skipped.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ? String(process.env.SMTP_HOST).trim() : SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER ? String(process.env.SMTP_USER).trim() : SMTP_USER,
      pass: process.env.SMTP_PASS ? String(process.env.SMTP_PASS).trim() : SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Verify SES SMTP connection on server start.
 * Logs "Amazon SES SMTP server ready" or "SES SMTP connection error:".
 */
function verifySmtpConnection(callback) {
  const trans = getTransporter();
  if (!trans) {
    console.error('SES SMTP connection error: SMTP not configured.');
    if (callback) callback(new Error('SMTP not configured'), false);
    return;
  }
  trans.verify((error, success) => {
    if (error) {
      console.error('SES SMTP connection error:', error);
      if (callback) callback(error, false);
      return;
    }
    console.log('Amazon SES SMTP server ready');
    if (callback) callback(null, true);
  });
}

/**
 * Promise wrapper for verify (used in index.js).
 */
async function verifySmtpConnectionAsync() {
  return new Promise((resolve) => {
    verifySmtpConnection((err, success) => resolve(success && !err));
  });
}

/**
 * Generic send email. Does not throw; logs and returns result.
 */
async function sendEmail(to, subject, html, text, attachments = []) {
  const trans = getTransporter();
  if (!trans) {
    console.log('[Email not sent - no SMTP]', { to, subject });
    return { skipped: true };
  }
  const mailOptions = {
    from: FROM_HEADER,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html: html || text,
    text: text || (html && html.replace(/<[^>]+>/g, '').trim()),
  };
  if (attachments && attachments.length > 0) mailOptions.attachments = attachments;
  try {
    const info = await trans.sendMail(mailOptions);
    console.log('[Email sent]', { to: mailOptions.to, subject, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email send error]', err.response || err.message);
    return { success: false, error: err.message };
  }
}

/** CID for inline QR image in donor email (so clients display it reliably). */
const QR_CODE_CID = 'donationqrcode';

/**
 * Build QR block HTML for donor email. Use cid so the image displays (data URLs are often blocked).
 * @param {boolean} useCid - when true, img uses src="cid:donationqrcode" (attach QR with this cid).
 * @returns {string}
 */
function buildQrCodeBlock(useCid) {
  if (!useCid) return '';
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px;">
      <tr>
        <td style="padding: 16px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #444444;">Scan this QR code to verify your donation receipt online.</p>
          <img src="cid:${QR_CODE_CID}" alt="Verify receipt" width="160" height="160" style="display: block; margin: 0 auto;" />
        </td>
      </tr>
    </table>`;
}

/**
 * Load donor receipt HTML template and replace placeholders.
 * @param {Object} data - donorName, amount, date, modeOfDonation, receiptNumber, qrCodeDataUrl
 * @returns {string} HTML content
 */
function getDonationEmailHtml(data) {
  const donorName = data.donorName != null ? String(data.donorName) : 'Donor';
  const amount = data.amount != null ? `₹${Number(data.amount).toLocaleString('en-IN')}` : '—';
  const date = data.date != null ? String(data.date) : '—';
  const modeOfDonation = data.modeOfDonation != null ? String(data.modeOfDonation) : 'Online (Razorpay)';
  const receiptNumber = data.receiptNumber != null ? String(data.receiptNumber) : '—';
  const qrCodeBlock = buildQrCodeBlock(!!data.useQrCid);
  let html = '';
  try {
    html = fs.readFileSync(DONATION_EMAIL_TEMPLATE_PATH, 'utf8');
  } catch (err) {
    console.warn('[Email] Template not found, using fallback:', DONATION_EMAIL_TEMPLATE_PATH, err.message);
    html = `<p>Dear ${escapeHtml(donorName)},</p><p>Thank you for your donation to OVA<sup style="font-size: 70%;">TM</sup>. Your receipt is attached.</p>${qrCodeBlock}<p>OVA<sup style="font-size: 70%;">TM</sup> Team</p>`;
    return html;
  }
  return html
    .replace(/\{\{donorName\}\}/g, escapeHtml(donorName))
    .replace(/\{\{amount\}\}/g, amount)
    .replace(/\{\{date\}\}/g, escapeHtml(date))
    .replace(/\{\{modeOfDonation\}\}/g, escapeHtml(modeOfDonation))
    .replace(/\{\{receiptNumber\}\}/g, escapeHtml(receiptNumber))
    .replace(/\{\{qrCodeBlock\}\}/g, qrCodeBlock);
}

/**
 * Send donation receipt email to donor with PDF attached.
 * Uses branded HTML template. QR code is attached as inline image (cid) so it displays in email.
 * @param {string} donorEmail
 * @param {string} donorName
 * @param {Buffer} pdfBuffer - PDF buffer from generateReceiptPDF (required for attachment)
 * @param {Object} [donationDetails] - amount, date, modeOfDonation, receiptNumber
 */
async function sendDonationReceiptEmail(donorEmail, donorName, pdfBuffer, donationDetails = {}) {
  const trans = getTransporter();
  if (!trans) {
    console.log('[Email not sent - no SMTP] Donation receipt skipped.');
    return { skipped: true };
  }
  const attachments = [];
  const logo = getLogoAttachment();
  if (logo) attachments.push(logo);

  let useQrCid = false;
  if (donationDetails.receiptNumber) {
    try {
      const verificationUrl = generateVerificationUrl(donationDetails.receiptNumber);
      const qrBuffer = await generateQrCodeBuffer(verificationUrl, { width: 180, margin: 2 });
      if (qrBuffer && qrBuffer.length > 0) {
        attachments.push({
          filename: 'verify-receipt-qr.png',
          content: qrBuffer,
          contentType: 'image/png',
          cid: QR_CODE_CID,
        });
        useQrCid = true;
      }
    } catch (err) {
      console.warn('[Email] QR code for email skipped:', err.message);
    }
  }

  const subject = 'Thank you for supporting OVA - Donation Receipt';
  const html = getDonationEmailHtml({
    donorName,
    amount: donationDetails.amount,
    date: donationDetails.date,
    modeOfDonation: donationDetails.modeOfDonation != null ? donationDetails.modeOfDonation : 'Online (Razorpay)',
    receiptNumber: donationDetails.receiptNumber,
    useQrCid,
  });
  if (pdfBuffer && Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0) {
    attachments.push({
      filename: 'Donation_Receipt.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }
  try {
    await trans.sendMail({
      from: FROM_HEADER,
      to: donorEmail,
      replyTo: EMAIL_FROM,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, '').trim(),
      attachments,
    });
    console.log('[Email sent] Donation receipt to', donorEmail);
    return { success: true };
  } catch (err) {
    console.error('[Email send error] Donation receipt failed:', err.response || err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Escape string for safe use in HTML.
 */
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Load admin notification HTML template and replace placeholders.
 * @param {Object} donorData - name, email, phone, amount, paymentId, date, receiptNumber, modeOfDonation
 * @returns {string} HTML content
 */
function getAdminNotificationHtml(donorData) {
  const {
    name = '',
    email = '',
    phone = '—',
    amount = 0,
    paymentId = '',
    date = '',
    receiptNumber = '—',
    modeOfDonation = 'Online (Razorpay)',
  } = donorData;
  let html = '';
  try {
    html = fs.readFileSync(ADMIN_NOTIFICATION_TEMPLATE_PATH, 'utf8');
  } catch (err) {
    console.warn('[Email] Admin template not found, using fallback:', err.message);
    html = `<p><strong>Donor Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Phone:</strong> ${escapeHtml(phone)}</p><p><strong>Amount:</strong> ₹${Number(amount).toLocaleString('en-IN')}</p><p><strong>Razorpay Payment ID:</strong> ${escapeHtml(paymentId)}</p><p><strong>Donation Date:</strong> ${escapeHtml(date)}</p><p><strong>Receipt No:</strong> ${escapeHtml(receiptNumber)}</p>`;
    return html;
  }
  return html
    .replace(/\{\{donorName\}\}/g, escapeHtml(name))
    .replace(/\{\{donorEmail\}\}/g, escapeHtml(email))
    .replace(/\{\{donorPhone\}\}/g, escapeHtml(phone))
    .replace(/\{\{amount\}\}/g, `₹${Number(amount).toLocaleString('en-IN')}`)
    .replace(/\{\{paymentId\}\}/g, escapeHtml(paymentId))
    .replace(/\{\{donationDate\}\}/g, escapeHtml(date))
    .replace(/\{\{receiptNumber\}\}/g, escapeHtml(receiptNumber || '—'))
    .replace(/\{\{modeOfDonation\}\}/g, escapeHtml(modeOfDonation || 'Online (Razorpay)'));
}

/**
 * Send admin notification for new donation.
 * Uses branded HTML template. Optionally attaches the same receipt PDF as sent to the donor (donorData.pdfBuffer).
 * Does not throw.
 */
async function sendAdminNotification(donorData) {
  const trans = getTransporter();
  if (!trans) {
    console.log('[Email not sent - no SMTP] Admin notification skipped.');
    return { skipped: true };
  }
  const toAdmin = getAdminNotificationRecipients();
  if (!toAdmin || toAdmin.length === 0) {
    console.log('[Email not sent] Admin notification skipped: no ADMIN_EMAIL in .env.');
    return { skipped: true };
  }
  const subject = 'New Donation Received – OVA';
  const html = getAdminNotificationHtml(donorData);
  const attachments = [];
  const logo = getLogoAttachment();
  if (logo) attachments.push(logo);
  if (donorData.pdfBuffer && Buffer.isBuffer(donorData.pdfBuffer) && donorData.pdfBuffer.length > 0) {
    attachments.push({
      filename: 'Donation_Receipt.pdf',
      content: donorData.pdfBuffer,
      contentType: 'application/pdf',
    });
  }
  try {
    await trans.sendMail({
      from: FROM_HEADER,
      to: toAdmin,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, '').trim(),
      attachments: attachments.length ? attachments : undefined,
    });
    console.log('[Email sent] Admin donation notification to', toAdmin.join(', '));
    return { success: true };
  } catch (err) {
    console.error('[Email send error] Admin notification failed:', err.response || err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Load contact admin notification HTML template and replace placeholders.
 * @param {Object} contactData - name, email, phone, subject, message
 * @returns {string} HTML content
 */
function getContactAdminHtml(contactData) {
  const {
    name = '',
    email = '',
    phone = '—',
    subject = '(no subject)',
    message = '',
  } = contactData;
  const messageHtml = escapeHtml(String(message)).replace(/\n/g, '<br/>');
  let html = '';
  try {
    html = fs.readFileSync(CONTACT_ADMIN_TEMPLATE_PATH, 'utf8');
  } catch (err) {
    console.warn('[Email] Contact admin template not found, using fallback:', err.message);
    html = `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>Phone:</strong> ${escapeHtml(phone)}</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><hr/><p>${messageHtml}</p>`;
    return html;
  }
  return html
    .replace(/\{\{senderName\}\}/g, escapeHtml(name))
    .replace(/\{\{senderEmail\}\}/g, escapeHtml(email))
    .replace(/\{\{senderPhone\}\}/g, escapeHtml(phone))
    .replace(/\{\{subject\}\}/g, escapeHtml(subject))
    .replace(/\{\{message\}\}/g, messageHtml);
}

/**
 * Send contact form notification to all admin emails from .env.
 * Uses branded HTML template with OVA logo. Does not throw.
 */
async function sendContactAdminEmail(contactData) {
  const trans = getTransporter();
  if (!trans) {
    console.log('[Email not sent - no SMTP] Contact admin notification skipped.');
    return { skipped: true };
  }
  const toAdmin = getAdminNotificationRecipients();
  if (!toAdmin || toAdmin.length === 0) {
    console.log('[Email not sent] Contact admin notification skipped: no ADMIN_EMAIL in .env.');
    return { skipped: true };
  }
  const subject = `[OVA Contact] ${(contactData.subject || 'New message').trim()} – ${(contactData.name || '').trim()}`;
  const html = getContactAdminHtml(contactData);
  const attachments = [];
  const logo = getLogoAttachment();
  if (logo) attachments.push(logo);
  try {
    await trans.sendMail({
      from: FROM_HEADER,
      to: toAdmin,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, '').trim(),
      attachments: attachments.length ? attachments : undefined,
    });
    console.log('[Email sent] Contact admin notification to', toAdmin.join(', '));
    return { success: true };
  } catch (err) {
    console.error('[Email send error] Contact admin notification failed:', err.response || err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Load contact user confirmation HTML template and replace placeholders.
 * @param {string} name - Recipient name
 * @returns {string} HTML content
 */
function getContactUserConfirmationHtml(name) {
  const safeName = escapeHtml(String(name || '').trim()) || 'there';
  let html = '';
  try {
    html = fs.readFileSync(CONTACT_USER_CONFIRMATION_TEMPLATE_PATH, 'utf8');
  } catch (err) {
    console.warn('[Email] Contact user confirmation template not found, using fallback:', err.message);
    return `<p>Hi ${safeName},</p><p>Thank you for getting in touch with OVA™. We have received your message and will get back to you soon.</p><p>— OVA™ Team</p>`;
  }
  return html.replace(/\{\{name\}\}/g, safeName);
}

/**
 * Send contact form confirmation to the user who submitted the form.
 * Uses branded HTML template with OVA logo. Does not throw.
 */
async function sendContactUserConfirmation({ name, email }) {
  const trans = getTransporter();
  if (!trans || !email) {
    console.log('[Email not sent - no SMTP or email] Contact user confirmation skipped.');
    return { skipped: true };
  }
  const subject = 'We received your message – OVA™';
  const html = getContactUserConfirmationHtml(name);
  const attachments = [];
  const logo = getLogoAttachment();
  if (logo) attachments.push(logo);
  try {
    await trans.sendMail({
      from: FROM_HEADER,
      to: email,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, '').trim(),
      attachments: attachments.length ? attachments : undefined,
    });
    console.log('[Email sent] Contact user confirmation to', email);
    return { success: true };
  } catch (err) {
    console.error('[Email send error] Contact user confirmation failed:', err.response || err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  getTransporter,
  verifySmtpConnection,
  verifySmtpConnectionAsync,
  sendEmail,
  sendDonationReceiptEmail,
  sendAdminNotification,
  sendContactAdminEmail,
  sendContactUserConfirmation,
  ADMIN_EMAIL,
  EMAIL_FROM,
  FROM_HEADER,
};
