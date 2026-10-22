# DB 모델링 내보내기 형식 개선

## 목적
- 사용자가 제공한 메뉴 예시에 맞춰 이미지·문서와 DB별 SQL 내보내기를 제공한다.
- 후속 요청대로 기존 내보내기 2개 항목(스키마 코드·모델 JSON)은 제거한다. JSON 백업·복원은 스키마 관리에서 유지한다.

## 분석 및 수용 기준
- 내보내기 메뉴는 이미지·문서(PDF, PNG, SVG)와 SQL 스크립트(PostgreSQL, MySQL/MariaDB, SQL Server, Oracle)로 구분한다.
- 각 항목은 현재 편집 내용을 실제 파일로 다운로드한다. 메뉴는 기존 상단 도구 모음과 같은 디자인을 사용한다.
- 이미지는 화면 밖 테이블과 현재 배치를 포함한다. SQL은 모델링의 타입·기본키·복합 외래키·NULL 허용·UNIQUE·기본값·자동 증가 속성을 반영한다.
- 변환할 수 없는 추가 정의는 오류로 안내한다. 기존 편집·관리·내비게이션 기능을 보존한다.

## 변경 파일
- `src/main/resources/templates/db-modeling.html`: 기존 두 항목을 7개 형식으로 교체하고 메뉴 그룹·아이콘·확장자를 표시했다.
- `src/main/resources/static/css/workspace-navigation.css`: 내보내기 메뉴 너비·구분 제목·확장자·작은 화면 스크롤을 적용했다.
- `src/main/resources/static/js/db-modeling-export.js`: DB별 SQL 생성, 전체 배치의 벡터 SVG 생성, PNG·PDF 다운로드를 구현했다.
- `src/main/resources/static/js/db-modeling.js`: 메뉴와 실제 다운로드를 연결하고 진행 상태·오류 안내를 추가했다. 파싱 시 기본값·UNIQUE·자동 증가·복합 키를 보존하고 따옴표 안의 주석 기호를 유지한다.
- `src/main/resources/templates/fragments/layout.html`: 내보내기 모듈 로드 순서와 리소스 버전을 반영했다.
- `src/test/js/db-modeling-export.cjs`: SQL 타입·속성·이스케이프·복합 키·지원 불가 정의와 SVG 경계 테스트 8개를 추가했다.
- `src/test/js/db-modeling-export-browser.cjs`: 실제 다운로드 파일, 파서 연결, 오류 안내, 모바일 메뉴를 검증한다.
- `src/test/js/db-modeling-toolbar.cjs`: 기존 두 항목을 제거한 새 메뉴 기준으로 검증을 갱신했다.
- `docs/prd.md`: 내보내기 요구사항을 갱신했다.

## 검증
- `node --test src/test/js/db-modeling-export.cjs`: 8개 통과.
- `node --check src/main/resources/static/js/db-modeling.js`, `node --check src/main/resources/static/js/db-modeling-export.js`: 통과.
- Java 25의 `gradlew.bat test build --console=plain`: 성공. 기존 Java 통합 테스트 3개 통과.
- 별도 포트 18080·H2 메모리 DB에서 Playwright 검증을 실행했다. 재빌드가 실행 중인 JAR를 변경하지 않도록 `target/export-qa.jar` 복사본을 사용했다.
  - `db-modeling-export-browser.cjs`: 7종 실제 다운로드, 기존 메뉴 제거, DB별 SQL 내용, 따옴표 안의 URL·기본값 보존, 복합 DDL 키, 지원 불가 타입 안내 통과.
  - SVG XML 유효성·화면 밖 좌표 포함, PNG 시그니처·크기, PDF 시그니처·페이지·이미지·xref 오프셋 검증 통과.
  - `db-modeling-toolbar.cjs`, `db-modeling-layout.cjs`, `db-modeling-management.cjs`, `app-navigation.cjs`: 전체 통과. JavaScript 실행 오류 없음.
- `target/db-export-menu.png`를 직접 확인했다. 프로젝트가 앞에 있는 상단 메뉴와 두 그룹의 내보내기 메뉴가 정상 표시된다.
- `git diff --check`: 통과. 기존 사용자 IDE 설정 변경은 보존했다.

## 결정 사항과 제한
- SVG는 벡터이며 PNG는 긴 변 최대 4096px이다. PDF는 전체 ERD를 A4 한 페이지에 맞춘 이미지 방식이다. 큰 모델의 여러 페이지 인쇄는 이번 범위에 포함하지 않는다.
- SQL은 현재 모델링에서 지원하는 속성을 변환한다. 일반 DDL 전체를 변환하는 마이그레이션 도구는 아니다. 인덱스·CHECK·ENUM·외래키 삭제/갱신 동작·사용자 정의 타입 등 지원하지 않는 추가 정의는 안내 후 중단한다.
- 4개 대상 DB 엔진은 제공되지 않아 생성 SQL의 실제 실행은 검증하지 않았다. 브라우저 다운로드와 SQL 문자열 검증을 수행했으며, 엔진별 실행 검증은 후속 확장 시 필요하다.
- 타입·기본값 문법 참고: [PostgreSQL](https://www.postgresql.org/docs/17/datatype-numeric.html), [MySQL 타입](https://dev.mysql.com/doc/refman/8.4/en/data-types.html), [MySQL 기본값](https://dev.mysql.com/doc/refman/8.2/en/data-type-defaults.html), [SQL Server CREATE TABLE](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql?view=sql-server-ver17), [Oracle 타입](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html).

## 미해결 이슈와 다음 작업
- 요청한 메뉴 구성과 7종 다운로드 구현 완료.
- 지원 속성 확대 시 대상 DB에서 실행 검증을 추가한다. 실행 중인 앱에는 갱신 빌드 적용이 필요하다.
