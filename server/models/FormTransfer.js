const mongoose = require('mongoose');

const formTransferSchema = new mongoose.Schema(
  {
    formType: { type: String, required: true, enum: ['contact', 'join', 'donate', 'newsletter'] },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    source: { type: String, default: 'api' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.FormTransfer || mongoose.model('FormTransfer', formTransferSchema);
