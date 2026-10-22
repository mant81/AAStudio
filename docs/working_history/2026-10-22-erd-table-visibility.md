# 프로퍼티 테이블 표시 전환

## 목적
- 우측 Properties의 Tables 목록에서 테이블별 숨기기·보이기를 제공한다.

## 분석 및 수용 기준
- 각 테이블명 오른쪽 눈 아이콘을 누르면 캔버스 표시가 전환된다.
- 숨긴 테이블에 연결된 관계선도 그리지 않는다.
- 표시 상태는 레이아웃 저장값에 남아 새로고침 뒤 유지된다.

## 변경 파일
- `db-modeling.js`: 목록의 표시 버튼, 레이아웃 상태 저장, ERD 렌더링 필터.
- `app.css`: 아이콘 버튼 위치와 크기.
- `fragments/layout.html`: CSS/JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 숨기기·보이기와 새로고침 뒤 상태를 확인한다.
