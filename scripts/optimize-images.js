/**
 * Image optimization pipeline: convert PNG/JPG to WebP with strict hero budgets.
 * Run: node scripts/optimize-images.js
 * Requires: npm install sharp (devDependency at project root)
 */
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '../client/public');
const MAX_HERO_WIDTH = 1920;
const HERO_QUALITY = 76;
const GENERAL_QUALITY = 85;
const MAX_HERO_BYTES = 120 * 1024;
const TARGETS = {
  'images/hero/herobg1.png': { maxBytes: 40 * 1024, maxWidth: 1440, minQuality: 38 },
  'images/about-hero-bg-silhouettes.png': { maxBytes: 25 * 1024, maxWidth: 1600, minQuality: 45 },
};

async function optimizeImages() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.warn('Skipping image optimization: run npm install sharp --save-dev to generate WebP.');
    return;
  }

  const heroNames = ['images/hero/herobg1.png', 'images/hero/herobg3.png', 'images/hero/herobg4.png', 'images/hero-skills.png'];
  const seen = new Set();

  async function processFile(relPath) {
    const fullPath = path.join(PUBLIC_DIR, relPath);
    if (!fs.existsSync(fullPath)) return;
    const ext = path.extname(relPath).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') return;
    const base = path.join(path.dirname(relPath), path.basename(relPath, ext));
    const webpPath = path.join(PUBLIC_DIR, base + '.webp');
    if (seen.has(webpPath)) return;
    seen.add(webpPath);

    const normalized = relPath.replace(/\\/g, '/');
    const isHero = heroNames.some((h) => normalized === h);
    const target = TARGETS[normalized];
    let pipeline = sharp(fullPath);
    const meta = await pipeline.metadata();
    let width = meta.width;
    const capWidth = target?.maxWidth || MAX_HERO_WIDTH;
    if ((isHero || target) && width > capWidth) {
      pipeline = pipeline.resize(capWidth, null, { withoutEnlargement: true });
      width = Math.min(width, capWidth);
    }

    let quality = isHero ? HERO_QUALITY : GENERAL_QUALITY;
    let buf = await pipeline.webp({ quality }).toBuffer();
    const byteTarget = target?.maxBytes || (isHero ? MAX_HERO_BYTES : Number.MAX_SAFE_INTEGER);
    const minQuality = target?.minQuality || 50;
    while ((isHero || target) && buf.length > byteTarget && quality > minQuality) {
      quality -= 6;
      buf = await sharp(fullPath)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
    }
    while ((isHero || target) && buf.length > byteTarget && width > 1024) {
      width = Math.floor(width * 0.9);
      buf = await sharp(fullPath)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: Math.max(minQuality, quality) })
        .toBuffer();
    }

    fs.mkdirSync(path.dirname(webpPath), { recursive: true });
    fs.writeFileSync(webpPath, buf);
    console.log('OK', relPath, '->', base + '.webp', `${(buf.length / 1024).toFixed(1)} KB`);

    // Navbar logos: emit full WebP + 90px and 180px (2x) for srcset to avoid loading 1024px
    const logoPaths = ['images/ova-logo-light.png', 'images/ova-logo-dark.png', 'images/ovalogo1.png', 'images/ovalogo2.png'];
    if (logoPaths.some((l) => relPath.replace(/\\/g, '/') === l)) {
      const dir = path.dirname(webpPath);
      const baseName = path.basename(webpPath, '.webp');
      for (const w of [90, 180]) {
        const smallPath = path.join(dir, `${baseName}-${w}w.webp`);
        if (seen.has(smallPath)) continue;
        seen.add(smallPath);
        const smallBuf = await sharp(fullPath).resize(w, w).webp({ quality: 85 }).toBuffer();
        fs.writeFileSync(smallPath, smallBuf);
        console.log('OK', relPath, '->', path.relative(PUBLIC_DIR, smallPath), `${(smallBuf.length / 1024).toFixed(1)} KB`);
      }
    }
  }

  function collect(dir, out) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.relative(PUBLIC_DIR, full).replace(/\\/g, '/');
      if (e.isDirectory()) collect(full, out);
      else if (e.isFile()) out.push(rel);
    }
  }

  const files = [];
  collect(PUBLIC_DIR, files);
  console.log('Optimizing images in client/public...');
  await Promise.all(files.map((rel) => processFile(rel)));
  console.log('Done.');
}

optimizeImages().catch((err) => {
  console.error(err);
  process.exit(1);
});
