import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import SEO from "../components/SEO";
import Footer from "../components/Footer";
import { getOptimizedImageUrl } from "../utils/imageUrl";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || "";
const PAGE_TITLE = "Donation Receipt";

const verifyCache = new Map();

const FIELDS = [
  { key: "receiptNumber", label: "Receipt Number" },
  { key: "donorName", label: "Donor Name" },
  { key: "email", label: "Email ID" },
  { key: "mobile", label: "Mobile Number" },
  { key: "address", label: "Address" },
  { key: "purpose", label: "Purpose of Donation" },
  { key: "modeOfDonation", label: "Mode of Donation" },
  { key: "dateOfDonation", label: "Date of Donation" },
  { key: "amount", label: "Amount of Donation", format: (v) => (v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "N/A") },
  { key: "amountWords", label: "Amount in Words" },
];

function VerifyDonation() {
  const { receiptNumber } = useParams();
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!receiptNumber) {
      setStatus("error");
      setMessage("Invalid or unverified donation receipt.");
      return;
    }
    const cached = verifyCache.get(receiptNumber);
    if (cached) {
      setData(cached.data);
      setMessage(cached.message || "");
      setStatus(cached.verified ? "verified" : "not-found");
      return;
    }
    const url = `${API_BASE}/api/donations/verify/${encodeURIComponent(receiptNumber)}`;
    axios
      .get(url, { timeout: 10000 })
      .then((res) => {
        const payload = {
          data: res.data.data,
          message: res.data.message || "",
          verified: !!res.data.verified,
        };
        verifyCache.set(receiptNumber, payload);
        setData(payload.data);
        setMessage(payload.message);
        setStatus(payload.verified ? "verified" : "not-found");
      })
      .catch(() => {
        setMessage("Invalid or unverified donation receipt.");
        setStatus("error");
      });
  }, [receiptNumber]);

  return (
    <>
      <SEO
        title={PAGE_TITLE}
        description="Verify your OVA™ donation receipt online."
        canonical={`/verify/donation/${receiptNumber || ""}`}
      />
      <div className="donate-page-wrap">
        <section className="d-section d-section-white verify-donation-section">
          <div className="verify-donation-content">
            {status === "loading" && (
              <div style={{ textAlign: "center", padding: 48 }}>
                <p style={{ color: "#555" }}>Verifying receipt…</p>
              </div>
            )}

            {status === "verified" && data && (
              <div className="verify-receipt-card" style={{ position: "relative", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div
                  className="verify-receipt-watermark"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 320,
                    height: 320,
                    maxWidth: "85%",
                    maxHeight: "85%",
                    opacity: 0.2,
                    pointerEvents: "none",
                    backgroundImage: `url(${getOptimizedImageUrl("/images/ovafinal11.webp")})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                <h1 style={{ marginTop: 0, marginBottom: 4, paddingTop: 2, lineHeight: 1.3, color: "#333", fontSize: 22, fontWeight: 700 }}>
                  {PAGE_TITLE}
                </h1>
                <span
                  style={{
                    display: "inline-block",
                    marginBottom: 20,
                    padding: "6px 14px",
                    background: "#2e7d32",
                    color: "#fff",
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Verified Donation
                </span>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {FIELDS.map(({ key, label, format }) => (
                      <tr key={key}>
                        <td style={{ padding: "10px 0", borderBottom: "1px solid #eee", color: "#666", width: "42%" }}>{label}</td>
                        <td style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                          {format ? format(data[key]) : (data[key] ?? "N/A")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ marginTop: 24, fontSize: 13, color: "#666" }}>
                  This receipt has been verified by Bharatiya Open Volunteer Association (OVA™).
                </p>
                <p style={{ marginTop: 16, fontSize: 12, color: "#888", lineHeight: 1.4 }}>
                  OVA™ is the public brand of Bharatiya Open Volunteer Association
                  <br />
                  (A Section 8 Company, India)
                </p>
                <Link to="/" className="d-btn-green" style={{ display: "inline-block", marginTop: 16 }}>Back to Home</Link>
                </div>
              </div>
            )}

            {(status === "error" || status === "not-found") && (
              <div style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 48, marginBottom: 16, color: "#c62828" }} aria-hidden="true">✕</div>
                <h1 style={{ marginBottom: 12, color: "#333" }}>Invalid or unverified donation receipt.</h1>
                <p style={{ color: "#555", marginBottom: 24 }}>{message}</p>
                <Link to="/" className="d-btn-outline" style={{ display: "inline-block" }}>Back to Home</Link>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default VerifyDonation;
