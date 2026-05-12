// Mock live location sender for GeoTrack
// Usage:
//   Set env vars USER1_TOKEN and USER2_TOKEN to valid JWTs (or set AUTH_MODE=cookie and AUTH_COOKIE value)
//   node scripts/mock-locations.js

const BASE_URL = process.env.GEOTRACK_URL || 'https://geotrack-live.onrender.com';
const ENDPOINT = `${BASE_URL.replace(/\/$/, '')}/api/location/update`;
const INTERVAL_MS = 5000;

// Two fake users (Delhi, Mumbai). Tokens read from env: USER1_TOKEN, USER2_TOKEN
const users = [
  { name: 'Delhi', lat: 28.7041, lon: 77.1025, tokenEnv: 'USER1_TOKEN' },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, tokenEnv: 'USER2_TOKEN' },
];

// Choose auth mode: 'header' (Authorization: Bearer) or 'cookie' (authToken cookie)
const AUTH_MODE = (process.env.AUTH_MODE || 'header').toLowerCase();

// load fetch (Node 18+ has global fetch)
let fetchFunc = global.fetch;
if (!fetchFunc) {
  try {
    fetchFunc = require('node-fetch');
  } catch (err) {
    console.error('Global fetch not available and node-fetch not installed. Install node-fetch or use Node 18+.');
    process.exit(1);
  }
}

function getAuthHeaderOrCookie(token) {
  if (!token) return {};
  if (AUTH_MODE === 'cookie') return { cookie: `authToken=${token}` };
  return { authorization: `Bearer ${token}` };
}

function jitter(value, meters = 50) {
  // very small lat/lon jitter (~meters). Approx conversion: 0.00001 ~ 1.11m
  const factor = (meters / 111000); // ~degrees
  return value + (Math.random() - 0.5) * factor;
}

async function sendLocation(user) {
  const token = process.env[user.tokenEnv] || '';
  const headers = Object.assign({ 'content-type': 'application/json' }, getAuthHeaderOrCookie(token));
  const latitude = jitter(user.lat, 30);
  const longitude = jitter(user.lon, 30);
  const body = { latitude, longitude, accuracy: Math.floor(Math.random() * 20) + 5 };

  try {
    const resp = await fetchFunc(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    let respText = '';
    try { respText = await resp.text(); } catch (e) { respText = '<no body>'; }

    console.log(`[${new Date().toISOString()}] ${user.name}: ${resp.status} ${resp.statusText} - ${respText}`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ${user.name}: request failed:`, err.message || err);
  }
}

console.log('Mock location sender starting');
console.log(`Endpoint: ${ENDPOINT}`);
console.log(`Auth mode: ${AUTH_MODE} (set AUTH_MODE=cookie to send authToken cookie instead)`);
users.forEach((u) => console.log(`User: ${u.name}, token env: ${u.tokenEnv}, token present: ${Boolean(process.env[u.tokenEnv])}`));

const timers = users.map((user) => {
  // send immediately then every INTERVAL_MS
  sendLocation(user);
  return setInterval(() => sendLocation(user), INTERVAL_MS);
});

process.on('SIGINT', () => {
  console.log('\nStopping mock sender...');
  timers.forEach(clearInterval);
  process.exit(0);
});
