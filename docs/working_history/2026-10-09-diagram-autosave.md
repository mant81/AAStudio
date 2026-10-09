# 다이어그램 DB 자동 저장

## 목적

공동 편집 없이 현재 다이어그램 변경 내용을 DB에 자동 저장한다.

## 변경 내용

- `diagram_document` 테이블에 다이어그램 JSON 상태, 버전, 수정 시각을 저장한다.
- 다이어그램 상태 조회·저장을 위한 REST API와 MyBatis Mapper를 추가했다.
- 화면 변경을 MutationObserver로 감지하고 700ms debounce 후 저장한다.
- 저장 상태를 `변경됨`, `저장 중…`, `저장됨`, `저장 실패`로 표시한다.
- 저장된 상태가 있으면 `/diagram` 진입 시 복원한다.

## 검증

- `node --check src/main/resources/static/js/diagram.js` 통과
- `git diff --check` 통과
- `mvn test`는 Maven이 설치되어 있지 않아 실행하지 못했다.

## 미해결 이슈 / 다음 작업

- 현재 기본 다이어그램 1개를 기준으로 저장한다. 여러 다이어그램 목록을 DB와 완전히 동기화하려면 다이어그램 목록 CRUD가 필요하다.
- 현재 상태 저장은 단일 사용자 기준이며 공동 편집 동기화는 지원하지 않는다.
