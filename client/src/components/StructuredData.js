import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = import.meta.env.VITE_SITE_URL || import.meta.env.REACT_APP_SITE_URL || 'https://ova.ngo';

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "OVA™",
  "alternateName": "OVA™",
  "url": SITE_URL,
  "logo": `${SITE_URL}/favicon.svg`,
  "description": "Tech-based NGO dedicated to promoting volunteerism through innovative technology solutions. Empowering communities and volunteers.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Chavan-dafale colony, Uchgaon",
    "addressLocality": "Kolhapur",
    "addressRegion": "Maharashtra",
    "postalCode": "416005",
    "addressCountry": "IN"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+91-8080677811",
    "contactType": "customer service",
    "email": "support@ova.ngo",
    "areaServed": "IN"
  }
};

function StructuredData() {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
}

export default StructuredData;
