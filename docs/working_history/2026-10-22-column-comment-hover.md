# 컬럼 코멘트 마우스 오버 표시

## 목적
- 코멘트가 있는 컬럼에 마우스를 올리면 컬럼명·타입·코멘트 카드가 테이블 오른쪽에 보이게 한다.

## 분석 및 수용 기준
- 기존 코멘트 카드는 테이블의 `overflow-hidden`에 잘렸다.
- 카드가 테이블 밖에 표시되고, 다른 테이블에 가려지지 않아야 한다.

## 변경 파일
- `db-modeling.js`: 테이블의 넘침 숨김 클래스 제거.
- `app.css`: 마우스 오버 테이블의 쌓임 순서와 헤더 모서리 처리.
- `fragments/layout.html`: CSS/JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 코멘트 카드 위치를 확인한다.
