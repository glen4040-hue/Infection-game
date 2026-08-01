const { sendJson } = require('./_shared');

module.exports = async function handler(req, res) {
  return sendJson(res, 410, {
    ok: false,
    error: 'RANKING_CLOSED',
    message: '게임 프로젝트가 종료되어 순위를 공개하지 않습니다.'
  });
};
