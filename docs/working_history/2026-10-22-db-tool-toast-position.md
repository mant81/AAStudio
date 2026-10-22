# DB 모델링 토스트 위치 조정

## 목적
- DB 모델링의 도구 전환 토스트가 하단 툴바와 겹치지 않게 한다.

## 변경 파일
- `db-modeling.js`: 토스트를 ERD 캔버스 안에 배치.
- `app.css`: DB 모델링 토스트를 하단 툴바 위에 표시.
- `fragments/layout.html`: CSS/JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 툴바와 토스트 간격을 확인한다.
