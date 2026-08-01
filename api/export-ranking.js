const { getDb } = require('./_shared');

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatTimestamp(value) {
  if (!value) return '';
  try {
    const date = typeof value.toDate === 'function'
      ? value.toDate()
      : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).format(date);
  } catch (_) {
    return '';
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: false, error: 'METHOD_NOT_ALLOWED' }));
  }

  const configuredSecret = String(process.env.RANKING_ADMIN_SECRET || '').trim();
  const authHeader = String(req.headers.authorization || '');
  const providedSecret = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!configuredSecret || providedSecret !== configuredSecret) {
    res.status(401).setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ ok: false, error: 'UNAUTHORIZED' }));
  }

  try {
    const snapshot = await getDb()
      .collection('bestScores')
      .orderBy('score', 'desc')
      .get();

    const header = [
      '순위', '부서명', '이름', '최고점수', '플레이시간(초)',
      '기록일시', '원본점수문서ID', 'bestScores문서ID'
    ];

    const lines = [header.map(csvCell).join(',')];

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data() || {};
      lines.push([
        index + 1,
        data.department || '',
        data.name || '',
        Number(data.score || 0),
        Number(data.playTime || 0),
        formatTimestamp(data.updatedAt),
        data.sourceScoreId || '',
        doc.id
      ].map(csvCell).join(','));
    });

    const csv = '\uFEFF' + lines.join('\r\n');
    const dateStamp = new Date().toISOString().slice(0, 10);

    res.status(200);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bestScores_${dateStamp}.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.end(csv);
  } catch (error) {
    console.error('Ranking CSV export failed:', error);
    res.status(500).setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ ok: false, error: 'EXPORT_FAILED' }));
  }
};
