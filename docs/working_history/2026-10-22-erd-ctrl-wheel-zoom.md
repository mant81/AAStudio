# ERD Ctrl+휠 확대·축소

## 목적
- 캔버스에서 Ctrl+휠 위아래로 확대·축소한다.

## 분석 및 수용 기준
- 휠 위는 확대, 아래는 축소한다.
- 마우스 위치를 기준으로 캔버스가 움직이고 기존 40~200% 제한을 지킨다.

## 변경 파일
- `db-modeling.js`: Ctrl+휠 이벤트와 줌 중심 보정.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 마우스 위치 기준 확대·축소를 확인한다.
