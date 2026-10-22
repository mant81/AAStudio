# 문서 작업 바 위계 정리

## 목적
- 공통 메뉴 아래에서 문서 선택·저장 상태·작업 버튼이 모두 비슷한 강도로 나열되던 어색함을 줄인다.
- 상단 프로젝트 메뉴는 유지하고 다이어그램·DB의 하위 영역을 현재 문서의 작업 바로 구분한다.

## 분석 및 수용 기준
- 왼쪽은 문서 선택·추가·관리·저장 상태, 오른쪽은 샘플·내보내기·공유로 구성한다.
- 반복되는 버튼 박스·테두리와 저장 배지 배경을 줄이고, 작업 바는 옅은 배경을 사용한다.
- 다이어그램 관리 아이콘은 전역 설정과 구분되는 더보기로 바꾸고 문서 이름 옆에 배치한다.
- JPG·PNG·PDF는 내보내기 드롭다운으로 묶는다. 기존 다운로드 동작을 유지하고 선택·Escape·외부 클릭으로 목록을 닫을 수 있어야 한다.
- 기존 상단 56px·문서 작업 바 48px 및 전체 폭 사용을 유지한다.

## 변경 파일
- `src/main/resources/templates/diagram.html`: 문서 관리 메뉴 위치 이동, 파일 형식 드롭다운 구성, 공유 버튼 분리, 중복 장식 라벨 제거.
- `src/main/resources/static/css/workspace-navigation.css`: 문서 제목과 상태 위계, 평평한 작업 버튼, 내보내기 목록과 공유 강조, 모바일 표시 정리. 앞선 스타일에서 잘못 중첩된 WIKI sidebar selector도 바로잡았다.
- `src/main/resources/static/js/app.js`: 내보내기 선택·Escape·외부 클릭 시 닫기. 다른 메뉴의 이벤트 전파 중단과 충돌하지 않도록 외부 클릭은 capture 단계에서 처리한다.
- `src/main/resources/templates/fragments/layout.html`: CSS·JavaScript 캐시 버전 갱신.
- `docs/prd.md`: 문서 작업 바의 역할별 배치와 내보내기 메뉴 기준 반영.

## 검증
- Java 25의 `gradlew.bat test build --console=plain`: 통과. Java 테스트 소스는 없어 `test NO-SOURCE`로 완료.
- `node --check src/main/resources/static/js/app.js`, `git diff --check`: 통과.
- 격리된 H2 메모리 DB·포트 18080에서 실제 서버 응답을 사용한 Playwright 점검:
  - `src/test/js/app-navigation.cjs`, `src/test/js/db-modeling-layout.cjs`: 통과.
  - 파일 형식 3개가 기본적으로 숨겨지고 내보내기 클릭으로 표시되는지 확인.
  - PNG 선택 시 실제 `다이어그램 1.png` 다운로드 발생 및 목록 닫힘 확인.
  - Escape·외부 클릭 닫기, 문서 옆 관리 메뉴와 공유 URL 표시 확인. 공유 API는 QA 응답으로 대체.
  - 1024px·375px에서 문서 영역과 작업 버튼이 겹치지 않고 내보내기 목록이 화면 안에 표시되는지 확인.
  - 모바일 파일 형식 텍스트 표시 확인. 최초 추가 점검의 display 값 비교는 flex 자식의 blockification을 고려하지 못한 검사여서 실제 가시성 확인으로 교정했다.
  - JavaScript 실행 오류 없음.
- 최초 외부 클릭 닫기 점검에서 문서 선택 버튼의 전파 중단과 충돌을 발견해 capture 방식으로 수정 후 통과했다.
- `target/contextbar-diagram.png`, `target/contextbar-db.png`, `target/contextbar-mobile.png`에 화면 캡처를 남겼다. 데스크톱 다이어그램 화면을 직접 확인했다.
- 기존 파일 DB와 사용자 IDE 설정 변경은 보존했다.

## 미해결 이슈와 다음 작업
- 이번 범위의 미해결 이슈 없음.
- 실행 중인 앱은 갱신된 빌드로 재시작하면 반영된다.
