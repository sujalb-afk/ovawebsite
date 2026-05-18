const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptLoaded = false;
let scriptLoadPromise = null;

/**
 * Load Razorpay checkout script once. Returns a Promise that resolves when Razorpay is available.
 */
export function loadRazorpayScript() {
  if (typeof window.Razorpay !== 'undefined') {
    scriptLoaded = true;
    return Promise.resolve();
  }
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

/**
 * Open Razorpay checkout popup.
 * @param {Object} options
 * @param {string} options.keyId - Razorpay key ID from backend
 * @param {string} options.orderId - Razorpay order ID from backend
 * @param {number} options.amount - Amount in paise (from order)
 * @param {string} options.currency - Currency (INR)
 * @param {string} options.customerName - Donor name
 * @param {string} options.customerEmail - Donor email
 * @param {function} options.onSuccess - (paymentId, orderId, signature) => void
 * @param {function} options.onDismiss - () => void
 */
export function openRazorpayCheckout({
  keyId,
  orderId,
  amount,
  currency = 'INR',
  customerName,
  customerEmail,
  onSuccess,
  onDismiss,
}) {
  if (typeof window.Razorpay === 'undefined') {
    return Promise.reject(new Error('Razorpay not loaded'));
  }

  const options = {
    key: keyId,
    amount,
    currency,
    order_id: orderId,
    name: 'OVA™ NGO',
    description: 'Donation',
    theme: {
      color: '#2E7D32',
    },
    prefill: {
      name: customerName || '',
      email: customerEmail || '',
    },
    handler: function (response) {
      onSuccess(
        response.razorpay_payment_id,
        response.razorpay_order_id,
        response.razorpay_signature
      );
    },
    modal: {
      ondismiss: onDismiss,
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
  return rzp;
}
