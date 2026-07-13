const { getDb, sendJson, FieldValue, crypto } = require('./_shared');

function normalize(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function playerKey(department, name) {
  return crypto.createHash('sha256').update(`${normalize(department)}::${normalize(name)}`).digest('hex');
}

async function deleteCollection(db, collectionName) {
  while (true) {
    const snap = await db.collection(collectionName).limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

  const configured = String(process.env.RANKING_ADMIN_SECRET || '');
  const authorization = String(req.headers.authorization || '');
  if (!configured || authorization !== `Bearer ${configured}`) {
    return sendJson(res, 403, { ok: false, error: 'FORBIDDEN' });
  }

  try {
    const db = getDb();
    const bestByPlayer = new Map();
    let lastDoc = null;
    let totalScores = 0;

    while (true) {
      let query = db.collection('scores').orderBy('__name__').limit(500);
      if (lastDoc) query = query.startAfter(lastDoc);
      const snap = await query.get();
      if (snap.empty) break;

      for (const doc of snap.docs) {
        totalScores += 1;
        const row = doc.data();
        const department = String(row.department || '').trim();
        const name = String(row.name || '').trim();
        const score = Number(row.score);
        if (!department || !name || !Number.isFinite(score) || score < 0) continue;

        const key = playerKey(department, name);
        const current = bestByPlayer.get(key);
        if (!current || score > current.score) {
          bestByPlayer.set(key, {
            department,
            name,
            score,
            playTime: Number(row.playTime || 0),
            sourceScoreId: doc.id
          });
        }
      }

      lastDoc = snap.docs[snap.docs.length - 1];
      if (snap.size < 500) break;
    }

    await deleteCollection(db, 'bestScores');

    const entries = Array.from(bestByPlayer.entries());
    for (let i = 0; i < entries.length; i += 400) {
      const batch = db.batch();
      for (const [key, row] of entries.slice(i, i + 400)) {
        batch.set(db.collection('bestScores').doc(key), {
          ...row,
          updatedAt: FieldValue.serverTimestamp(),
          rebuiltFromScores: true
        });
      }
      await batch.commit();
    }

    return sendJson(res, 200, {
      ok: true,
      totalScores,
      uniquePlayers: entries.length
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { ok: false, error: 'RANKING_REBUILD_FAILED' });
  }
};
