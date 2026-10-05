# Diagram selector order

## 변경 내용

- 다이어그램 선택 시 `diagram-current-name`이 선택한 다이어그램명으로 즉시 갱신되도록 확인·보완
- 각 다이어그램에 등록 순번을 부여
- 선택 목록을 등록 순번 오름차순으로 정렬
- 새 다이어그램은 생성 시점의 마지막 등록 순번을 사용

## 검증

- `node --check src/main/resources/static/js/diagram.js` 통과
- `git diff --check` 통과
