# DB 모델링 테이블 위치 저장

## 목적
- DB Modeling ERD 캔버스에서 이동한 테이블의 위치를 새로고침 후에도 복원한다.

## 분석 및 수용 기준
- 프로젝트별 DB 모델 문서에 테이블별 X/Y 좌표를 저장한다.
- 드래그 종료 후 좌표를 저장하고, 조회 시 저장 좌표를 우선 적용한다.
- 기존 좌표 데이터가 없는 문서는 기존 기본 배치를 유지한다.

## 변경 파일
- `src/main/resources/schema.sql`
  - `db_model_document.layout_json` 컬럼과 기존 DB 보정용 `ALTER TABLE`을 추가했다.
- `src/main/resources/mapper/dbmodel/DbModelMapper.xml`
  - 레이아웃 조회·등록·갱신을 추가했다.
- `src/main/java/com/aastudio/core/dbmodel/mapper/DbModelMapper.java`
- `src/main/java/com/aastudio/core/dbmodel/service/DbModelService.java`
- `src/main/java/com/aastudio/core/web/DbModelController.java`
  - JSON 요청의 `layout`을 DB 문서의 `layout_json`으로 저장한다.
- `src/main/resources/static/js/db-modeling.js`
  - 테이블명별 좌표를 렌더링에 적용하고 드래그 종료 시 저장한다.
  - 드래그 종료 좌표는 즉시 저장하고 `keepalive`를 사용해 새로고침 직전 요청 유실을 줄였다.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과
- `git diff --check`: 통과
- `gradlew test`: 실행 불가
  - 현재 환경에 Java 25가 없고 Gradle toolchain 자동 다운로드가 설정되지 않아 실패했다.

## 미해결 및 다음 작업
- Java 25 환경에서 `gradlew test` 및 `gradlew build`를 다시 실행한다.
- 브라우저에서 테이블 이동 → 새로고침 → 프로젝트 전환 후 위치 복원을 수동 확인한다.

## 스키마 카테고리 선택 추가
- 상단 제목을 다이어그램과 같은 선택 메뉴로 변경했다.
- `E-Commerce Schema`, `Core Schema`, `Analytics Schema` 기본 카테고리를 제공한다.
- `+` 버튼으로 새 카테고리를 만들고, 카테고리별 DBML과 ERD 좌표를 별도 저장한다.
