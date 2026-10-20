# DB 캔버스와 Properties 패널 분리

## 목적과 수용 기준

- 다이어그램 화면과 같이 캔버스에는 테이블과 관계선이 항상 표시된다.
- 우측 RI 화살표 버튼은 별도 Properties 패널만 열고 닫는다.
- 패널은 캔버스 위 우측 300px 오버레이이며, 열고 닫아도 캔버스 및 왼쪽 에디터 크기가 변하지 않는다.
- 테이블 선택, 이동, 격자 전환, 확대가 정상 동작한다.

## 원인과 변경

- 이전 구현은 테이블/관계선을 담은 db-erd-view 자체를 숨겨진 우측 패널로 사용했다.
- 기본 canvas에 그린 테이블 복제는 관계선, 이동 상태와 분리되어 있었다. 해당 복제 렌더링을 제거했다.
- db-erd-view와 erd-canvas는 전체 작업영역을 차지하는 상시 표시 레이어로 복원했다.
- 기존 HTML 테이블과 SVG 관계선 렌더링을 그대로 사용한다. 실제 canvas 요소는 격자 배경을 그린다.
- 별도 db-properties-panel을 추가했다. 버튼 aria-controls와 토글 상태를 해당 패널에 연결했다.
- 선택한 테이블명, 컬럼, 타입, PK/FK, NULL 여부 및 코멘트를 속성에 표시한다.
- 빈 localStorage 너비가 Number(null)로 0이 되어 에디터 폭이 없어지는 문제도 수정했다.
- CSS/JS 캐시 버전을 함께 갱신했다.

## 변경 파일

- templates/db-modeling.html: 캔버스와 우측 패널을 형제 요소로 분리
- static/js/db-modeling.js: 패널 토글, 선택 속성 표시, 복제 그림 제거, 에디터 너비 기본값 보정
- static/css/app.css: 캔버스 전체 크기와 별도 오버레이 레이아웃
- templates/fragments/layout.html: 정적 리소스 버전
- src/test/js/db-modeling-layout.cjs: 브라우저 회귀 검증

## 검증

- node --check src/main/resources/static/js/db-modeling.js: 통과
- git diff --check: 통과
- 설치된 Playwright Chromium으로 실제 템플릿/CSS/JS 및 로컬 Monaco를 로드한 브라우저 테스트: 통과
  - 최초 테이블 2개와 관계선 표시
  - 왼쪽 Monaco와 유효한 에디터 폭 확인
  - 선택 테이블의 Properties 내용 표시
  - 패널 열기/닫기 전후 캔버스와 테이블 좌표/크기 동일
  - 패널 개방 전후 에디터 크기 동일
  - 테이블 드래그 70px/50px 반영
  - 격자 토글과 확대 110% 반영
  - 1024px 화면으로 변경 후 패널 토글에도 캔버스 크기 유지
  - JavaScript 런타임 오류 없음
- 테스트는 API 응답을 고정 데이터로 대체한다. 실행 중인 Spring 서버와 실제 저장 DB 통합은 이번 UI 검증에 포함하지 않았다.
- 명령: PLAYWRIGHT_MODULE 환경변수를 설치된 playwright-core 경로로 지정 후 node src/test/js/db-modeling-layout.cjs

## 다음 작업

- 서버 환경에서는 기존 스키마 데이터와 저장 API를 연결한 동일 UI 동작을 확인할 수 있다.
- 앞선 erd-overlay 이력의 '캔버스 전체를 패널로 토글' 및 '테이블 bitmap 복제' 결정은 이 변경으로 대체한다.
