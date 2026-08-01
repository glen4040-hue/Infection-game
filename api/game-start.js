const { sendJson, applyCors } = require('./_shared');

module.exports = async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  return sendJson(res, 410, {
    ok: false,
    error: 'GAME_CLOSED',
    message: '게임 프로젝트가 종료되어 새로운 참여를 받지 않습니다.'
  });
};
