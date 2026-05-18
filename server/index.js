const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
// Load server/.env first (PORT=5004 — CMS-OVA uses 5000). Root .env must not override PORT.
require('dotenv').config({ path: path.join(__dirname, '.env') });
const rootEnv = path.join(__dirname, '..', '.env');
if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv, override: false });
}

const app = express();
const PORT = Number(process.env.PORT) || 5004;
if (PORT === 5000) {
  console.warn(
    '[OVA Web] PORT=5000 conflicts with CMS-OVA on :5000. Set PORT=5004 in server/.env for OVA Web backend.'
  );
}

// Compression for smaller responses (gzip/brotli when available)
const compression = require('compression');
app.use(compression());

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets for SEO multipage site
const websitePath = path.join(__dirname, '../website');
const websiteAssetsPath = path.join(websitePath, 'assets');
if (fs.existsSync(websitePath)) {
  app.use('/assets', express.static(websiteAssetsPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=604800'),
  }));
}

// Optional SPA build with long cache for hashed assets
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  // 1) Long cache only for hashed static assets
  app.use('/app/static', express.static(path.join(buildPath, 'static'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
    immutable: process.env.NODE_ENV === 'production',
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));

  // 2) Medium cache for runtime public assets (images/icons)
  app.use('/app/images', express.static(path.join(buildPath, 'images'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    },
  }));

  // 3) Do not heavily cache HTML/app shell
  app.use('/app', express.static(buildPath, {
    maxAge: 0,
    setHeaders: (res, filePath) => {
      const name = path.basename(filePath);
      if (name === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));
}

const { getMongoUri, getDbName, isLocalUri } = require('./utils/mongoUri');
const MONGODB_URI = getMongoUri();
const DB_NAME = getDbName();

// API Routes
app.use('/api/contact', require('./routes/contact'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/join', require('./routes/join'));
app.use('/api/donate', require('./routes/donate'));
app.use('/api/donations', require('./routes/verifyDonation'));
app.use('/api/forms', require('./routes/formsTransfer'));
app.use('/api/cms', require('./routes/cmsProxy'));
app.use('/api', require('./routes/payment'));

// SEO-friendly multipage routes
if (fs.existsSync(websitePath)) {
  const pageRoutes = {
    '/': 'index.html',
    '/about': 'about.html',
    '/services': 'services.html',
    '/events': 'events.html',
    '/gallery': 'gallery.html',
    '/team': 'team.html',
    '/contact': 'contact.html',
    '/join': 'join.html',
    '/donate': 'donate.html',
  };

  Object.entries(pageRoutes).forEach(([route, file]) => {
    app.get(route, (req, res) => {
      res.sendFile(path.join(websitePath, file));
    });
  });

  app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(websitePath, 'robots.txt'));
  });

  app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(websitePath, 'sitemap.xml'));
  });
}

// SPA fallback under /app (if React build exists)
if (fs.existsSync(buildPath)) {
  app.get('/app/*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const { verifySmtpConnectionAsync } = require('./utils/sendEmail');

const mongooseOptions = {
  dbName: DB_NAME,
  serverSelectionTimeoutMS: 15000,
};

function connectMongo() {
  if (!MONGODB_URI) {
    return Promise.reject(
      new Error(
        'MONGODB_URI or MONGODB_HOST is not set in server/.env. Use MongoDB Atlas (cloud) or your server IP — no local MongoDB needed.'
      )
    );
  }
  if (isLocalUri(MONGODB_URI)) {
    console.warn(
      '[MongoDB] URI points to localhost. Set MONGODB_URI (Atlas) or MONGODB_HOST (remote IP) in server/.env for cloud/remote database.'
    );
  }
  return mongoose.connect(MONGODB_URI, mongooseOptions);
}

connectMongo()
  .then(async () => {
    console.log('MongoDB Connected (remote/cloud)');
    // Ensure ova_db exists and is visible in MongoDB (creates DB + collection on first run)
    try {
      await mongoose.connection.db.collection('_ova_init').updateOne(
        { _id: 'ova_db' },
        { $set: { initialized: true, at: new Date(), collections: ['newsletters', 'contacts', 'joins', 'donations'] } },
        { upsert: true }
      );
    } catch (e) {
      console.error('OVA DB init note:', e.message);
    }
    startServer();
  })
  .catch(err => {
    console.log('MongoDB Connection Error:', err.message || err);
    startServer(true);
  });

function startServer(withoutMongo = false) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      withoutMongo
        ? `Server running on http://0.0.0.0:${PORT} (without MongoDB — start MongoDB to load form data)`
        : `Server running on http://0.0.0.0:${PORT}`
    );
    verifySmtpConnectionAsync().catch(() => {});
  });
}
