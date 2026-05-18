/**
 * Email service for contact, newsletter, and bank-donation flows.
 * Uses the same ZeptoMail config and verified sender as sendEmail.js.
 */
const {
  sendEmail,
  sendContactAdminEmail,
  sendContactUserConfirmation,
  ADMIN_EMAIL,
  EMAIL_FROM,
} = require('./sendEmail');

module.exports = { sendEmail, sendContactAdminEmail, sendContactUserConfirmation, ADMIN_EMAIL, EMAIL_FROM };
