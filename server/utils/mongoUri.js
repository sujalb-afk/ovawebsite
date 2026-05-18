/**
 * Build MongoDB URI from server/.env — supports Atlas (cloud) or remote server IP.
 * No local MongoDB install required.
 */
function cleanEnv(value) {
  if (!value) return '';
  return String(value).trim().replace(/^['"]|['"]$/g, '');
}

function getMongoUri() {
  const direct = cleanEnv(process.env.MONGODB_URI);
  if (direct && !direct.includes('127.0.0.1') && !direct.includes('localhost')) {
    return direct;
  }

  const host = cleanEnv(process.env.MONGODB_HOST);
  if (host) {
    const user = encodeURIComponent(cleanEnv(process.env.MONGODB_USER) || 'adminOrelse');
    const pass = encodeURIComponent(cleanEnv(process.env.MONGODB_PASS) || 'orelse12');
    const db = cleanEnv(process.env.MONGODB_DB) || 'ova_db';
    const authSource = cleanEnv(process.env.MONGODB_AUTH_SOURCE) || 'admin';
    if (host.includes('.mongodb.net')) {
      return `mongodb+srv://${user}:${pass}@${host}/${db}?retryWrites=true&w=majority&authSource=${authSource}`;
    }
    return `mongodb://${user}:${pass}@${host}:27017/${db}?authSource=${authSource}`;
  }

  if (direct) return direct;

  return '';
}

function getDbName() {
  const explicit = cleanEnv(process.env.MONGODB_DB);
  if (explicit) return explicit;
  const uri = getMongoUri();
  if (!uri) return 'ova_db';
  try {
    const path = uri.split('?')[0].split('/').pop();
    if (path && !path.includes('@')) return path;
  } catch {
    /* ignore */
  }
  return 'ova_db';
}

function isLocalUri(uri) {
  return /127\.0\.0\.1|localhost/i.test(uri || '');
}

module.exports = { getMongoUri, getDbName, isLocalUri, cleanEnv };
