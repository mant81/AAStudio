# Diagram add modal

## 목적

`Draft +` 액션으로 현재 다이어그램 그룹에 새 다이어그램을 추가한다.

## 변경 내용

- `Draft` 상태 배지에 `+` 버튼 액션 추가
- 다이어그램 이름을 입력하는 공통 모달 추가
- 현재 선택된 다이어그램의 그룹에 새 항목 생성
- 이름을 비워 두면 자동 이름 사용
- 추가 후 새 다이어그램을 현재 선택 상태로 갱신

## 검증

- `node --check src/main/resources/static/js/diagram.js` 통과
- `git diff --check` 통과

## 미해결 이슈

- 없음
