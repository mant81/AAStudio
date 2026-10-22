# 테이블 설정 토글

## 목적
- 설정 아이콘을 다시 누르면 레이어가 닫히게 한다.

## 분석 및 수용 기준
- 같은 테이블의 아이콘을 연속 클릭하면 열림·닫힘이 전환된다.
- 다른 테이블 아이콘을 누르면 이전 레이어를 닫고 새 테이블 설정을 연다.

## 변경 파일
- `db-modeling.js`: 토글 및 `aria-expanded` 상태 처리.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 반복 클릭 동작을 확인한다.
