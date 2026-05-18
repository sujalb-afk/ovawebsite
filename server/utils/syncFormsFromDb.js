const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const Join = require('../models/Join');
const Donate = require('../models/Donate');
const Newsletter = require('../models/Newsletter');
const { forwardFormData } = require('./forwardFormData');

function requireDb() {
  if (mongoose.connection.readyState !== 1) {
    const err = new Error(
      'Database is not connected. In server/.env set MONGODB_URI (MongoDB Atlas cloud) or MONGODB_HOST (your live server IP). No local MongoDB install needed. Then restart: npm run dev:api'
    );
    err.status = 503;
    throw err;
  }
}

function serializeDoc(doc) {
  const data = { ...doc };
  delete data.__v;
  if (data._id) data.id = String(data._id);
  delete data._id;
  return data;
}

async function fetchAllFormsFromDb() {
  requireDb();

  const [contact, join, donate, newsletter] = await Promise.all([
    Contact.find().sort({ createdAt: -1 }).lean(),
    Join.find().sort({ createdAt: -1 }).lean(),
    Donate.find().sort({ createdAt: -1 }).lean(),
    Newsletter.find().sort({ subscribedAt: -1 }).lean(),
  ]);

  return {
    contact: contact.map(serializeDoc),
    join: join.map(serializeDoc),
    donate: donate.map(serializeDoc),
    newsletter: newsletter.map(serializeDoc),
  };
}

async function syncCollection(Model, formType, sortField = 'createdAt') {
  const docs = await Model.find().sort({ [sortField]: -1 }).lean();
  const result = { total: docs.length, success: 0, failed: 0, errors: [], records: [] };

  for (const doc of docs) {
    const data = serializeDoc(doc);
    result.records.push(data);

    const submittedAt = doc.createdAt || doc.subscribedAt || new Date();
    try {
      await forwardFormData(formType, data, {
        source: 'ova-database',
        submittedAt: submittedAt instanceof Date ? submittedAt.toISOString() : submittedAt,
      });
      result.success += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push({ id: data.id || 'unknown', message: err.message });
    }
  }

  return result;
}

async function syncAllFormsFromDb() {
  requireDb();

  const [contact, join, donate, newsletter] = await Promise.all([
    syncCollection(Contact, 'contact'),
    syncCollection(Join, 'join'),
    syncCollection(Donate, 'donate'),
    syncCollection(Newsletter, 'newsletter', 'subscribedAt'),
  ]);

  return { contact, join, donate, newsletter };
}

module.exports = { syncAllFormsFromDb, fetchAllFormsFromDb };
