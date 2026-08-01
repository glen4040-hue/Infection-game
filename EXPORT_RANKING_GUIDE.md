# 게임 종료 및 순위 CSV 내보내기

## 적용 결과

- 웹 접속 시 운영 종료 안내 화면만 표시됩니다.
- 게임 시작 API가 차단됩니다.
- 점수 저장 API가 차단됩니다.
- 공개 순위 API가 차단됩니다.
- 기존 Firestore `scores`, `bestScores` 데이터는 삭제하지 않습니다.
- 관리자만 `bestScores` 전체를 CSV로 내려받을 수 있습니다.

## 가장 쉬운 CSV 다운로드 방법

배포 후 아래 관리자 페이지에 접속합니다.

```text
https://infection-game-ten.vercel.app/admin-export.html
```

`RANKING_ADMIN_SECRET` 값을 입력하고 다운로드 버튼을 누르면 됩니다. 관리자 페이지는 종료 안내 화면에 노출되지 않습니다.

## PowerShell로 다운로드하는 방법

아래 명령을 실행합니다.

```powershell
Invoke-WebRequest `
  -Uri "https://infection-game-ten.vercel.app/api/export-ranking" `
  -Headers @{ Authorization = "Bearer 실제_RANKING_ADMIN_SECRET값" } `
  -OutFile "$HOME\Downloads\bestScores.csv"
```

완료 후 Windows 다운로드 폴더의 `bestScores.csv`를 Excel에서 열면 됩니다.
CSV에는 순위, 부서명, 이름, 최고점수, 플레이시간, 기록일시, 원본 문서 ID가 포함됩니다.

## 보안

- CSV API는 기존 Vercel 환경변수 `RANKING_ADMIN_SECRET`을 사용합니다.
- 비밀번호를 URL에 넣지 않고 Authorization 헤더로 전달합니다.
- 공개 순위 API는 종료 상태로 고정되어 누구나 조회할 수 없습니다.
