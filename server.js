const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');
const next = require('next');

const dev = false;
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '30000', 10);

const dataDir = path.join(__dirname, 'data');
const speciesPath = path.join(dataDir, 'species-data.json');
const categoriesPath = path.join(dataDir, 'categories.json');
const otpStorePath = path.join(dataDir, 'otp-store.json');
const usersPath = path.join(dataDir, 'app-users.json');

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function readJson(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return fallback; }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;
      const method = req.method;

      // --- GET /api/species ---
      if (pathname === '/api/species' && method === 'GET') {
        const data = readJson(speciesPath, []);
        const valid = data.filter(s => s.id && s.name);
        return json(res, { species: valid });
      }

      // --- GET /api/version ---
      if (pathname === '/api/version' && method === 'GET') {
        const sm = fs.existsSync(speciesPath) ? fs.statSync(speciesPath).mtimeMs : 0;
        const cm = fs.existsSync(categoriesPath) ? fs.statSync(categoriesPath).mtimeMs : 0;
        return json(res, { version: String(Math.max(sm, cm)) });
      }

      // --- POST /api/auth/send-otp ---
      if (pathname === '/api/auth/send-otp' && method === 'POST') {
        const { email } = await readBody(req);
        if (!email) return json(res, { error: 'Email required' }, 400);
        const code = generateOtp();
        const store = readJson(otpStorePath, {});
        store[email] = { code, expires: Date.now() + 10 * 60 * 1000 };
        writeJson(otpStorePath, store);
        // Return code in dev mode so mobile app can auto-fill
        return json(res, { message: 'OTP sent', otp_code: code });
      }

      // --- POST /api/auth/verify-otp ---
      if (pathname === '/api/auth/verify-otp' && method === 'POST') {
        const { email, code } = await readBody(req);
        const store = readJson(otpStorePath, {});
        const entry = store[email];
        if (!entry || entry.code !== code || Date.now() > entry.expires) {
          return json(res, { error: 'Invalid or expired OTP' }, 401);
        }
        delete store[email];
        writeJson(otpStorePath, store);
        const token = generateToken();
        const users = readJson(usersPath, []);
        let user = users.find(u => u.email === email);
        if (!user) {
          user = { id: 'usr_' + Date.now(), email, active: true, banned: false, joinedAt: new Date().toISOString(), lastSeen: new Date().toISOString(), speciesSeen: 0, role: 'user', token };
          users.push(user);
        } else {
          user.token = token;
          user.lastSeen = new Date().toISOString();
        }
        writeJson(usersPath, users);
        return json(res, { token, email });
      }

      // --- GET /api/auth/me ---
      if (pathname === '/api/auth/me' && method === 'GET') {
        const auth = req.headers['authorization'] || '';
        const token = auth.replace('Bearer ', '');
        if (!token) return json(res, { error: 'Unauthorized' }, 401);
        const users = readJson(usersPath, []);
        const user = users.find(u => u.token === token);
        if (!user) return json(res, { error: 'Unauthorized' }, 401);
        const { token: _t, ...safe } = user;
        return json(res, safe);
      }

      // --- POST /api/auth/logout ---
      if (pathname === '/api/auth/logout' && method === 'POST') {
        const auth = req.headers['authorization'] || '';
        const token = auth.replace('Bearer ', '');
        const users = readJson(usersPath, []);
        const user = users.find(u => u.token === token);
        if (user) { delete user.token; writeJson(usersPath, users); }
        return json(res, { message: 'Logged out' });
      }

      // --- Handle OPTIONS preflight ---
      if (method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' });
        return res.end();
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
