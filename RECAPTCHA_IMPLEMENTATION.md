# reCAPTCHA Implementation Reference

Copy this into another project to add Google reCAPTCHA v2 (checkbox) to a form.

---

## 1. Get keys

- Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- Register a site: reCAPTCHA v2 → "I'm not a robot" checkbox
- You get **Site Key** (public, frontend) and **Secret Key** (private, backend)

---

## 2. Frontend (React)

### Install

```bash
npm install react-google-recaptcha
```

### Script loader – `src/utils/recaptchaLoader.js`

Loads the Google script only when needed (e.g. when the form page mounts).

```javascript
const RECAPTCHA_URL = 'https://www.google.com/recaptcha/api.js?render=explicit';
let loading = null;

export function loadRecaptchaScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.grecaptcha && window.grecaptcha.render) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RECAPTCHA_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(resolve);
      } else {
        resolve();
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return loading;
}
```

### Form component usage

```jsx
import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import axios from 'axios';
import { loadRecaptchaScript } from '../utils/recaptchaLoader';

const ReCAPTCHA = lazy(() => import('react-google-recaptcha'));

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || 'YOUR_SITE_KEY';

function MyForm() {
  const recaptchaRef = useRef(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRecaptchaScript().then(() => setRecaptchaReady(true)).catch(() => setRecaptchaReady(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const token = recaptchaRef.current?.getValue?.();
    if (!token) {
      setError('Please complete the captcha.');
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post('/api/your-endpoint', {
        ...formData,
        recaptchaToken: token,
      });
      setFormData({ name: '', email: '', message: '' });
      recaptchaRef.current?.reset?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
        required
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        placeholder="Message"
        required
      />
      {recaptchaReady && (
        <Suspense fallback={<span>Loading captcha…</span>}>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            theme="light"
            size="normal"
          />
        </Suspense>
      )}
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Submit'}
      </button>
    </form>
  );
}
```

### Env (frontend)

```env
REACT_APP_RECAPTCHA_SITE_KEY=your_site_key_here
```

---

## 3. Backend (Node.js / Express)

### Verify function – use in any route

```javascript
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

async function verifyRecaptcha(token) {
  if (!RECAPTCHA_SECRET || !token) return false;
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token }),
    });
    const data = await res.json();
    return data?.success === true;
  } catch (e) {
    console.error('Recaptcha verify error:', e.message);
    return false;
  }
}
```

### Route example

```javascript
router.post('/api/your-endpoint', async (req, res) => {
  try {
    const { name, email, message, recaptchaToken } = req.body;
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Captcha verification failed. Please try again.',
      });
    }
    // … save to DB, send email, etc.
    res.status(201).json({ success: true, message: 'Submitted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
```

### Env (backend)

```env
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

---

## 4. Summary

| Where   | Key / env                         | Usage                    |
|--------|-----------------------------------|--------------------------|
| Frontend | `REACT_APP_RECAPTCHA_SITE_KEY`  | `<ReCAPTCHA sitekey={...} />` |
| Backend  | `RECAPTCHA_SECRET_KEY`          | `verifyRecaptcha(token)`      |

- **Frontend:** Load script with `recaptchaLoader.js`, render `react-google-recaptcha`, get token with `ref.current.getValue()`, send as `recaptchaToken` in the request body.
- **Backend:** Read `recaptchaToken` from body, call `verifyRecaptcha(token)`; if `false`, return 400. Never expose the secret key to the client.
