# ERD 격자 표시 전환 기능 보강

## 목적
- DB 모델링 화면의 격자 버튼 상태를 명확히 표시하고 사용자 설정을 유지한다.

## 분석 및 수용 기준
- `grid_on` 버튼으로 격자를 표시하거나 숨길 수 있다.
- 버튼의 `aria-pressed`, 아이콘, 도움말이 현재 상태와 일치한다.
- 새로고침 후에도 마지막 격자 표시 상태를 유지한다.
- 캔버스 위에서 격자 점이 실제로 식별 가능해야 한다.

## 변경 파일
- `src/main/resources/templates/db-modeling.html`: 버튼 초기 접근성 상태와 title 추가
- `src/main/resources/static/js/db-modeling.js`: 상태 동기화 및 localStorage 저장/복원
- `src/main/resources/templates/db-modeling.html`: 잘못된 Tailwind 변수 대신 유효한 RGBA 색상으로 격자 배경 지정
- `src/main/resources/templates/db-modeling.html`: 고정된 `schema.dbml` 표시 영역에 식별자 추가
- `src/main/resources/static/js/db-modeling.js`: 선택한 스키마 이름 기반의 DBML 문서명 표시
- `src/main/resources/templates/db-modeling.html`: 중복 의미의 `DBML` 배지를 제거하고 파일명 영역 확장
- `src/main/resources/templates/db-modeling.html`: 편집기 헤더의 `GUI 생성` 버튼 제거
- `src/main/resources/templates/db-modeling.html`: 실제 파일 기능이 없는 `schema.dbml` 표시 제거
- `src/main/resources/static/js/db-modeling.js`: 제거된 파일명 표시 관련 로직 정리
- `src/main/resources/static/js/db-modeling.js`: 스키마 선택 목록의 현재 선택 상태 표시 및 접근성 속성 보강
- `src/main/resources/templates/db-modeling.html`: 스키마 추가용 공통 이름 모달 추가
- `src/main/resources/static/js/db-modeling.js`: 스키마 추가를 `prompt()` 대신 공통 모달 제출 흐름으로 연결
- `src/main/resources/templates/fragments/layout.html`: Monaco Editor 로컬 loader 및 스타일 연결
- `src/main/resources/templates/db-modeling.html`: textarea 대신 Monaco 표시 영역 추가
- `src/main/resources/static/css/app.css`: Monaco 편집기 영역 레이아웃 추가
- `src/main/resources/static/js/db-modeling.js`: Monaco 입력값을 기존 저장·분석 흐름과 동기화
- `src/main/resources/static/js/db-modeling.js`: ERD 조작 도구를 캔버스로 이동하고 에디터/ERD 전환 버튼은 상단 유지
- `src/main/resources/static/css/app.css`: ERD 도구 바 하단 고정 스타일 추가
- `src/main/resources/templates/fragments/layout.html`: 펼친 `main-sidebar` 폭을 260px에서 220px로 축소
- `src/main/resources/static/css/app.css`: 공통 사이드바 폭 변수도 220px로 동기화

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`
- `git diff --check`

## 미해결 이슈 및 다음 작업
- 없음
