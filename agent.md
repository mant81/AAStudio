# Agent Notes

- 프로젝트 스타일의 밝은 카드 기반 UI를 유지한다.
- 프로젝트 선택 시 해당 프로젝트는 목록 최상단에 오도록 `currentProjectId`를 사용한다.
- 프로젝트 상세 화면은 메뉴별로 파일을 분리한다.
- 다이어그램, DB 모델링, API 정의, Wiki는 각각 별도 HTML fragment와 별도 JS 파일로 관리한다.
- 공통 상태와 프로젝트 리스트 로직은 `src/main/resources/static/js/main.js`에 유지한다.
- 섹션별 동작은 `src/main/resources/static/js/sections/` 아래의 전용 스크립트에서 처리한다.
- 실제로는 메뉴별 JS를 `src/main/resources/static/js/diagram-editor.js`, `src/main/resources/static/js/database-editor.js`, `src/main/resources/static/js/api-editor.js`, `src/main/resources/static/js/wiki-editor.js`로 분리해 유지한다.
- 상세 화면 마크업은 `src/main/resources/templates/fragments/` 아래의 fragment 파일로 분리한다.
