# 내부 메뉴와 도구 모음 디자인 통일

## 목적
- 한 줄 상단 메뉴와 실제 작업 화면 내부 메뉴가 어울리도록 스타일을 맞춘다.
- 이전 요청의 공간 절약 방향을 유지하면서 드롭다운, 탐색 목록, 설정 탭의 선택 상태를 명확히 표시한다.

## 분석 및 수용 기준
- 다이어그램과 DB의 문서 도구 모음은 48px, 일반 버튼은 32px, 모서리는 6px 기준으로 맞춘다.
- 내부 메뉴는 밝은 회청색 배경·얇은 테두리·파란 선택 강조를 공통으로 사용한다.
- 다이어그램·스키마 선택과 관리 드롭다운은 코드 에디터보다 위에 보여야 한다.
- API·WIKI 탐색 영역과 설정 탭에도 동일한 선택·포커스 스타일을 적용한다.
- 기존 데이터 흐름, 캔버스 편집, 프로젝트 우선 메뉴 순서는 유지한다.

## 변경 파일
- `src/main/resources/static/css/workspace-navigation.css`
  - 내부 메뉴 전용 스타일을 분리하고 도구 모음·버튼·드롭다운·탐색 영역·설정 탭의 기준을 통일했다.
  - 기존 CSS와 Tailwind 런타임 스타일보다 명확한 범위와 우선순위로 배치·높이를 적용했다.
- `src/main/resources/templates/{diagram,db-modeling,api,wiki}.html`
  - 전용 스타일 hook을 추가했다. DB의 장식용 사용자 아바타와 남는 구분선을 제거하고 액션 표시를 정리했다.
  - 다이어그램 샘플 버튼의 표시를 간결하게 정리했다.
- `src/main/resources/templates/fragments/layout.html`
  - 공통 내부 메뉴 CSS를 연결하고 변경한 JavaScript 캐시 버전을 갱신했다.
- `src/main/resources/static/js/app.js`
  - 설정 탭의 초기 선택·전환 상태와 `aria-pressed`를 실제 표시 패널에 맞춰 동기화했다.
- `src/main/resources/static/js/diagram.js`
  - 다이어그램 선택 목록의 현재 항목에 `aria-current`를 표시했다.
- `docs/prd.md`
  - 내부 메뉴의 공통 UI 기준을 기록했다.

## 검증
- `node --check src/main/resources/static/js/app.js`, `node --check src/main/resources/static/js/diagram.js`: 통과.
- `git diff --check`: 통과.
- Java 25로 `gradlew.bat test build --console=plain` 실행: 통과. Java 테스트 소스는 없어 `test NO-SOURCE`로 완료했다.
- 포트 18080의 격리된 H2 메모리 DB 서버에서 Playwright로 확인:
  - `src/test/js/app-navigation.cjs`: 6개 화면 렌더링·프로젝트 선택·생성·취소·모바일 탐색·전체 폭과 높이 검증 통과.
  - `src/test/js/db-modeling-layout.cjs`: 테이블·관계·속성 패널·드래그·격자·확대·창 크기 변경 검증 통과.
  - 추가 브라우저 점검: 두 문서 도구 모음의 높이 48px, 드롭다운의 실제 hit test, 1024px 화면에서 액션 정렬, 설정 탭 3개 전환·선택 강조·표시 패널 일치 확인 통과.
  - JavaScript 실행 오류 없음.
- 최초 추가 점검에서 기존 `.workspace-actions`의 세로 방향 규칙 및 Tailwind의 높이·여백 우선순위 충돌을 발견해 수정했다.
- Spaces 패널 표시 점검은 기존 `diagram.css`가 헤더 선택 목록을 사용하도록 의도적으로 숨기는 구조임을 확인했다. 기존 동작은 보존하고 헤더 드롭다운을 검증했다.
- `target/submenu-{diagram,db-modeling,api,wiki,settings}.png`에 캡처했다. 다이어그램·DB·API 캡처를 직접 확인했다.
- 기존 파일 DB와 사용자의 IDE 설정 변경은 보존했다.

## 미해결 이슈와 다음 작업
- 이번 변경 범위의 미해결 이슈 없음.
- 실행 중인 앱은 갱신된 빌드로 재시작하면 반영된다.
