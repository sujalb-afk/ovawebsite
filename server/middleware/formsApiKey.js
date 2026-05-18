function getApiKey() {
  return (process.env.FORMS_TRANSFER_API_KEY || '').trim();
}

function formsApiKeyAuth(req, res, next) {
  const API_KEY = getApiKey();
  const provided = (
    req.headers['x-api-key']
    || req.headers['authorization']?.replace(/^Bearer\s+/i, '')
    || req.query.apiKey
    || req.query.apikey
  )?.trim();
  if (!API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Forms transfer API is not configured (missing FORMS_TRANSFER_API_KEY).',
    });
  }
  if (!provided || provided !== API_KEY) {
    return res.status(401).json({ success: false, message: 'Invalid or missing API key.' });
  }
  next();
}

module.exports = { formsApiKeyAuth };
