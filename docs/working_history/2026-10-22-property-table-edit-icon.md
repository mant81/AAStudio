# Properties 테이블 수정 아이콘

## 목적
- Tables 목록에서 수정 동작을 보이기 아이콘 앞의 별도 수정 아이콘으로 제공한다.

## 분석 및 수용 기준
- 테이블명 클릭은 기존처럼 캔버스 테이블 선택을 수행한다.
- 수정 아이콘은 설정 레이어를 연다.
- 캔버스의 단일 클릭·더블클릭 선택 동작은 유지한다.

## 변경 파일
- `db-modeling.js`: Properties 목록에 수정 아이콘과 설정 레이어 연결.
- `app.css`: 수정·보이기 아이콘 간격과 스타일.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 숨긴 테이블의 수정 아이콘 동작은 캔버스 노드가 없어 현재 제공하지 않는다.
