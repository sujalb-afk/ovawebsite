import React from 'react';

/**
 * Renders the OVA brand name with trademark superscript (™).
 * Use for visible brand display in UI; use string "OVA™" in meta/alt/long copy.
 */
function OvaBrand() {
  return (
    <span className="ova-brand">
      OVA<sup className="ova-tm-sup" aria-label="trademark">™</sup>
    </span>
  );
}

export default OvaBrand;
