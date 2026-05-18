import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

function ThankYou() {
  return (
    <>
      <SEO
        title="Thank You for Your Donation"
        description="Thank you for supporting OVA™. Your donation helps us create lasting impact."
        canonical="/thank-you"
      />
      <div className="donate-page-wrap">
        <section className="d-section d-section-white thank-you-section">
          <div className="thank-you-content">
            <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">✓</div>
            <h1 style={{ marginBottom: 12 }}>Thank You for Your Donation</h1>
            <p style={{ color: "#555", marginBottom: 24 }}>
              Your payment was successful. A confirmation and receipt will be sent to your email shortly.
              OVA™ will process your receipt and 80G certificate as per your details.
            </p>
            <p style={{ color: "#777", fontSize: 14, marginBottom: 24 }}>
              If you don&apos;t receive the receipt email within a few minutes, please check your spam folder or contact us.
            </p>
            <Link to="/donate" className="d-btn-green" style={{ display: "inline-block", marginRight: 12 }}>
              Donate Again
            </Link>
            <Link to="/" className="d-btn-outline" style={{ display: "inline-block" }}>
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export default ThankYou;
