# 순위 재개 적용 순서

## 1. 먼저 기존 의심 점수 처리
사실 확인 후 순위에서 제외할 `scores` 문서를 삭제하거나 별도로 보관하세요.
랭킹 재구축은 현재 `scores`에 남아 있는 기록을 기준으로 합니다.

## 2. Vercel 환경변수 변경
- `ENABLE_BEST_SCORES=true`
- `ENABLE_RANKING_API=true`
- `RANKING_ADMIN_SECRET` 추가: 32자 이상의 별도 임의 문자열

환경변수를 저장한 뒤 새 배포가 필요합니다.

## 3. 이 ZIP의 코드를 Git에 push하여 배포
기존 보안 점수 저장 기능은 그대로 유지됩니다.

## 4. 기존 점수로 bestScores를 한 번 재구축
Windows PowerShell에서 아래 명령을 한 번 실행하세요.

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://실제게임주소.vercel.app/api/rebuild-ranking" `
  -Headers @{ Authorization = "Bearer RANKING_ADMIN_SECRET에_넣은_값" }
```

성공 시 `ok: true`, `totalScores`, `uniquePlayers`가 표시됩니다.

## 5. 확인
게임 시작 화면에서 `게임 순위 보기`를 눌러 TOP 100을 확인하세요.
신규 점수는 `scores`에 전체 이력으로 저장되고, `bestScores`에는 같은 부서명+이름의 최고점만 유지됩니다.

## 읽기 보호
- 랭킹 쿼리는 `bestScores`에서 점수순 최대 100개만 조회합니다.
- Vercel CDN에서 5분간 캐시하므로 반복 새로고침으로 인한 Firestore 읽기 폭증을 줄입니다.
- 순위 반영은 최대 약 5분 지연될 수 있습니다.
