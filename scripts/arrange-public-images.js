/**
 * Move root-level images in client/public into respective folders.
 * Run once: node scripts/arrange-public-images.js
 */
const path = require('path');
const fs = require('fs');

const PUBLIC = path.join(__dirname, '../client/public');

const MOVES = [
  // Hero backgrounds -> images/hero/
  { from: 'herobg1.png', to: 'images/hero/herobg1.png' },
  { from: 'herobg1.webp', to: 'images/hero/herobg1.webp' },
  { from: 'herobg3.png', to: 'images/hero/herobg3.png' },
  { from: 'herobg3.webp', to: 'images/hero/herobg3.webp' },
  { from: 'herobg4.png', to: 'images/hero/herobg4.png' },
  { from: 'herobg4.webp', to: 'images/hero/herobg4.webp' },
  { from: 'hero1bg.jpg', to: 'images/hero/hero1bg.jpg' },
  { from: 'hero1bg.webp', to: 'images/hero/hero1bg.webp' },
  { from: 'below-hero-bg.png', to: 'images/hero/below-hero-bg.png' },
  { from: 'below-hero-bg.webp', to: 'images/hero/below-hero-bg.webp' },
  // Favicons -> images/favicons/
  { from: 'favicon-64.png', to: 'images/favicons/favicon-64.png' },
  { from: 'favicon-64.webp', to: 'images/favicons/favicon-64.webp' },
  { from: 'favicon-192.png', to: 'images/favicons/favicon-192.png' },
  { from: 'favicon-192.webp', to: 'images/favicons/favicon-192.webp' },
  // Logo variants -> images/
  { from: 'ovaloagowihitetext.jpeg', to: 'images/ovaloagowihitetext.jpeg' },
  { from: 'ovaloagowihitetext.webp', to: 'images/ovaloagowihitetext.webp' },
  { from: 'ovaloagowihitetextbrremmove.png', to: 'images/ovaloagowihitetextbrremmove.png' },
  { from: 'ovaloagowihitetextbrremmove.webp', to: 'images/ovaloagowihitetextbrremmove.webp' },
];

function move(srcRel, destRel) {
  const src = path.join(PUBLIC, srcRel);
  const dest = path.join(PUBLIC, destRel);
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(src, dest);
  return true;
}

console.log('Arranging root images into folders...');
let moved = 0;
for (const { from: srcRel, to: destRel } of MOVES) {
  if (move(srcRel, destRel)) {
    console.log('  ', srcRel, '->', destRel);
    moved++;
  }
}
console.log('Done. Moved', moved, 'files.');
if (moved === 0) console.log('(Files may already be in place or missing at root.)');
