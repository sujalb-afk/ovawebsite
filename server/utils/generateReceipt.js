const path = require('path');
const fs = require('fs');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { amountInWords } = require('./amountInWords');
const { generateVerificationUrl, generateQrCodeBuffer } = require('./qrCode');

/** Ensure amount-in-words has Rupees/INR prefix for receipt display. */
function withRupeesPrefix(words) {
  const s = String(words || '').trim();
  if (!s) return amountInWords(0);
  if (/^(Rupees|INR)\s+/i.test(s)) return s;
  return 'Rupees ' + s;
}

const RECEIPTS_DIR = path.join(__dirname, '..', 'receipts');
const PDF_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'OVA Donation.pdf');
const HTML_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'receipt.html');

function ensureReceiptsDir() {
  if (!fs.existsSync(RECEIPTS_DIR)) {
    fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
  }
}

/**
 * Generate receipt number in form OVA-REC-000100, OVA-REC-000101, ... (6-digit auto-increment from 100).
 * @param {number} sequenceNumber - Use (99 + totalDonations) so first receipt is OVA-REC-000100.
 */
function generateReceiptNumber(sequenceNumber) {
  const seq = String(Math.max(100, Math.floor(Number(sequenceNumber) || 100))).padStart(6, '0');
  return `OVA-REC-${seq}`;
}

function formatDate(d) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Possible PDF form field names (template-dependent). Tried in order.
 */
const FIELD_NAME_MAP = {
  receiptNo: ['Receipt No', 'receiptNo', 'ReceiptNo', 'Text1', '1'],
  date: ['Date', 'date', 'Text2', '2'],
  donorName: ['Received With Thanks From', 'Name', 'donorName', 'Donor Name', 'Text3', '3'],
  address: ['Address', 'address', 'donorAddress', 'Text4', '4'],
  mobile: ['Mobile Number', 'Mobile', 'mobile', 'donorMobile', 'Text5', '5'],
  email: ['Email ID', 'Email', 'email', 'donorEmail', 'Text6', '6'],
  purpose: ['Purpose of Donation', 'Purpose', 'purpose', 'Text7', '7'],
  mode: ['Mode of Donation', 'Mode', 'mode', 'Text8', '8'],
  donationDate: ['Date of Donation', 'Donation Date', 'donationDate', 'Text9', '9'],
  amount: ['Amount of Donation', 'Amount', 'amount', 'Text10', '10'],
  amountWords: ['Amount of Donation (In words)', 'Amount in Words', 'amountWords', 'Text11', '11'],
};

/** Value order when filling by index (top-to-bottom on receipt). */
const VALUE_ORDER = [
  'receiptNo',
  'date',
  'donorName',
  'address',
  'mobile',
  'email',
  'purpose',
  'mode',
  'donationDate',
  'amount',
  'amountWords',
];

/**
 * Put field names in visual order: use numeric part (1,2..10,11) if present, else keep getFields() order.
 */
function orderFieldNamesForFilling(names) {
  const num = (s) => {
    const m = String(s).match(/(\d+)$/);
    if (m) return parseInt(m[1], 10);
    const p = parseInt(s, 10);
    return Number.isNaN(p) ? NaN : p;
  };
  const withNum = names.map((n) => ({ n, v: num(n) }));
  const allNumeric = withNum.every((x) => !Number.isNaN(x.v));
  if (allNumeric) {
    return withNum.sort((a, b) => a.v - b.v).map((x) => x.n);
  }
  return names;
}

/**
 * Fill PDF form fields with donor/donation data.
 * Uses index-based fill when we have 11 text fields (so values match visual order); otherwise name-based.
 */
