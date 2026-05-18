/**
 * Postbuild: make main CSS load non-blocking (saves ~610ms render blocking).
 * Run from client/ after react-scripts build. Modifies build/index.html.
 */
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.warn('async-css-postbuild: build/index.html not found, skipping.');
  process.exit(0);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Match CRA main CSS OR Vite hashed CSS link.
const linkRegex = /<link(?:\s+href="(\/static\/css\/main\.[a-zA-Z0-9]+\.css)"\s+rel="stylesheet"\s*\/?|\s+rel="stylesheet"\s+href="(\/static\/css\/main\.[a-zA-Z0-9]+\.(?:chunk\.)?css)"\s*\/?|\s+rel="stylesheet"\s+crossorigin\s+href="(\/assets\/index-[a-zA-Z0-9_-]+\.css)"\s*\/?|\s+crossorigin\s+href="(\/assets\/index-[a-zA-Z0-9_-]+\.css)"\s+rel="stylesheet"\s*\/?)>/i;
const match = html.match(linkRegex);

if (!match) {
  console.warn('async-css-postbuild: no main.*.css link found, skipping.');
  process.exit(0);
}

const href = match[1] || match[2] || match[3] || match[4];
const asyncLink = `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">\n<noscript><link rel="stylesheet" href="${href}"></noscript>`;
html = html.replace(linkRegex, asyncLink);

fs.writeFileSync(indexPath, html);
console.log('async-css-postbuild: main CSS async loading applied.');
