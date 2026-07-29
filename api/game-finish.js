const {
  getDb,
  sendJson,
  parseBody,
  allowedOrigin,
  applyCors,
  verifyToken,
  hashValue,
  getClientIp,
  plausibleMaxScore,
  updateBestScoreSafely,
  FieldValue,
  Timestamp
} = require('./_shared');

module.exports = async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  if (!allowedOrigin(req)) return sendJson(res, 403, { ok: false, error: 'ORIGIN_NOT_ALLOWED' });

  try {
    const body = parseBody(req);
    const payload = verifyToken(body.token);
    const score = Number(body.score);
    const now = Date.now();

    if (payload.v !== 1 || !payload.nonce || !payload.department || !payload.name) {
      return sendJson(res, 400, { ok: false, error: 'INVALID_SESSION' });
    }
    if (now > Number(payload.expiresAt || 0)) {
      return sendJson(res, 400, { ok: false, error: 'SESSION_EXPIRED' });
    }
    if (!Number.isInteger(score) || score < 0 || score > 250000) {
      return sendJson(res, 400, { ok: false, error: 'INVALID_SCORE' });
    }

    const elapsedSeconds = Math.max(0, Math.floor((now - Number(payload.startedAt)) / 1000));
    if (elapsedSeconds < 5 || elapsedSeconds > 12 * 60 * 60) {
      return sendJson(res, 400, { ok: false, error: 'INVALID_PLAY_TIME' });
    }

    const maxAllowed = plausibleMaxScore(elapsedSeconds);
    if (score > maxAllowed) {
      console.warn('Rejected implausible score', { score, maxAllowed, elapsedSeconds });
      return sendJson(res, 400, {
        ok: false,
        error: 'IMPLAUSIBLE_SCORE',
        message: '게임 시간에 비해 점수가 비정상적으로 높습니다.'
      });
    }

    const db = getDb();
    const submissionRef = db.collection('gameSubmissions').doc(payload.nonce);
    const scoreRef = db.collection('scores').doc();
    const batch = db.batch();

    batch.create(submissionRef, {
      scoreId: scoreRef.id,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(now + 7 * 24 * 60 * 60 * 1000)
    });
    batch.create(scoreRef, {
      department: payload.department,
      name: payload.name,
      score,
      playTime: elapsedSeconds,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 180),
      ipHash: hashValue(getClientIp(req)),
      createdAt: FieldValue.serverTimestamp(),
      validationVersion: 1,
      validatedBy: 'vercel-function'
    });

    await batch.commit();

    const bestScoreUpdated = await updateBestScoreSafely(db, {
      department: payload.department,
      name: payload.name,
      score,
      playTime: elapsedSeconds,
      scoreId: scoreRef.id
    });

    return sendJson(res, 200, {
      ok: true,
      id: scoreRef.id,
      playTime: elapsedSeconds,
      bestScoreUpdated
    });
  } catch (error) {
    if (String(error?.code || '').includes('already-exists') || Number(error?.code) === 6) {
      return sendJson(res, 409, { ok: false, error: 'SESSION_ALREADY_USED' });
    }
    console.error(error);
    return sendJson(res, 500, { ok: false, error: 'SAVE_FAILED' });
  }
};