function fillPdfForm(pdfDoc, data) {
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  const fieldNames = new Set(fields.map((f) => f.getName().trim()));
  if (fieldNames.size > 0) {
    console.log('[Receipt] Template form field names:', [...fieldNames].join(', '));
  }

  const values = {
    receiptNo: data.receiptNumber,
    date: data.dateOfDonation,
    donorName: data.donorName || '-',
    address: (data.address || '-').replace(/\n/g, ' '),
    mobile: data.mobile || '-',
    email: data.email || '-',
    purpose: data.purpose || 'Donation to OVA',
    mode: data.modeOfDonation || 'Online / Razorpay',
    donationDate: data.dateOfDonation || '-',
    amount: `Rs. ${Number(data.amount).toLocaleString('en-IN')}`,
    amountWords: withRupeesPrefix(data.amountWords || amountInWords(Math.round(Number(data.amount || 0)))),
  };

  const toWinAnsi = (s) => String(s).replace(/₹/g, 'Rs.').replace(/—/g, '-').replace(/[^\x00-\x7F]/g, '?');

  // Collect text field names (pdf-lib: PDFTextField has getText/setText)
  const textFieldNames = [];
  for (const f of fields) {
    const name = f.getName().trim();
    try {
      const tf = form.getTextField(name);
      if (tf) textFieldNames.push(name);
    } catch (_) {
      // not a text field
    }
  }

  const numValues = VALUE_ORDER.length;
  if (textFieldNames.length === numValues) {
    // Fill by index so layout matches: 1=Receipt, 2=Date, 3=Name, 4=Address, 5=Mobile, 6=Email, 7=Purpose, 8=Mode, 9=Date of Donation, 10=Amount, 11=Amount words
    const orderedNames = orderFieldNamesForFilling(textFieldNames);
    for (let i = 0; i < numValues; i++) {
      const key = VALUE_ORDER[i];
      const str = toWinAnsi(values[key]);
      try {
        form.getTextField(orderedNames[i]).setText(str);
      } catch (_) {
        // skip if not text field
      }
    }
  } else {
    // Fallback: name-based fill
    for (const [key, possibleNames] of Object.entries(FIELD_NAME_MAP)) {
      const value = values[key];
      if (value == null) continue;
      const str = toWinAnsi(value);
      for (const name of possibleNames) {
        if (!fieldNames.has(name)) continue;
        try {
          form.getTextField(name).setText(str);
          break;
        } catch (_) {}
      }
    }
  }

  try {
    form.flatten();
  } catch (_) {
    // flatten optional
  }
}

/**
 * Fallback: overlay text on first page at fixed positions (A4, origin bottom-left).
 * Each row uses an explicit Y so values sit exactly on the template's dashed lines.
 */
function overlayTextOnPdf(pdfDoc, data) {
  const pages = pdfDoc.getPages();
  if (pages.length === 0) return;
  const page = pages[0];
  const { width, height } = page.getSize();
  const font = pdfDoc.embedStandardFont(StandardFonts.Helvetica);
  const fontSize = 10;

  const left = 80;
  const valueX = 268;
  const rightDateX = width - 175;

  // Row spacing to match printed dashed lines (points).
  const rowHeight = 23;
  const firstRowY = height - 218;

  const toWinAnsi = (s) => String(s).replace(/₹/g, 'Rs.').replace(/—/g, '-').replace(/[^\x00-\x7F]/g, '?');
  const draw = (text, x, y, color) => {
    page.drawText(toWinAnsi(text).slice(0, 120), {
      x,
      y,
      size: fontSize,
      font,
      color: color || undefined,
    });
  };

  // Receipt number: slightly upper and to the left (next to "Receipt No :")
  const receiptX = valueX - 98;  // 10 pt left
  const receiptY = firstRowY + 9;
  draw(data.receiptNumber, receiptX, receiptY, { type: 'RGB', red: 0.8, green: 0, blue: 0 });

  // Top-right date: aligned with "Date:" field
  const dateRightY = firstRowY + 11;
  draw(data.dateOfDonation, rightDateX, dateRightY);

  // Donor fields: fixed Y per row so each value sits on its dashed line
  const rowY = (index) => firstRowY - rowHeight * (index + 1);

  draw(data.donorName || '-', valueX + 23, rowY(0) - 8);
  draw((data.address || '-').replace(/\n/g, ' '), valueX + 23, rowY(1) - 7);
  draw(data.mobile || '-', valueX + 23, rowY(2) - 4);
  draw(data.email || '-', valueX + 23, rowY(3) - 2);
  draw(data.purpose || 'Donation to OVA', valueX + 23, rowY(4));
  draw(data.modeOfDonation || 'Online / Razorpay', valueX + 23, rowY(5));
  draw(data.dateOfDonation || '-', valueX + 23, rowY(6) + 3);
  draw(`Rs. ${Number(data.amount).toLocaleString('en-IN')}`, valueX + 21, rowY(7) + 5);
  draw(withRupeesPrefix(data.amountWords || amountInWords(Math.round(Number(data.amount || 0)))), valueX + 23, rowY(8) + 8);
}

