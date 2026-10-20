# DB 에디터 접기·펼치기 버튼

## 목적
- DB 에디터 우측 상단에서 에디터 사이드바를 접거나 펼칠 수 있게 한다.

## 변경 파일
- `src/main/resources/templates/db-modeling.html`
  - 에디터 우측 상단에 접기·펼치기 토글을 추가했다.
- `src/main/resources/static/js/db-modeling.js`
  - 기존 사이드바 접기 상태를 토글 버튼에 연결한다.
- `src/main/resources/static/css/app.css`
  - 버튼을 Monaco 세로 스크롤바 왼쪽 경계에 고정 배치하고 아이콘 전용 다크 테마로 스타일링했다.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`
- `git diff --check`

## 미해결 이슈 및 다음 작업
- 없음
