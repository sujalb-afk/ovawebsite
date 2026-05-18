import React from 'react';

const WA_NUMBER = '918484001324'; // country code + number
const WA_MESSAGE = encodeURIComponent(
  'I am interested in learning more about your services. Could you provide additional details?'
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

const WhatsAppButton = React.memo(function WhatsAppButton() {
  return (
    <a
      href={WA_URL}
      className="wa-float-btn"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      {/* Ripple rings */}
      <span className="wa-ring wa-ring-1" aria-hidden="true" />
      <span className="wa-ring wa-ring-2" aria-hidden="true" />
      {/* WhatsApp icon via Bootstrap Icons */}
      <span className="wa-icon-wrap" aria-hidden="true">
        <i className="bi bi-whatsapp wa-bi-icon" />
      </span>
    </a>
  );
});
WhatsAppButton.displayName = 'WhatsAppButton';
export default WhatsAppButton;