/**
 * Embed QR code on first page in the lower-right blank area (above footer, left of director signature).
 * Uses explicit coordinates so the QR does not overlap disclaimer or footer text.
 * @param {PDFDocument} pdfDoc
 * @param {string} verificationUrl
 */
async function addQrCodeToPdf(pdfDoc, verificationUrl) {
  if (!verificationUrl || typeof verificationUrl !== 'string') return;
  try {
    const qrBuffer = await generateQrCodeBuffer(verificationUrl, { width: 100, margin: 1 });
    const pages = pdfDoc.getPages();
    if (pages.length === 0) return;
    const page = pages[0];
    const { width } = page.getSize();
    // Lower-right blank area: right-aligned with margin, above "Thank you..." footer and left of director signature
    const qrSize = 80;
    const rightMargin = 160;   // distance from right edge to QR right edge
    const qrX = width - rightMargin - qrSize - 95;  // 95 pt left from right margin (20 pt more left)
    const qrY = 118 - 30;      // 30 pt down (pdf-lib origin is bottom-left)
    const pngImage = await pdfDoc.embedPng(qrBuffer);
    page.drawImage(pngImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
    const font = pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    const caption = 'Scan to verify receipt';
    page.drawText(caption, {
      x: qrX,
      y: qrY - 12,
      size: 7,
      font,
      color: { type: 'RGB', red: 0.3, green: 0.3, blue: 0.3 },
    });
  } catch (err) {
    console.warn('[Receipt] QR code embed skipped:', err.message);
  }
}

/**
 * Generate donation receipt PDF using template "OVA Donation.pdf".
 * Fills form fields if present; otherwise overlays text. Returns { buffer, filePath, receiptNumber }.
 */
async function generateReceiptPDF(options) {
  ensureReceiptsDir();

  const {
    receiptNumber,
    donorName,
    address,
    mobile,
    email,
    purpose,
    modeOfDonation,
    dateOfDonation,
    amount,
    amountInWords: amountWords,
    verificationUrl: verificationUrlOption,
  } = options;

  const fileName = `receipt_${receiptNumber}.pdf`;
  const filePath = path.join(RECEIPTS_DIR, fileName);

  const data = {
    receiptNumber,
    donorName,
    address,
    mobile,
    email,
    purpose: purpose || 'Donation to OVA',
    modeOfDonation: modeOfDonation || 'Online / Razorpay',
    dateOfDonation: dateOfDonation || '—',
    amount,
    amountWords,
  };

  if (fs.existsSync(PDF_TEMPLATE_PATH)) {
    const templateBytes = fs.readFileSync(PDF_TEMPLATE_PATH);
    console.log('[Receipt] Template PDF size:', templateBytes.length);
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    if (fields.length > 0) {
      fillPdfForm(pdfDoc, data);
    } else {
      overlayTextOnPdf(pdfDoc, data);
    }
    const verificationUrl = verificationUrlOption || generateVerificationUrl(receiptNumber);
    await addQrCodeToPdf(pdfDoc, verificationUrl);
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    console.log('[Receipt] PDF buffer length:', pdfBuffer.length);
    if (pdfBuffer.length === 0) {
      console.error('[Receipt] PDF generation failed: empty buffer after save');
      throw new Error('Receipt PDF buffer is empty');
    }
    fs.writeFileSync(filePath, pdfBuffer);
    console.log('[Receipt] PDF generation success (template):', receiptNumber);
    return { buffer: pdfBuffer, filePath, receiptNumber };
  }

  throw new Error(`Receipt template not found: ${PDF_TEMPLATE_PATH}. Place "OVA Donation.pdf" in server/templates/`);
}

module.exports = {
  generateReceiptNumber,
  generateReceiptPDF,
  formatDate,
  RECEIPTS_DIR,
  HTML_TEMPLATE_PATH,
  PDF_TEMPLATE_PATH,
};
