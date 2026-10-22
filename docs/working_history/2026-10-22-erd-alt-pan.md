# ERD Alt 이동

## 목적
- 다이어그램처럼 Alt 키를 누른 채 드래그하여 ERD 캔버스를 이동한다.

## 분석 및 수용 기준
- Alt+왼쪽 드래그가 테이블 위에서도 캔버스를 이동한다.
- 일반 왼쪽 드래그는 기존 테이블 이동 동작을 유지한다.

## 변경 파일
- `db-modeling.js`: Alt 입력 시 테이블 드래그를 건너뛰고 캔버스 팬 처리.
- `app.css`: Alt 이동 중 커서 표시.
- `fragments/layout.html`: CSS/JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 Alt+드래그와 일반 드래그를 확인한다.
