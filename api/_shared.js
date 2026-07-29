const crypto = require('crypto');
const { getApps, initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: requireEnv('FIREBASE_PROJECT_ID'),
        clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),
        privateKey: requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n')
      })
    });
  }
  return getFirestore();
}

function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

function cleanText(value, max = 30) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function allowedOrigin(req) {
  const configured = String(process.env.ALLOWED_ORIGIN || '').trim();
  if (!configured) return true;
  const origin = String(req.headers.origin || '').trim();
  return origin === configured;
}

function applyCors(req, res) {
  const configured = String(process.env.ALLOWED_ORIGIN || '').trim();
  if (configured) res.setHeader('Access-Control-Allow-Origin', configured);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signPayload(payload) {
  const secret = requireEnv('GAME_SESSION_SECRET');
  const encoded = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  const secret = requireEnv('GAME_SESSION_SECRET');
  if (typeof token !== 'string' || token.length > 2500) throw new Error('INVALID_TOKEN');
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) throw new Error('INVALID_TOKEN');
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest();
  const received = Buffer.from(signature, 'base64url');
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new Error('INVALID_TOKEN');
  }
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  return payload;
}

function hashValue(value) {
  const secret = requireEnv('GAME_SESSION_SECRET');
  return crypto.createHmac('sha256', secret).update(String(value)).digest('hex');
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.socket?.remoteAddress || 'unknown');
}

function plausibleMaxScore(elapsedSeconds) {
  // 실제 게임보다 넉넉한 상한선이다. 정상 플레이는 막지 않되 비현실적인 점수만 거부한다.
  return Math.min(250000, 30 + Math.ceil(elapsedSeconds / 2) * 15);
}

async function updateBestScoreSafely(db, scoreData) {
  if (String(process.env.ENABLE_BEST_SCORES || 'false').toLowerCase() !== 'true') {
    return false;
  }
  const playerKey = crypto
    .createHash('sha256')
    .update(`${scoreData.department.toLowerCase()}::${scoreData.name.toLowerCase()}`)
    .digest('hex');
  const ref = db.collection('bestScores').doc(playerKey);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists || Number(snap.data().score || 0) < scoreData.score) {
        tx.set(ref, {
          department: scoreData.department,
          name: scoreData.name,
          score: scoreData.score,
          playTime: scoreData.playTime,
          updatedAt: FieldValue.serverTimestamp(),
          sourceScoreId: scoreData.scoreId
        });
      }
    });
    return true;
  } catch (error) {
    console.error('bestScores update failed:', error);
    return false;
  }
}

module.exports = {
  getDb,
  sendJson,
  parseBody,
  cleanText,
  allowedOrigin,
  applyCors,
  signPayload,
  verifyToken,
  hashValue,
  getClientIp,
  plausibleMaxScore,
  updateBestScoreSafely,
  FieldValue,
  Timestamp,
  crypto
};
