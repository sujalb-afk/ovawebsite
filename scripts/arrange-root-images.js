/**
 * Move image files from project root into client/public/images subfolders.
 * Run: node scripts/arrange-root-images.js
 */
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const IMAGES = path.join(ROOT, 'client/public/images');

function safeName(name) {
  return name
    .replace(/\s+/g, '-')
    .replace(/[&?]/g, '-')
    .replace(/__+/g, '-')
    .replace(/[^\w.-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image';
}

const MOVES = [
  // Services-related
  { from: 'communityoutreadch.jpg', to: 'services/community-outreach.jpg' },
  { from: 'EthicalAI&DigitalLiteracy.jpeg', to: 'services/ethical-ai-digital-literacy.jpeg' },
  { from: 'rural school.jpg', to: 'services/rural-school.jpg' },
  // Gallery / general
  { from: 'download.jpg', to: 'gallery/download.jpg' },
  { from: 'e-Learning in Primary Education.jpg', to: 'gallery/e-learning-primary-education.jpg' },
  { from: 'imgcard.jpeg', to: 'gallery/imgcard.jpeg' },
  {
    from: "Indian workers prioritize family time over career advancement in 2025_ insights from Indeed's survey.jpg",
    to: 'gallery/indian-workers-family-time-2025.jpg',
  },
  {
    from: 'Life is not meant to be lived in isolation but in community! That\'s why we have always been pretty big fans of gathering people together in circles ?? __It\'s also why we love our incredible community of generous gi.jpg',
    to: 'gallery/community-gathering.jpg',
  },
];

let moved = 0;
for (const { from: srcName, to: destRel } of MOVES) {
  const src = path.join(ROOT, srcName);
  const dest = path.join(IMAGES, destRel);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(src, dest);
  console.log('  ', srcName, '->', 'client/public/images/' + destRel);
  moved++;
}
// Move any remaining image files in root to gallery (e.g. long/funky filenames)
const remaining = fs.readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(e.name));
for (const e of remaining) {
  const src = path.join(ROOT, e.name);
  const base = path.basename(e.name, path.extname(e.name));
  const safe = base.replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 60) || 'image';
  const destRel = 'gallery/' + safe + path.extname(e.name).toLowerCase();
  const dest = path.join(IMAGES, destRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(src, dest);
  console.log('  ', e.name, '->', 'client/public/images/' + destRel);
  moved++;
}
console.log('Done. Moved', moved, 'files from project root.');
