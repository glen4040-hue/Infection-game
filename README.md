# 감염병 게임 - 보안 저장 + 순위 재개 버전

- Vercel 서버 검증 점수 저장 유지
- Firestore 브라우저 직접 쓰기 차단 구조 유지
- 부서명+이름별 최고점 TOP 100 랭킹 재개
- 5분 CDN 캐시로 Firestore 읽기 보호
- 비정상 참여 경고 문구를 빨간색으로 표시
- 기존 scores → bestScores 일회성 재구축 API 포함

적용 순서는 `RANKING_RESTART_GUIDE.md`를 확인하세요.
