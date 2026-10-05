# Current diagram picker

## 목적

캔버스의 별도 Spaces 열기 버튼과 Spaces UI를 제거하고, 문서 헤더에서 현재 다이어그램을 확인·선택할 수 있도록 한다.

## 변경 내용

- `Draft` 상태 배지는 유지하고 옆에 현재 다이어그램 배지를 추가
- 다이어그램 배지 메뉴에서 기존 다이어그램을 선택
- Spaces 패널은 화면에서 제거하고 헤더 선택기로 통합
- 중복되는 `diagram-spaces-open` 캔버스 버튼 및 관련 dead code 제거

## 검증

- `node --check src/main/resources/static/js/diagram.js` 통과
- `git diff --check` 통과

## 미해결 이슈

- 없음
