# Monaco 세로 스크롤바 상시 표시

## 목적
- DB 모델링 Monaco 에디터에서 세로 스크롤바를 항상 표시한다.

## 변경 파일
- `src/main/resources/static/css/app.css`
  - 전역 WebKit 스크롤바 숨김 규칙보다 우선하도록 Monaco 세로 스크롤바와 슬라이더를 강제로 표시한다.

## 검증
- `git diff --check` 실행

## 미해결 이슈 및 다음 작업
- 없음
