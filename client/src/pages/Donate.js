import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import SEO from "../components/SEO";
import AboutHeroBg from "../components/AboutHeroBg";
import { loadRazorpayScript, openRazorpayCheckout } from "../utils/razorpay";
import { taxinfo } from "../data/taxinfo";

const apiBase = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '';

function Donate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [feedAmountType, setFeedAmountType] = useState("preset");
  const [donationAmount, setDonationAmount] = useState(9000);
  const [customFeedAmount, setCustomFeedAmount] = useState("");
  const [sponsorEducation, setSponsorEducation] = useState(false);
  const [educationAmount, setEducationAmount] = useState(0);
  const [citizenship, setCitizenship] = useState("indian");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [donateStatus, setDonateStatus] = useState("");
  const [isDonateSubmitting, setIsDonateSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pan: "",
    currency: "USD",
    transactionNumber: "",
    remark: "",
  });
  const [faqOpenIndex, setFaqOpenIndex] = useState(0);

  const feedOptions = [
    { amount: 9000, children: 6 },
    { amount: 13500, children: 9 },
    { amount: 18000, children: 12 },
    { amount: 22500, children: 15 },
  ];

  const faqs = [
    {
      q: "How can I make a donation to OVA™?",
      a: "You can make a donation by transferring funds to our SBI FCRA Account. Please follow the details provided in the Donor Details section on our website.",
    },
    {
      q: "Can I donate anonymously?",
      a: "We do not encourage anonymous donations as a policy. Donor details are mandatory for processing and to send the Cash Receipt.",
    },
    {
      q: "Will I receive a receipt for my donation?",
      a: "Yes. A soft copy of the Cash Receipt will be sent to your registered email. Provide your PAN to receive the 80G certificate.",
    },
  ];

  const donorInfoItems = [
    "Your Name",
    "Your Contact No",
    "Your Donation Transaction Number",
    "Your Donation Amount",
    "Your E-Mail – To send you the soft copy of the Cash Receipt.",
    "Your Complete Postal Address",
  ];

  const getFeedAmount = () =>
    feedAmountType === "custom"
      ? Number(customFeedAmount) || 0
      : donationAmount;
  const totalAmount =
    getFeedAmount() + (sponsorEducation ? educationAmount : 0);

  const scrollToDonateForm = () => {
    const formEl = document.getElementById("donation-form");
    if (!formEl) return;
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    formEl.scrollIntoView({
      behavior: isMobile ? "auto" : "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    if (location.hash === "#donation-form") {
      const formEl = document.getElementById("donation-form");
      if (formEl) {
        const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
        formEl.scrollIntoView({
          behavior: isMobile ? "auto" : "smooth",
          block: "start",
        });
      }
    }
  }, [location.hash]);

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setDonateStatus("");
    if (!termsAccepted) {
      setSubmitError(
        "Please accept the Privacy Policy and Terms and Conditions to proceed."
      );
      return;
    }
    if (!formData.name?.trim() || !formData.email?.trim()) {
      setSubmitError("Name and email are required.");
      return;
    }
    const total = totalAmount;
    if (total < 1) {
      setSubmitError("Please enter a valid donation amount.");
      return;
    }

    setIsDonateSubmitting(true);
    try {
      await loadRazorpayScript();
      const { data: orderData } = await axios.post(`${apiBase}/api/create-order`, {
        amount: total,
      });
      if (!orderData.success || !orderData.orderId || !orderData.keyId) {
        throw new Error(orderData.message || "Failed to create order");
      }

      openRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        customerName: formData.name.trim(),
        customerEmail: formData.email.trim(),
        onSuccess: async (paymentId, orderId, signature) => {
          try {
            const verifyRes = await axios.post(`${apiBase}/api/verify-payment`, {
              razorpay_payment_id: paymentId,
              razorpay_order_id: orderId,
              razorpay_signature: signature,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              pan: formData.pan,
              currency: formData.currency,
              transactionNumber: formData.transactionNumber,
              remark: formData.remark,
              amount: getFeedAmount(),
              educationAmount: sponsorEducation ? educationAmount : 0,
              citizenship,
            }, { timeout: 25000 });
            if (verifyRes.data?.success) {
              navigate("/thank-you", { replace: true });
              return;
            }
            throw new Error(verifyRes.data?.message || "Verification failed");
          } catch (err) {
            setDonateStatus("error");
            const isTimeout = err.code === "ECONNABORTED" || err.message?.toLowerCase().includes("timeout");
            const message = isTimeout
              ? "Verification is taking longer than usual. Your payment may have succeeded. Check your email for a receipt. If you don't receive it, contact us with your payment ID."
              : (err.response?.data?.message || "Payment verification failed. Please contact support with your payment ID.");
            setSubmitError(message);
          } finally {
            setIsDonateSubmitting(false);
          }
        },
        onDismiss: () => {
          setIsDonateSubmitting(false);
        },
      });
    } catch (err) {
      setDonateStatus("error");
      setSubmitError(
        err.response?.data?.message || "Failed to open payment. Please try again."
      );
    } finally {
      setIsDonateSubmitting(false);
    }
  };

  const formatTotal = () =>
    totalAmount >= 1 ? `₹${totalAmount.toLocaleString("en-IN")}` : "Select amount above";

  return (
    <>
      <SEO
        title="Donate to Create Impact"
        description="Donate to OVA™. 50-100% tax deduction under 80G. Feed children, sponsor education. SBI FCRA Account details."
        canonical="/donate"
        keywords="donate OVA™, 80G tax exemption, NGO donation India, SBI FCRA, feed children"
      />

      <div className="donate-page-wrap">
        {/* Hero – same structure as About/Events/Services: centered, with Donate Now button */}
        <section className="about-hero donate-hero-style">
          <AboutHeroBg className="donate-hero-bg" />
          <div className="about-hero-overlay donate-hero-overlay" aria-hidden="true" />
          <div className="container about-hero-container">
            <div className="about-hero-content donate-hero-content">
              <p className="donate-hero-eyebrow">Every gift counts</p>
              <h1 className="about-hero-title">Donate to<br /><em>Create Impact</em></h1>
              <blockquote className="donate-hero-quote">
                We make a living by what we get. We make a life by what we give.
                <cite>, Winston Churchill</cite>
              </blockquote>
              <button type="button" onClick={scrollToDonateForm} className="donate-hero-cta">
                Donate Now
              </button>
            </div>
          </div>
        </section>

        {/* Donation: two columns – left = DONATE TO OVA™ & SAVE TAX content, right = form */}
        <section id="donation-form" className="d-section d-section-white d-donate-two-col-section">
          <div className="d-donate-two-col-grid">
            <div className="d-donate-left">
              <div className="d-tax-card d-tax-card-in-form">
                <div className="d-section-header d-tax-content">
                  <h2>{taxinfo.title}</h2>
                  <div className="d-tax-paras">
                    {taxinfo.paragraphs.map((text, i) => (
                      <p key={i} className="d-tax-para">{text}</p>
                    ))}
                  </div>
                  <ul className="d-tax-partners-list d-tax-partners-list--contact-style">
                    {taxinfo.implementingPartners.map((item, i) => (
                      <li key={i} className="d-tax-partner-item">
                        {typeof item === 'string' ? (
                          item
                        ) : (
                          <>
                            {item.icon && (
                              <i className={`bi ${item.icon} d-tax-partner-icon`} aria-hidden="true" />
                            )}
                            <div>
                              <strong className="d-tax-partner-title">{item.title}</strong>
                              {item.desc && <p className="d-tax-partner-desc">{item.desc}</p>}
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="d-section-line" />
                </div>
              </div>
            </div>
            <div className="d-donate-right">
              <div className="d-form-card">
              <h3>I wish to feed children</h3>
              <div className="d-amount-grid">
                {feedOptions.map((opt) => (
                  <button
                    key={opt.amount}
                    type="button"
                    className={`d-amount-btn ${feedAmountType === "preset" && donationAmount === opt.amount ? "active" : ""}`}
                    onClick={() => {
                      setFeedAmountType("preset");
                      setDonationAmount(opt.amount);
                      setCustomFeedAmount("");
                    }}
                  >
                    ₹{opt.amount.toLocaleString("en-IN")} – feed {opt.children} children
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="d-custom-btn"
                onClick={() => {
                  setFeedAmountType("custom");
                  setDonationAmount(0);
                }}
              >
                + Enter my own amount
              </button>
              {feedAmountType === "custom" && (
                <div className="d-field-full" style={{ marginBottom: 16 }}>
                  <label className="d-field-label">Custom amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Amount"
                    min="1"
                    value={customFeedAmount}
                    onChange={(e) => setCustomFeedAmount(e.target.value)}
                  />
                </div>
              )}

              <div className="d-check-row">
                <input
                  type="checkbox"
                  id="donate-edu"
                  checked={sponsorEducation}
                  onChange={(e) => {
                    setSponsorEducation(e.target.checked);
                    if (!e.target.checked) setEducationAmount(0);
                  }}
                />
                <span>I would also like to sponsor children&apos;s education fees (from ₹200)</span>
              </div>
              {sponsorEducation && (
                <div className="d-field-full" style={{ marginBottom: 14 }}>
                  <label className="d-field-label">Education amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    min="200"
                    value={educationAmount || ""}
                    onChange={(e) =>
                      setEducationAmount(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label className="d-field-label">Citizenship</label>
                <div className="d-citizenship-btns">
                  <button
                    type="button"
                    className={`d-citizenship-btn ${citizenship === "indian" ? "active" : ""}`}
                    onClick={() => setCitizenship("indian")}
                  >
                    Indian
                  </button>
                  <button
                    type="button"
                    className={`d-citizenship-btn ${citizenship === "foreign" ? "active" : ""}`}
                    onClick={() => setCitizenship("foreign")}
                  >
                    Foreign
                  </button>
                </div>
              </div>

              {/* Donate form – no reCAPTCHA here; reCAPTCHA loads only on Contact page */}
              <form onSubmit={handleDonateSubmit}>
                <div className="d-divider-label">
                  <strong>Donor Details ({citizenship === "indian" ? "Indian" : "Foreign"})</strong>
                  <span>{citizenship === "indian" ? "Enter PAN to receive the 80G certificate." : "Use USD, EUR, GBP, or AUD for Forex transfer."}</span>
                </div>

                <div className="d-field-row">
                  <div>
                    <label className="d-field-label">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="d-field-label">Email *</label>
                    <input
                      type="email"
                      placeholder="Your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="d-field-row">
                  <div>
                    <label className="d-field-label">Phone *</label>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  {citizenship === "indian" ? (
                    <div>
                      <label className="d-field-label">PAN *</label>
                      <input
                        type="text"
                        placeholder="PAN for 80G"
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="d-field-label">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="AUD">AUD</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="d-field-full">
                  <label className="d-field-label">Postal Address *</label>
                  <textarea placeholder="Complete address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                {citizenship === "foreign" && (
                  <div className="d-field-full">
                    <label className="d-field-label">Transaction number (after transfer)</label>
                    <input
                      type="text"
                      placeholder="Transaction number"
                      value={formData.transactionNumber}
                      onChange={(e) => setFormData({ ...formData, transactionNumber: e.target.value })}
                    />
                  </div>
                )}
                <div className="d-field-full">
                  <label className="d-field-label">Remark (optional)</label>
                  <input type="text" placeholder="Any note for us" value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
                </div>

                <p className="d-total-note">Donate and save tax under Section 80G</p>

                <div className="d-terms-row">
                  <input
                    type="checkbox"
                    id="donate-terms"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      setSubmitError("");
                    }}
                  />
                  <label htmlFor="donate-terms" style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0, fontSize: 12, color: "#777" }}>
                    I have read through the website&apos;s <Link to="/privacy">Privacy Policy</Link> &amp; <Link to="/terms">Terms and Conditions</Link> to make a donation.
                  </label>
                </div>

                {submitError && <p className="donate-error" style={{ marginBottom: 12 }}>{submitError}</p>}
                {donateStatus === "success" && (
                  <p className="donate-success" style={{ marginBottom: 12 }}>
                    Thank you! A confirmation has been sent to your email. OVA™ has been notified.
                  </p>
                )}

                {totalAmount >= 1 && (
                  <p className="d-confirm-amt" style={{ marginBottom: 16, fontSize: 15, color: "#333", fontWeight: 600 }}>
                    You are donating: <span style={{ color: "#2d5a27" }}>{formatTotal()}</span>
                  </p>
                )}
                <button type="submit" className="d-submit-btn" disabled={isDonateSubmitting}>
                  {isDonateSubmitting ? "Donating…" : "Donate"}
                </button>
              </form>
              </div>
            </div>
          </div>
        </section>

        {/* Bank Account Details – after form */}
        <section className="d-section d-section-grey d-bank-section" id="bank-details">
          <div className="d-section-header d-bank-section-header">
            <h2>Bank Account Details</h2>
            <p className="d-bank-intro">
              Transfer funds to our SBI FCRA Account using the details below. For 80G certificate, enter your PAN in the donation form and send the mandatory details to <a href="mailto:support@ova.ngo">support@ova.ngo</a> after your donation.
            </p>
            <div className="d-section-line" />
          </div>
          <div className="d-bank-grid">
            <div className="d-bank-right">
              <div className="d-info-card">
                <h3 className="d-bank-card-title">Foreign Donors</h3>
                <p>For Forex transfer use USD, EUR, GBP, or AUD (not INR). We can provide intermediary bank and currency details on request.</p>
              </div>
              <div className="d-info-card">
                <h3 className="d-bank-card-title">Required details: email <a href="mailto:support@ova.ngo">support@ova.ngo</a></h3>
                <ul className="d-dot-list d-bank-dot-list">
                  {donorInfoItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="d-info-card d-info-card--notes">
                <h3 className="d-bank-card-title">Important notes</h3>
                <p>Anonymous donations are not accepted. No donation via debit/credit card is acceptable per RBI guidelines. After transferring, please send the mandatory details to our support email.</p>
              </div>
            </div>
            <div className="d-card d-bank-table-card">
              <h3 className="d-bank-card-title d-bank-table-title">OVA™ – State Bank of India</h3>
              <div className="d-bank-row"><span className="d-bank-label">Account No.</span><span className="d-bank-value">43168261848</span></div>
              <div className="d-bank-row"><span className="d-bank-label">IFSC</span><span className="d-bank-value">SBIN0015557</span></div>
              <div className="d-bank-row"><span className="d-bank-label">Bank</span><span className="d-bank-value">State Bank of India (CSR Bank)</span></div>
              <div className="d-bank-row" style={{ borderBottom: "none", marginBottom: "16px" }}><span className="d-bank-label">Branch</span><span className="d-bank-value">42 Airport Road, AT POST Vidyanagar, Kolhapur, Ujalaiwadi 416004</span></div>
              <div className="d-table-wrap">
                <table>
                  <thead><tr><th>Sr.</th><th>Bank</th><th>Currency</th><th>SWIFT BIC</th><th>Account No.</th><th>Country</th></tr></thead>
                  <tbody><tr><td>1</td><td>State Bank of India</td><td>RS</td><td>–</td><td>43168261848</td><td>India</td></tr></tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ: accordion, centered */}
        <section className="d-section d-section-grey d-faq-section">
          <div className="d-faq-section-header">
            <h2 className="d-faq-title">Frequently Asked Questions</h2>
            <p className="d-faq-subtitle">Everything you need to know about donating to OVA™.</p>
            <div className="d-section-line d-faq-line" />
          </div>
          <div className="d-faq-accordion">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`d-faq-accordion-item ${faqOpenIndex === idx ? "d-faq-accordion-item--open" : ""}`}
              >
                <button
                  type="button"
                  className="d-faq-accordion-trigger"
                  onClick={() => setFaqOpenIndex(faqOpenIndex === idx ? -1 : idx)}
                  aria-expanded={faqOpenIndex === idx}
                  aria-controls={`d-faq-answer-${idx}`}
                  id={`d-faq-question-${idx}`}
                >
                  <span className="d-faq-accordion-question">{faq.q}</span>
                  <span className="d-faq-accordion-icon" aria-hidden="true">
                    {faqOpenIndex === idx ? (
                      <i className="bi bi-dash" aria-hidden="true" />
                    ) : (
                      <i className="bi bi-plus" aria-hidden="true" />
                    )}
                  </span>
                </button>
                <div
                  id={`d-faq-answer-${idx}`}
                  className="d-faq-accordion-answer"
                  role="region"
                  aria-labelledby={`d-faq-question-${idx}`}
                  hidden={faqOpenIndex !== idx}
                >
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}

export default Donate;
