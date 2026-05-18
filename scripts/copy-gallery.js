const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, '..', 'Gallary');
const destDir = path.join(__dirname, '..', 'client', 'public', 'images', 'gallery');
if (!fs.existsSync(srcDir)) {
  console.log('Gallary folder not found');
  process.exit(1);
}
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
const all = fs.readdirSync(srcDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
const imgFirst = ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg'];
const rest = all.filter((f) => !imgFirst.includes(f)).sort();
let n = 0;
imgFirst.forEach((name) => {
  const full = path.join(srcDir, name);
  if (fs.existsSync(full)) {
    fs.copyFileSync(full, path.join(destDir, name));
    n++;
  }
});
rest.forEach((f) => {
  n++;
  const ext = path.extname(f);
  const destName = `gallery-${n}${ext}`;
  fs.copyFileSync(path.join(srcDir, f), path.join(destDir, destName));
});
console.log('Copied', n, 'images to', destDir);
