const {
  sendJson,
  parseBody,
  cleanText,
  allowedOrigin,
  applyCors,
  signPayload,
  crypto
} = require('./_shared');

module.exports = async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  if (!allowedOrigin(req)) return sendJson(res, 403, { ok: false, error: 'ORIGIN_NOT_ALLOWED' });

  const body = parseBody(req);
  const department = cleanText(body.department, 30);
  const name = cleanText(body.name, 30);

  if (!department || !name) {
    return sendJson(res, 400, { ok: false, error: 'NAME_REQUIRED' });
  }

  const now = Date.now();
  const token = signPayload({
    v: 1,
    nonce: crypto.randomBytes(18).toString('base64url'),
    department,
    name,
    startedAt: now,
    expiresAt: now + 30 * 60 * 1000
  });

  return sendJson(res, 200, { ok: true, token });
};
