/**
 * Load Google reCAPTCHA script only when needed (Contact/Donate/Join).
 * Avoids ~360KB on initial page load.
 */
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
