# 프로젝트 컨텍스트 및 고정 주소

## 목적

- 프로젝트를 선택하면 고정 주소(`/diagram`, `/db-modeling`, `/api`)에서 같은 프로젝트 컨텍스트를 사용한다.
- 프로젝트 선택값은 URL에 노출하지 않고 쿠키 `aastudio.currentProject`에 저장해 새로고침 후에도 유지한다.

## 구현 내용

- `project` 테이블과 기본 `Alpha` 프로젝트를 추가했다.
- 프로젝트 목록 조회 및 생성 API를 추가했다.
- 사이드바의 하드코딩된 프로젝트 버튼을 프로젝트 `select`로 변경했다.
- `select` 변경 시 쿠키를 갱신하고 현재 고정 주소를 새로고침한다.
- `+ 새 프로젝트` 선택 시 프로젝트 생성 후 생성된 프로젝트를 현재 선택값으로 저장한다.
- 서버 레이아웃 모델은 쿠키의 프로젝트 ID를 기준으로 프로젝트 목록과 현재 프로젝트를 제공한다.
- DB 모델링 편집 내용도 현재 프로젝트 ID별 localStorage 키로 분리한다.
- 다이어그램 문서에 `project_id`를 추가해 프로젝트별로 저장·조회한다.
- DB 모델링 스키마를 `db_model_document` 테이블에 프로젝트별로 저장·조회한다.
- `/api/db-modeling/schema` API를 추가하고 편집 변경을 지연 저장한다.
- 메인 사이드바 토글을 실제 화면의 `header` 존재 여부와 무관하게 동작하도록 수정하고, 펼침 상태를 localStorage에 유지한다.
- 프로젝트 목록이 비어도 기본 `Alpha` 프로젝트가 화면에 표시되도록 fallback을 추가했다.
- 사이드바 축소/확장 표시를 불안정한 임의 group selector 대신 명시적 상태 클래스와 CSS로 통일했다.
- 사이드바 하단 토글의 폭 변경을 명시적 CSS 상태로 보강하고 `app.js` 캐시 버전을 갱신했다.
- 프로젝트·DB 모델 조회 Map에 명시적 `resultMap`을 적용해 DB 컬럼명과 화면 키를 고정했다.

## 검증

- `node --check src/main/resources/static/js/app.js`
- `node --check src/main/resources/static/js/db-modeling.js`
- `git diff --check`
- H2 `RunScript`로 `schema.sql`과 `data.sql` 실행 성공
- 기존 `diagram_document` 테이블에 `project_id`만 없는 상태를 만든 뒤 스키마 실행 후 컬럼 보정 확인
- 프로젝트·다이어그램·DB 모델 Mapper XML 파싱 성공
- H2/MariaDB 공통 스키마의 기존 `diagram_document`에 `project_id`를 추가하도록 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`를 적용했다.
- Maven 실행은 `mvn` 및 Maven Wrapper가 환경에 없어 실행하지 못했다.

## 다음 작업

- API 명세 화면은 아직 저장 모델이 없어 별도 API 문서 테이블과 CRUD가 다음 작업이다.
- Java 변경 반영을 위해 실행 중인 Spring Boot 프로세스를 재시작해야 한다.
