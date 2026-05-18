const FORMS_TRANSFER_URL = (process.env.FORMS_TRANSFER_URL || 'https://larry-epicentral-boldfacedly.ngrok-free.dev').replace(/\/$/, '');
const API_KEY = process.env.FORMS_TRANSFER_API_KEY;

async function forwardFormData(formType, data, options = {}) {
  const url = `${FORMS_TRANSFER_URL}/api/forms/receive`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY || '',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({
      formType,
      data,
      source: options.source || 'ova-web',
      submittedAt: options.submittedAt || new Date().toISOString(),
    }),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(body.message || `Forward failed with status ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

module.exports = { forwardFormData, FORMS_TRANSFER_URL };
