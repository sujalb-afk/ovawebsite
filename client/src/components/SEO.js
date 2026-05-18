import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = import.meta.env.VITE_SITE_URL || import.meta.env.REACT_APP_SITE_URL || 'https://ova.ngo';
const DEFAULT_IMAGE = `${SITE_URL}/favicon.svg`;

function SEO({ 
  title, 
  description, 
  canonical, 
  image = DEFAULT_IMAGE, 
  type = 'website',
  keywords = 'volunteer india, OVA™, NGO, community empowerment, sustainability, volunteerism'
}) {
  const fullTitle = title ? `OVA™ | ${title}` : 'OVA™ | Open Volunteer Association: Empowering Communities';
  const fullCanonical = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="OVA™" />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="OVA™" />
    </Helmet>
  );
}

export default SEO;
