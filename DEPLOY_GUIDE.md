# 보안 점수 저장 버전 배포 안내

## 이번 변경 범위

게임의 환자 목록, 속도, 스테이지, 정답 판정, 점수 계산, 콤보, 체력은 변경하지 않았습니다.
변경된 부분은 점수 저장 경로뿐입니다.

- 기존: 브라우저 → Firestore 직접 저장
- 변경: 브라우저 → Vercel Function 검증 → Firestore 저장
- 랭킹 읽기는 계속 차단 상태입니다.

## 적용 전 반드시 할 일

### 1. Firebase 서비스 계정 키 만들기

Firebase/Google Cloud 콘솔에서 프로젝트 `infection-game-vercel`의 서비스 계정 JSON 키를 발급합니다.
JSON에서 아래 값을 사용합니다.

- `project_id`
- `client_email`
- `private_key`

키 파일 자체는 ZIP이나 GitHub에 올리지 마세요.

### 2. Vercel 환경변수 등록

Vercel 프로젝트 → Settings → Environment Variables에 다음을 등록합니다.

- `FIREBASE_PROJECT_ID`: `infection-game-vercel`
- `FIREBASE_CLIENT_EMAIL`: 서비스 계정 JSON의 `client_email`
- `FIREBASE_PRIVATE_KEY`: 서비스 계정 JSON의 `private_key` 전체
- `GAME_SESSION_SECRET`: 32자 이상의 임의 문자열
- `ALLOWED_ORIGIN`: 실제 게임 주소(예: `https://xxxxx.vercel.app`)
- `ENABLE_BEST_SCORES`: 현재는 `false`
- `ENABLE_RANKING_API`: 현재는 `false`

환경변수 등록 후 반드시 다시 배포합니다.

### 3. Firestore Rules 변경

`firestore.rules`의 내용을 Firebase 콘솔의 Firestore 규칙에 붙여 넣고 게시합니다.
이 작업은 새 Vercel 버전이 정상 작동하는 것을 확인한 직후 적용하세요.

주의: Rules를 먼저 막으면 기존 브라우저 직접 저장 버전에서는 점수가 저장되지 않습니다.
권장 순서:

1. 환경변수 설정
2. 새 버전 Vercel 배포
3. 직접 한 판 테스트해 `scores` 저장 확인
4. Firestore Rules를 `firestore.rules` 내용으로 변경
5. 다시 한 판 테스트

## 서버 검증 내용

- 게임 시작 시 서버가 서명된 1회용 세션 토큰 발급
- 서버 시간을 기준으로 플레이시간 계산
- 동일 세션 중복 제출 차단
- 30분이 지난 세션 차단
- 점수가 정수인지 확인
- 시간 대비 비현실적인 고득점 차단
- IP는 원문 대신 해시값만 저장
- Firestore에는 서버 함수만 기록 가능

## 현재 랭킹 설정

현재 읽기 한도 보호를 위해 랭킹 조회는 계속 차단되어 있습니다.
읽기 할당량이 회복된 후 `bestScores` 이관을 완료하고 다음 환경변수를 바꿀 수 있습니다.

- `ENABLE_BEST_SCORES=true`
- `ENABLE_RANKING_API=true`

단, 기존 `scores`를 `bestScores`로 옮기는 작업은 별도로 한 번 수행해야 합니다.

## 테스트 시 확인할 항목

정상 게임 1회를 마친 후 Firestore `scores` 문서에 아래 필드가 있으면 성공입니다.

- `validatedBy: vercel-function`
- `validationVersion: 1`
- `playTime`: 서버에서 계산된 시간
- `ipHash`: 해시 문자열

브라우저에서 Firestore에 직접 점수를 쓰려고 하면 Rules에 의해 거부되어야 합니다.
