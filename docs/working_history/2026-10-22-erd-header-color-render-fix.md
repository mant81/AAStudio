# ERD 헤더 색상 적용 수정

## 목적
- 설정에서 선택한 헤더 색상이 ERD 테이블에 적용되지 않는 문제를 해결한다.

## 원인과 수용 기준
- 색상 CSS 변수 지정이 실제 ERD 테이블 렌더링 함수가 아닌 다른 렌더링 경로에 들어가 있었다.
- 설정 저장 후 다시 그려지는 테이블 헤더와 모서리에 선택한 색상이 적용되어야 한다.

## 변경 파일
- `db-modeling.js`: 색상 변수 지정 위치를 실제 `renderErd`의 테이블 생성 위치로 이동.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 색상 저장·새로고침 후 유지 여부를 확인한다.
