const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const FormTransfer = require('../models/FormTransfer');
const { formsApiKeyAuth } = require('../middleware/formsApiKey');
const { forwardFormData, FORMS_TRANSFER_URL } = require('../utils/forwardFormData');
const { syncAllFormsFromDb, fetchAllFormsFromDb } = require('../utils/syncFormsFromDb');

const FORM_TYPES = ['contact', 'join', 'donate', 'newsletter'];

router.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    message: dbConnected
      ? 'Forms transfer API is running. Database connected.'
      : 'Forms transfer API is running, but database is NOT connected. Set MONGODB_URI or MONGODB_HOST in server/.env (cloud/remote — no local MongoDB needed).',
    databaseConnected: dbConnected,
    viewDataUrl: '/api/forms/data?apiKey=YOUR_API_KEY',
    syncAllUrl: '/api/forms/sync-all?apiKey=YOUR_API_KEY',
    receiveUrl: '/api/forms/receive',
    targetBaseUrl: FORMS_TRANSFER_URL,
    auth: 'Replace YOUR_API_KEY with the value of FORMS_TRANSFER_API_KEY in server/.env',
  });
});

router.get('/data', formsApiKeyAuth, async (req, res) => {
  try {
    const data = await fetchAllFormsFromDb();
    const counts = {
      contact: data.contact.length,
      join: data.join.length,
      donate: data.donate.length,
      newsletter: data.newsletter.length,
    };
    res.json({
      success: true,
      message: 'All form records from database.',
      counts,
      data,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to load form data.',
    });
  }
});

router.all('/sync-all', formsApiKeyAuth, async (req, res) => {
  try {
    const results = await syncAllFormsFromDb();
    const total = Object.values(results).reduce((n, r) => n + r.total, 0);
    const success = Object.values(results).reduce((n, r) => n + r.success, 0);
    const failed = Object.values(results).reduce((n, r) => n + r.failed, 0);

    res.status(200).json({
      success: failed === 0,
      message: `Synced ${success} of ${total} records to ${FORMS_TRANSFER_URL}.`,
      counts: {
        contact: results.contact.total,
        join: results.join.total,
        donate: results.donate.total,
        newsletter: results.newsletter.total,
      },
      results,
      data: {
        contact: results.contact.records,
        join: results.join.records,
        donate: results.donate.records,
        newsletter: results.newsletter.records,
      },
    });
  } catch (error) {
    console.error('[FormsSyncAll] error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to sync form data.',
    });
  }
});

router.post('/receive', formsApiKeyAuth, async (req, res) => {
  try {
    const { formType, data, source } = req.body;
    if (!formType || !FORM_TYPES.includes(formType)) {
      return res.status(400).json({
        success: false,
        message: `formType is required and must be one of: ${FORM_TYPES.join(', ')}`,
      });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: 'data object is required.' });
    }

    let id = null;
    if (mongoose.connection.readyState === 1) {
      const record = new FormTransfer({
        formType,
        data,
        source: source || 'external',
      });
      await record.save();
      id = record._id;
    } else {
      console.log('[FormsReceive]', { formType, source: source || 'external', data });
    }

    res.status(201).json({
      success: true,
      message: mongoose.connection.readyState === 1
        ? 'Form data received and stored.'
        : 'Form data received (database unavailable; logged on server).',
      id,
      formType,
    });
  } catch (error) {
    console.error('[FormsReceive] error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to store form data.' });
  }
});

router.post('/transfer', formsApiKeyAuth, async (req, res) => {
  try {
    const { formType, data, source, submittedAt } = req.body;
    if (!formType || !FORM_TYPES.includes(formType)) {
      return res.status(400).json({
        success: false,
        message: `formType is required and must be one of: ${FORM_TYPES.join(', ')}`,
      });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: 'data object is required.' });
    }

    const result = await forwardFormData(formType, data, { source, submittedAt });

    res.status(200).json({
      success: true,
      message: 'Form data transferred successfully.',
      formType,
      remote: result,
    });
  } catch (error) {
    console.error('[FormsTransfer] error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to transfer form data.',
      details: error.body,
    });
  }
});

module.exports = router;
