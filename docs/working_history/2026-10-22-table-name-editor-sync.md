# 테이블 이름 변경 시 편집기 동기화

## 목적
- 설정 레이어에서 테이블명을 바꾸면 왼쪽 편집기에도 바로 반영한다.

## 분석 및 수용 기준
- 기존 경로는 숨겨진 textarea 값만 갱신해 Monaco 화면의 이전 이름이 남았다.
- 이름 변경 후 textarea와 Monaco 내용이 일치해야 한다.

## 변경 파일
- `db-modeling.js`: 이름 변경 경로에서 공통 `setEditorText` 호출.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 이름 변경 후 왼쪽 편집기 표시와 새로고침 뒤 유지 여부를 확인한다.
