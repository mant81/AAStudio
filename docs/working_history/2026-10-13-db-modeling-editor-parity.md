# DB 모델링 에디터 편집 경험 보강

## 목적

- DB 모델링 화면의 코드 에디터를 dbdiagram.io와 유사한 코드 패널 경험으로 보강한다.

## 분석 및 수용 기준

- 기존 DBML/DDL 입력, 자동 분석, ERD 생성, 서버 저장 흐름을 유지한다.
- 편집 패널에서 파일명·언어 표시, 줄 번호, 현재 줄, 커서 위치를 확인할 수 있어야 한다.
- Tab 들여쓰기와 키보드 단축키로 ERD 생성·저장이 가능해야 한다.
- 기존 사용자 변경과 사이드바/ERD 전환을 보존한다.

## 변경 파일

- `src/main/resources/templates/db-modeling.html`
  - `schema.dbml` 파일 탭에 DBML 배지와 ERD 생성 접근성 이름을 추가했다.
  - 상태 표시줄에 현재 커서 위치를 추가했다.
- `src/main/resources/static/js/db-modeling.js`
  - 현재 줄 강조, 줄 번호 동기화, Ln/Col 표시를 추가했다.
  - Tab을 두 칸 들여쓰기로 처리하고 Ctrl/Cmd+Enter·Ctrl/Cmd+S 단축키를 연결했다.
- `src/main/resources/static/css/app.css`
  - 에디터 기본 폭을 24rem으로 조정하고 현재 줄 표시 스타일을 추가했다.

## 검증

- `node --check src/main/resources/static/js/db-modeling.js`: 통과
- `git diff --check`: 통과
- `gradlew.bat test`: 실행 불가
  - 현재 환경은 Java 21만 감지하며 프로젝트가 요구하는 Java 25 툴체인을 찾지 못했다.

## 다음 작업 및 오픈 이슈

- Java 25가 설치된 환경에서 `gradlew.bat test`를 재실행한다.
- 브라우저에서 DBML 입력, Tab, 단축키, 줄 번호 스크롤, ERD 전환을 수동 확인한다.

## 추가 개선

- 코드 입력 레이어 뒤에 DBML 구문 하이라이트 레이어를 추가했다.
- 주석, DBML 키워드, 자료형, 대괄호 속성, 문자열을 서로 다른 색으로 표시한다.
- 줄 번호와 코드 스크롤을 동기화하고, 초기 예시·저장된 문서에도 하이라이트를 적용한다.
- 커서가 위치한 식별자와 동일한 토큰을 에디터 전체에서 블록 강조한다.

## 캔버스 다이어그램 개선

- 테이블 카드 헤더와 컬럼 행의 가독성을 높이고 PK/FK/필수 컬럼 역할을 표시한다.
- 테이블별 관계 수와 관계선 양 끝 연결점을 표시한다.
- 관계선에 `테이블.컬럼 → 테이블.컬럼` 설명을 추가했다.
- 테이블 선택 상태와 테이블이 없는 캔버스 안내 상태를 추가했다.
- 상단 캔버스 도구의 이동, 선택, 격자 전환, 확대/축소 동작을 연결했다.
- DBML `Note table { ... }`, `Note table.column { ... }` 및 컬럼 속성 `note:`를 파싱하고 ERD 코멘트 아이콘/툴팁으로 표시한다.
- `varchar(255)`, `char(36)`, `decimal(10,2)`, `timestamp(3)`, `character varying(255)` 타입의 사이즈/정밀도를 보존하고 ERD에서 구분 표시한다.
