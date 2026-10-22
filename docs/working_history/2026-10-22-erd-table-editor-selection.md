# ERD 테이블 선택 시 편집기 연동

## 목적
- 캔버스에서 테이블을 선택하면 왼쪽 편집기의 해당 정의를 선택한다.

## 분석 및 수용 기준
- DBML/DDL의 테이블 정의 시작부터 닫는 괄호까지 선택하고 시작 줄로 스크롤한다.

## 변경 파일
- `db-modeling.js`: 테이블 선언 검색 및 Monaco 선택·스크롤 연결.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 DBML/DDL 테이블 클릭 후 편집기 선택 범위를 확인한다.
