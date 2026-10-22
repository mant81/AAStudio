# 프로젝트 공통 메뉴 상단 이동

## 목적
- DB 모델링 등 전용 왼쪽 패널을 사용하는 화면에서 공통 사이드바가 추가로 차지하던 가로 공간을 확보한다.
- 프로젝트 아래 대시보드·다이어그램·DB 모델링·API 명세를 제공하는 정보 구조를 유지한다.

## 분석 및 수용 기준
- 기존 공통 사이드바는 접힘 80px, 펼침 220px을 차지하고 DB 코드 에디터도 기본 384px을 사용했다.
- 공통 프로젝트 선택·생성 및 설정을 상단 첫 줄, 프로젝트 메뉴를 둘째 줄에 제공한다.
- WIKI 접근과 다이어그램 탭을 통한 Spaces 패널 열기 동작을 보존한다.
- 본문은 왼쪽 여백 없이 전체 가로 폭을 사용하고 편집 화면은 상단 메뉴 100px을 제외한 화면 높이를 사용한다.
- 현재 메뉴 표시, 프로젝트 전환 쿠키, 생성·취소, 키보드 탐색, 좁은 화면의 메뉴 접근을 검증한다.
- 사용자가 승인한 상단 메뉴 개선을 우선 적용한다. README의 기존 원본 좌측 메뉴 유지 지침과의 차이는 이번 요청에 따른 변경이다.

## 변경 파일
- `src/main/resources/templates/fragments/navigation.html`
  - 프로젝트 선택·생성, 설정, 프로젝트 메뉴 탭을 제공하는 공통 fragment를 추가한다.
  - 현재 페이지에 `aria-current`를 표시하고 기존 프로젝트 선택용 data attribute를 유지한다.
- `src/main/resources/templates/fragments/sidebar.html`
  - 공통 상단 메뉴로 대체하여 제거한다.
- `src/main/resources/templates/fragments/layout.html`
  - 상단 fragment를 연결하고 기존 사이드바 너비·본문 왼쪽 여백을 제거한다. 변경 리소스의 캐시 버전을 갱신한다.
- `src/main/resources/static/js/app.js`
  - 공통 사이드바 접기 로직을 제거한다.
  - 프로젝트 목록의 방향키·Home·End·Escape 및 선택 상태를 지원한다.
  - 프로젝트 생성 취소·실패 시 원래 프로젝트 표시를 복구한다.
- `src/main/resources/static/css/app.css`, `src/main/resources/static/css/diagram.css`
  - 상단 메뉴, 좁은 화면의 가로 스크롤, 남은 화면 높이를 사용하는 작업 영역 스타일을 적용한다.
- `src/main/resources/templates/{db-modeling,diagram,api,wiki}.html`
  - 전용 패널을 보존하면서 작업 영역 높이를 조정한다. 다이어그램 공유 메뉴를 버튼 아래에 배치한다.
- `src/test/js/app-navigation.cjs`
  - 실제 Spring Boot 응답을 대상으로 공통 메뉴 및 프로젝트 동작을 브라우저에서 검증한다.
- `src/test/js/db-modeling-layout.cjs`
  - 변경된 루트 클래스를 반영하고 실제 서버에서도 기존 회귀 검증을 실행할 수 있게 한다.
- `docs/prd.md`, `README.md`
  - 상단 공통 메뉴와 기능별 전용 패널 구조를 반영한다.

## 검증
- Java 25: `D:/sw/java/jdk-25.0.2`를 사용했다. 기본 PATH의 Java 21 대신 해당 경로로 `JAVA_HOME`을 지정했다.
- `gradlew.bat test build --console=plain`: 최종 변경 기준 통과. Java 테스트 소스는 없어 `test NO-SOURCE`로 완료했다.
- `node --check`로 `app.js`, `db-modeling.js`, `diagram.js` 및 두 브라우저 검증 스크립트 검사: 통과.
- `git diff --check`: 통과.
- 격리된 H2 메모리 DB와 포트 18080으로 QA 서버를 실행했다. 기존 파일 DB는 사용하지 않았다.
- `AASTUDIO_BASE_URL=http://localhost:18080` 및 설치된 Playwright 모듈로 실행:
  - `node src/test/js/app-navigation.cjs`: 통과.
  - 6개 URL의 실제 Thymeleaf 렌더링, 현재 메뉴 표시, 본문 전체 폭, 편집 영역 하단 정렬을 확인했다.
  - QA 메모리 DB에 두 번째 프로젝트를 추가해 드롭다운 전환·쿠키, 생성 취소 시 선택 복구를 확인했다.
  - 생성 POST는 브라우저에서 응답을 대체하여 요청 내용·새로고침을 검증했다.
  - 키보드로 선택한 프로젝트에 진입·Escape 복귀, 375px 화면에서 탭 가로 탐색·프로젝트 메뉴 영역을 확인했다.
  - 최초 실행에서 `data-project-menu` 누락으로 프로젝트 옵션 연결 실패를 발견했다. 속성을 복원한 후 최종 검증은 통과했다.
  - `node src/test/js/db-modeling-layout.cjs`: 통과. 테이블·관계 표시, 속성 오버레이, 드래그, 격자, 확대, 창 크기 변경과 JavaScript 오류 없음을 확인했다.
- 1440px DB 화면 및 375px 공통 메뉴 스크린샷을 확인했다. 캡처는 Git 제외 경로인 `target/navigation-desktop.png`, `target/navigation-mobile.png`에 보관했다.
- 기존 사용자 변경인 `.project`, `.settings/org.eclipse.jdt.core.prefs`는 수정하지 않았다.

## 미해결 이슈와 다음 작업
- 이번 변경 범위의 미해결 이슈 없음.
- 배포 또는 실행 중인 애플리케이션에 적용하려면 갱신된 빌드로 재시작한다.
