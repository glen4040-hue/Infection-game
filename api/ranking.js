const { getDb, sendJson } = require('./_shared');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  if (String(process.env.ENABLE_RANKING_API || 'false').toLowerCase() !== 'true') {
    return sendJson(res, 503, { ok: false, error: 'RANKING_DISABLED' });
  }
  try {
    // 동일 응답을 Vercel CDN에 5분간 캐시하여 Firestore 읽기 폭증을 방지한다.
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    const snapshot = await getDb()
      .collection('bestScores')
      .orderBy('score', 'desc')
      .limit(100)
      .get();
    const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return sendJson(res, 200, { ok: true, rows });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { ok: false, error: 'RANKING_FAILED' });
  }
};
