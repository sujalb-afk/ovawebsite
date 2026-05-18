const QRCode = require('qrcode');

/** Base URL for verification page (no trailing slash). From env or default. */
const VERIFICATION_BASE_URL =
  (process.env.FRONTEND_URL || process.env.VERIFICATION_BASE_URL || 'https://www.ova.ngo').replace(/\/$/, '');

/**
 * Generate the public verification URL for a receipt.
 * Format: https://yourdomain.com/verify/donation/OVA-REC-000100
 * @param {string} receiptNumber
 * @param {string} [baseUrl] - override base URL
 * @returns {string}
 */
function generateVerificationUrl(receiptNumber, baseUrl) {
  const base = baseUrl || VERIFICATION_BASE_URL;
  const path = `/verify/donation/${encodeURIComponent(String(receiptNumber || '').trim())}`;
  return `${base}${path}`;
}

/**
 * Generate QR code as Data URL (for embedding in HTML email).
 * @param {string} url - verification URL or any URL
 * @param {object} [options] - qrcode options (e.g. width, margin)
 * @returns {Promise<string>} data URL (image/png;base64,...)
 */
async function generateQrCodeDataUrl(url, options = {}) {
  const opts = {
    type: 'image/png',
    width: options.width || 180,
    margin: options.margin ?? 2,
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    ...options,
  };
  return QRCode.toDataURL(url, opts);
}

/**
 * Generate QR code as PNG buffer (for PDF embedding).
 * @param {string} url - verification URL or any URL
 * @param {object} [options] - qrcode options
 * @returns {Promise<Buffer>}
 */
async function generateQrCodeBuffer(url, options = {}) {
  const opts = {
    width: options.width || 160,
    margin: options.margin ?? 2,
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    ...options,
  };
  return QRCode.toBuffer(url, { type: 'png', ...opts });
}

module.exports = {
  generateVerificationUrl,
  generateQrCodeDataUrl,
  generateQrCodeBuffer,
  VERIFICATION_BASE_URL,
};
