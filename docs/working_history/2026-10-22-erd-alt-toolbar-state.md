# ERD Alt 툴바 상태

## 목적
- Alt를 누르는 동안 Move를 활성화하고 키를 놓으면 Pointer로 돌아간다.

## 변경 파일
- `db-modeling.js`: Alt 키 입력과 툴 상태 연결, 창 포커스 이탈 시 Pointer 복귀.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 Alt 누름·해제 시 툴바 강조와 드래그 동작을 확인한다.
