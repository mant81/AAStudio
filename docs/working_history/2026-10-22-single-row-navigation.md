# 공통 상단 메뉴 한 줄로 축소

## 목적
- 두 줄 공통 메뉴가 차지하는 세로 공간을 줄인다.
- 사용자 최종 요청대로 로고 다음에 프로젝트 선택을 먼저 표시하고 메뉴와 설정을 뒤에 배치한다.

## 분석 및 수용 기준
- 기존 상단은 프로젝트 선택 56px, 메뉴 탭 44px으로 총 100px이었다.
- 로고 → 프로젝트 선택 → 대시보드·다이어그램·DB 모델링·API 명세·WIKI → 설정 순서로 한 줄에 표시한다.
- 상단 높이를 56px로 줄이고 남은 44px을 편집 영역에 돌려준다.
- 프로젝트 생성·전환 및 현재 메뉴 강조를 유지한다.
- 좁은 화면에서도 상단은 한 줄을 유지하고 메뉴는 접근성 이름이 있는 아이콘과 가로 스크롤로 탐색한다.

## 변경 파일
- `src/main/resources/templates/fragments/navigation.html`: 프로젝트 선택 뒤에 공통 메뉴를 배치하고 메뉴별 접근성 이름과 툴팁을 추가했다.
- `src/main/resources/static/css/app.css`: 상단 높이와 탭 색상·간격, 화면 너비별 프로젝트 선택 폭을 조정했다. 프로젝트 목록은 이름을 읽을 수 있도록 최소 폭 240px을 유지한다.
- `src/main/resources/templates/fragments/layout.html`: CSS 캐시 버전을 갱신했다.
- `src/test/js/app-navigation.cjs`: 기존 검증에 상단 높이 56px, 프로젝트가 메뉴 앞에 있는지, 같은 줄에 배치되는지 확인을 추가했다.
- `docs/prd.md`: 프로젝트 선택을 먼저 표시하는 한 줄 상단 구조를 반영했다.

## 검증
- Java 25 환경에서 `gradlew.bat test build --console=plain`: 통과. Java 테스트는 소스가 없어 `NO-SOURCE`로 완료했다.
- 격리된 H2 메모리 DB 및 포트 18080의 실제 Spring Boot 서버에서 Playwright 검증:
  - `node src/test/js/app-navigation.cjs`: 통과. 6개 화면 렌더링, 프로젝트 우선 순서와 한 줄 배치, 본문 크기, 프로젝트 선택·생성·취소, 키보드, 375px 메뉴 접근 확인.
  - `node src/test/js/db-modeling-layout.cjs`: 통과. 테이블·관계 표시, 속성 패널, 드래그·격자·확대 및 크기 변경 확인.
  - 두 검증 모두 JavaScript 실행 오류 없음.
- `node --check src/test/js/app-navigation.cjs`, `git diff --check`: 통과.
- `target/navigation-single-row.png`, `target/navigation-single-row-mobile.png`에 캡처했다. 데스크톱 캡처에서 실제 배치와 확보한 세로 공간을 확인했다.
- 기존 파일 DB 및 사용자의 IDE 설정 변경은 보존했다.

## 미해결 이슈와 다음 작업
- 이번 변경 범위의 미해결 이슈 없음.
- 실행 중인 애플리케이션은 갱신한 빌드로 재시작하면 반영된다.
