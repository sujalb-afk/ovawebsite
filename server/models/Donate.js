const mongoose = require('mongoose');

const donateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  pan: { type: String },
  currency: { type: String, default: 'INR' },
  transactionNumber: { type: String },
  remark: { type: String },
  amount: { type: Number },
  educationAmount: { type: Number },
  citizenship: { type: String },
  paymentMethod: { type: String, default: 'bank_transfer' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paymentStatus: { type: String },
  receiptNumber: { type: String },
  receiptPath: { type: String },
  verificationToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Donate', donateSchema);
