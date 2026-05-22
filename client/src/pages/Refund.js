import React from 'react';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { useCmsPage } from '../hooks/useCms';

function Refund() {
  const { data: cmsData, seo: cmsSeo, fromCms } = useCmsPage('refund');

  return (
    <div className="legal-page-wrap">
      <SEO
        title={cmsSeo?.title || "Return and Refund Policy"}
        description={cmsSeo?.description || "OVA™'s policy on returns and refunds for purchases and donations."}
        canonical="/refund"
        keywords="OVA™ refund, return policy, refund policy, NGO refund"
      />

      <section className="about-hero">
        <AboutHeroBg />
        <div className="about-hero-overlay" aria-hidden="true" />
        <div className="container about-hero-container">
          <div className="about-hero-content">
            <h1 className="about-hero-title">{fromCms && cmsData?.heroHeading ? cmsData.heroHeading : 'Return and Refund Policy'}</h1>
            <p className="about-hero-subtext">{fromCms && cmsData?.heroSubtext ? cmsData.heroSubtext : 'Last updated: December 05, 2024'}</p>
          </div>
        </div>
      </section>

      <div className="legal-content">
        <div className="legal-content-inner">
          {fromCms && (cmsData?.body || cmsData?.contentHtml) ? (
            <div dangerouslySetInnerHTML={{ __html: cmsData.body || cmsData.contentHtml }} />
          ) : (
            <>
              <p className="legal-lead">
                Thank you for shopping at Bharatiya Open Volunteer Association (OVA™). If, for any reason, You are not completely satisfied with a purchase We invite You to review our policy on refunds and returns.
              </p>

              <p>
                The following terms are applicable for any products that You purchased with Us.
              </p>

              <h2>Interpretation and Definitions</h2>
              <h3>Interpretation</h3>
              <p>
                The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
              </p>
              <h3>Definitions</h3>
              <p>For the purposes of this Return and Refund Policy:</p>
              <ul>
                <li><strong>Goods</strong> refer to the items offered for sale on the Service.</li>
                <li><strong>Orders</strong> mean a request by You to purchase Goods from Us.</li>
                <li><strong>Service</strong> refers to the Website.</li>
                <li><strong>Website</strong> refers to Bharatiya Open Volunteer Association (OVA™), accessible from ova.ngo.</li>
                <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
              </ul>

              <h2>Your Order Cancellation Rights</h2>
              <p>You are entitled to cancel Your Order within 45 days without giving any reason for doing so.</p>
              <p>
                The deadline for cancelling an Order is 45 days from the date on which You received the Goods or on which a third party you have appointed, who is not the carrier, takes possession of the product delivered.
              </p>
              <p>In order to exercise Your right of cancellation, You must inform Us of your decision by means of a clear statement. You can inform us of your decision by:</p>
              <p>By email: <a href="mailto:support@ova.ngo">support@ova.ngo</a></p>
              <p>
                We will reimburse You no later than 14 days from the day on which We receive the returned Goods. We will use the same means of payment as You used for the Order, and You will not incur any fees for such reimbursement.
              </p>

              <h2>Conditions for Returns</h2>
              <p>In order for the Goods to be eligible for a return, please make sure that:</p>
              <ul>
                <li>The Goods were purchased in the last 45 days</li>
                <li>The Goods are in the original packaging</li>
              </ul>
              <p>The following Goods cannot be returned:</p>
              <ul>
                <li>The supply of Goods made to Your specifications or clearly personalized.</li>
                <li>The supply of Goods which according to their nature are not suitable to be returned, deteriorate rapidly or where the date of expiry is over.</li>
                <li>The supply of Goods which are not suitable for return due to health protection or hygiene reasons and were unsealed after delivery.</li>
                <li>The supply of Goods which are, after delivery, according to their nature, inseparably mixed with other items.</li>
              </ul>
              <p>
                We reserve the right to refuse returns of any merchandise that does not meet the above return conditions in our sole discretion.
              </p>
              <p>
                Only regular priced Goods may be refunded. Unfortunately, Goods on sale cannot be refunded. This exclusion may not apply to You if it is not permitted by applicable law.
              </p>

              <h2>Returning Goods</h2>
              <p>You are responsible for the cost and risk of returning the Goods to Us. You should send the Goods at the following address:</p>
              <p>Chavan-dafale colony, Uchgaon, Kolhapur, Maharashtra 416005</p>
              <p>
                We cannot be held responsible for Goods damaged or lost in return shipment. Therefore, We recommend an insured and trackable mail service. We are unable to issue a refund without actual receipt of the Goods or proof of received return delivery.
              </p>

              <h2>Gifts</h2>
              <p>
                If the Goods were marked as a gift when purchased and then shipped directly to you, You&apos;ll receive a gift credit for the value of your return. Once the returned product is received, a gift certificate will be mailed to You.
              </p>
              <p>
                If the Goods weren&apos;t marked as a gift when purchased, or the gift giver had the Order shipped to themselves to give it to You later, We will send the refund to the gift giver.
              </p>

              <h2>Contact Us</h2>
              <p>If you have any questions about our Returns and Refunds Policy, please contact us:</p>
              <p>By email: <a href="mailto:support@ova.ngo">support@ova.ngo</a></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Refund;
