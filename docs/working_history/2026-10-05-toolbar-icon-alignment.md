# Diagram toolbar icon alignment

## 목적

`diagram-main-toolbar`의 버튼 높이와 아이콘 정렬을 통일하고, 폰트 아이콘 의존으로 표시가 불안정한 주요 도구 아이콘을 inline SVG로 교체한다.

## 변경 파일

- `src/main/resources/templates/diagram.html`
  - 이동, 선택, 연결선, 텍스트, 펜, 지우개, 이미지 도구 아이콘을 SVG로 변경
- 펜·지우개 SVG를 단순한 외곽선 형태로 개선
- 선택 도구 아이콘을 포인터 커서 형태로 변경
- 라인 도구는 기존 `conversion_path` Material Symbols 아이콘이 더 직관적이므로 원복
- 메인 툴바와 공간 열기 버튼의 hover 안내 문구를 한글로 통일
- `src/main/resources/static/css/diagram.css`
  - 툴바 도구 버튼을 36×36px flex 정렬로 통일
  - SVG 아이콘을 20×20px로 고정
  - 구분선의 높이와 간격 고정

## 검증

- `node --check src/main/resources/static/js/diagram.js` 통과
- `git diff --check` 통과

## 미해결 이슈

- 없음
