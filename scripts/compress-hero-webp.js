/**
 * Compress hero WebP images to quality 72 (target <100 KiB each for LCP).
 * Run from project root: node scripts/compress-hero-webp.js
 * Requires: npm install sharp --save-dev (project root)
 */
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '..', 'client', 'public');
const HERO_QUALITY = 72;
const HERO_MAX_KB = 100;
const HERO_FILES = [
  'images/hero/herobg1.webp',
  'images/hero/herobg3.webp',
  'images/hero/herobg4.webp',
  'images/hero-skills.webp',
];

async function compressHeroWebp() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.warn('Run npm install sharp --save-dev (project root or client) to compress hero images.');
    return;
  }

  for (const rel of HERO_FILES) {
    const full = path.join(PUBLIC_DIR, rel);
    if (!fs.existsSync(full)) {
      console.warn('Skip (not found):', rel);
      continue;
    }
    const inputBuf = fs.readFileSync(full);
    let quality = HERO_QUALITY;
    let buf = await sharp(inputBuf).webp({ quality }).toBuffer();
    while (buf.length > HERO_MAX_KB * 1024 && quality > 50) {
      quality -= 5;
      buf = await sharp(inputBuf).webp({ quality }).toBuffer();
    }
    fs.writeFileSync(full, buf);
    const kb = (buf.length / 1024).toFixed(1);
    console.log('OK', rel, kb, 'KB', buf.length <= HERO_MAX_KB * 1024 ? '(under 100KB)' : '');
  }
  console.log('Done.');
}

compressHeroWebp().catch((err) => {
  console.error(err);
  process.exit(1);
});
