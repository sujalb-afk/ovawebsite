import React, { useState } from "react";
import { cmsImageUrl } from "../utils/imageUrl";

// Root-relative path so image works with any origin (dev, production, serve -s build)
const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
const HERO_BG_IMAGE = cmsImageUrl(`${basePath}/images/about-hero-bg-silhouettes.webp`);
const HERO_BG_FALLBACK = cmsImageUrl(`${basePath}/images/about-hero-bg.webp`);

/**
 * Hero background for About, Services, Events, Team, Contact, Donate, Join, etc.
 * Uses <img> for LCP; CSS .about-hero-bg also has background-image fallback so the image always shows.
 */
function AboutHeroBg({ className = "" }) {
  const [src, setSrc] = useState(HERO_BG_IMAGE);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (src === HERO_BG_IMAGE) {
      setSrc(HERO_BG_FALLBACK);
    } else {
      setFailed(true);
    }
  };

  const bgImageUrl = cmsImageUrl(`${basePath}/images/about-hero-bg-silhouettes.webp`);
  return (
    <div
      className={`about-hero-bg ${className}`.trim()}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        backgroundColor: failed ? "#2d4a3e" : undefined,
        backgroundImage: !failed ? `url(${bgImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      aria-hidden="true"
    >
      {!failed && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          loading="eager"
          width={1920}
          height={1080}
          onError={handleError}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

export default React.memo(AboutHeroBg);
