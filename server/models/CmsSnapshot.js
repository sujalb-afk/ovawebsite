const mongoose = require('mongoose');

/**
 * Published CMS content mirrored in OVA Web MongoDB (ova_db).
 * Keys: page:home, page:about, list:events, list:services, global:site, item:event:<id>
 */
const cmsSnapshotSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ['page', 'list', 'global', 'item'], required: true },
    slug: { type: String, default: '' },
    locale: { type: String, default: 'en' },
    title: { type: String, default: '' },
    data: { type: mongoose.Schema.Types.Mixed, default: null },
    seo: { type: mongoose.Schema.Types.Mixed, default: null },
    cmsUpdatedAt: { type: String, default: null },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.CmsSnapshot || mongoose.model('CmsSnapshot', cmsSnapshotSchema);
