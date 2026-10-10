# 프로젝트 셀렉트 UI 개선

## 목적
- 사이드바 프로젝트 선택 UI의 가독성과 축소 상태 표시를 개선한다.

## 분석 및 적용 기준
- 기존 `select`는 투명 배경과 하단 화살표가 겹쳐 보이고, 선택값과 라벨의 계층이 약했다.
- 프로젝트 변경 및 새 프로젝트 생성 이벤트는 기존 `data-project-select` selector를 유지한다.

## 변경 파일
- `src/main/resources/templates/fragments/sidebar.html`
  - 프로젝트 선택 영역을 전용 카드/컨트롤 구조로 정리
  - 명시적 라벨, 포커스 접근성, 커스텀 화살표 추가
  - 네이티브 팝업 대신 스타일 가능한 listbox 메뉴 추가
- 현재 프로젝트명을 서버 모델에서 직접 렌더링하고 current project ID로 초기 선택값을 보정
- 화면 노출 한글은 UTF-8/HTML entity 경로를 확인해 깨짐 방지
- 초기 `Alpha` 프로젝트 데이터와 서버 fallback 제거
- 프로젝트가 없으면 빈 상태를 표시하고 프로젝트 추가 모달을 자동으로 연다
- `src/main/resources/static/css/app.css`
  - hover/focus, 긴 프로젝트명 말줄임, 옵션 대비, 축소 사이드바 아이콘 정렬 스타일 추가
  - 메뉴 패널, 선택 항목, 생성 항목, 외부 클릭 닫기 상태 스타일 추가
- `src/main/resources/static/js/app.js`
  - 커스텀 메뉴를 기존 숨김 select 및 프로젝트 변경 이벤트와 연결
  - 프로젝트 추가를 공통 이름 입력 모달로 변경
- `src/main/resources/templates/fragments/layout.html`
  - 프로젝트 추가 공통 모달 추가
- `src/main/resources/templates/diagram.html`
  - 다이어그램 이름 모달에 공통 모달 스타일 클래스 적용

## 검증
- `node --check src/main/resources/static/js/app.js`: 통과
- `git diff --check`: 통과
- `mvn test -q`: 실행 불가. 현재 환경에 `mvn` 명령이 설치되어 있지 않음

## 오픈 이슈 및 다음 작업
- 브라우저에서 펼침/축소 상태와 실제 네이티브 옵션 목록의 시각 검증이 필요하다.
