import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import './index.css';

/* Bootstrap JS: load after first paint to shrink main bundle and improve LCP (dropdowns/collapse work after load) */
const loadBootstrapJS = () => import('bootstrap/dist/js/bootstrap.bundle.min.js');
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => loadBootstrapJS(), { timeout: 2000 });
} else {
  setTimeout(loadBootstrapJS, 200);
}

/* Bootstrap Icons: load after first paint; icon containers have fixed size in critical CSS to avoid CLS */
const loadIcons = () => import('bootstrap-icons/font/bootstrap-icons.css');
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => loadIcons(), { timeout: 1500 });
} else {
  setTimeout(loadIcons, 100);
}

// Suppress Razorpay "Timeout" and reCAPTCHA "reCAPTCHA Timeout" so React's error overlay doesn't show (capture = run first)
function suppressKnownTimeouts(event) {
  const reason = event?.reason;
  const msg = reason && typeof reason === 'object' ? reason.message : reason;
  const isTimeout =
    msg === 'Timeout' ||
    msg === 'reCAPTCHA Timeout' ||
    (typeof msg === 'string' && msg.includes('Timeout'));
  if (isTimeout) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
window.addEventListener('unhandledrejection', suppressKnownTimeouts, true);

// Suppress "Timeout" / "reCAPTCHA Timeout" in window.onerror so the runtime error overlay doesn't appear
const _originalOnError = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
  const errMsg = error && error.message;
  if (
    message === 'Timeout' ||
    message === 'reCAPTCHA Timeout' ||
    errMsg === 'Timeout' ||
    errMsg === 'reCAPTCHA Timeout' ||
    (typeof message === 'string' && message.includes('Timeout'))
  ) return true;
  if (_originalOnError) return _originalOnError.apply(this, arguments);
  return false;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
