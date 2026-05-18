/**
 * Convert a number to Indian Rupee amount in words (for receipts).
 * Handles values up to 99 crore (e.g. "Nine Crore Ninety Nine Lakh Only").
 */
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

function twoDigits(n) {
  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o ? ' ' + ones[o] : '');
}

function threeDigits(n) {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const part = h ? ones[h] + ' Hundred' : '';
  return part + (rest ? (part ? ' ' : '') + twoDigits(rest) : '');
}

const PREFIX = 'Rupees ';

/**
 * @param {number} num - Integer amount (e.g. 1500 for ₹1500)
 * @returns {string} e.g. "Rupees One Thousand Five Hundred Only"
 */
function amountInWords(num) {
  const n = Math.floor(Number(num));
  if (n === 0) return PREFIX + 'Zero Only';
  if (n < 0) return 'Invalid';

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts = [];
  if (crore) parts.push(threeDigits(crore) + ' Crore');
  if (lakh) parts.push(threeDigits(lakh) + ' Lakh');
  if (thousand) parts.push(threeDigits(thousand) + ' Thousand');
  if (hundred) parts.push(threeDigits(hundred));

  const result = parts.join(' ').trim();
  return result ? PREFIX + result + ' Only' : PREFIX + 'Zero Only';
}

module.exports = { amountInWords };
