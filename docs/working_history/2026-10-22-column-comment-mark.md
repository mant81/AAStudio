# 컬럼 코멘트 아이콘

## 목적
- 코멘트가 있는 컬럼의 변수명 뒤에 작은 아이콘을 표시한다.

## 변경 파일
- `db-modeling.js`: 코멘트가 있는 컬럼에만 아이콘 렌더링.
- `app.css`: 아이콘 크기와 색상 지정.
- `fragments/layout.html`: CSS/JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 아이콘 위치를 확인한다.
