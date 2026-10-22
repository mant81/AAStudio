# DB 모델링 스키마 관리 기능

## 목적
- 스키마 관리에 이름 변경·백업하기·복원하기·모델링 삭제를 제공한다.
- 후속 요청에 따라 ERD 생성·에디터 접기/펼치기도 유지해 6개 항목으로 구성한다.

## 분석 및 수용 기준
- 이름 변경은 현재 스키마 코드와 위치를 보존하고, 서버 저장 성공 후 이름·선택 목록을 갱신한다.
- 백업은 기존 버전 1 모델 JSON(이름, 스키마 코드, 테이블 위치)과 호환한다.
- 복원은 JSON 버전·이름·파싱 가능한 스키마 코드·유한 좌표를 검증한다. 최대 파일 크기는 5MB다. 기존 모델링 복원 시 확인을 받으며 저장 실패 시 현재 모델링을 변경하지 않는다.
- 삭제는 확인 후 해당 프로젝트의 현재 모델링만 처리하고 다음 모델링을 표시한다. 마지막 삭제 후에는 빈 상태를 유지하며 추가·백업 복원이 가능하다.
- 삭제 직전 자동 저장이 모델링을 되살리지 않도록 저장 요청 순서를 유지하고 삭제된 ID의 저장을 거부한다.

## 변경 파일
- `src/main/resources/templates/db-modeling.html`
  - 관리 메뉴 6개 항목, 백업 파일 입력, 이름 추가/변경 모달과 오류 안내를 연결했다.
- `src/main/resources/static/js/db-modeling.js`
  - 이름 변경, 백업 다운로드, 검증 후 복원, 삭제 및 빈 상태를 구현했다.
  - 저장 요청은 대상 ID·이름·본문을 캡처하고 순서대로 실행한다. 관리 작업 중 편집·관련 메뉴를 잠시 잠그고 대기 중 파싱·저장을 정리한다.
  - 새 모델링에는 고유 ID를 부여해 삭제된 항목과 충돌하지 않도록 했다.
- `src/main/resources/static/css/workspace-navigation.css`, `src/main/resources/templates/fragments/layout.html`
  - 삭제 강조·비활성 상태와 리소스 버전을 반영했다.
- `src/main/java/com/aastudio/core/web/DbModelController.java`
  - 프로젝트 쿠키 범위의 DELETE API를 추가했다. 잘못된 ID·이름은 400, 삭제된 ID에 대한 저장은 409로 응답한다.
- `src/main/java/com/aastudio/core/dbmodel/{service/DbModelService,mapper/DbModelMapper}.java`, `src/main/resources/mapper/dbmodel/DbModelMapper.xml`
  - 삭제 상태를 반영한 조회·저장·삭제 및 초기화 여부 확인을 추가했다.
- `src/main/resources/schema.sql`
  - 기존 테이블에도 적용되는 `deleted BOOLEAN NOT NULL DEFAULT FALSE` 컬럼을 추가했다. 데이터는 논리 삭제하며 기존 활성 모델링은 유지한다.
  - 삭제 이력이 있으면 기본 스키마를 다시 생성하지 않는다.
- `src/test/java/com/aastudio/core/dbmodel/DbModelServiceTest.java`
  - H2 통합 테스트 3개로 이름 변경 시 데이터 보존, 프로젝트별 삭제 격리, 마지막 삭제·뒤늦은 자동 저장 방어를 검증한다.
- `src/test/js/db-modeling-management.cjs`
  - 격리된 QA 프로젝트에서 실제 API·파일·브라우저 상태를 함께 검증한다.
- `docs/prd.md`: 관리 메뉴 및 데이터 처리 기준을 반영했다.

## 검증
- Java 25 환경의 `gradlew.bat test build --console=plain`: 통과. Java 테스트 3개, 실패·오류 0개.
- `node --check`로 변경 JavaScript 및 관리 검증 스크립트 검사: 통과.
- `git diff --check`: 통과.
- 별도의 H2 메모리 DB·포트 18080에서 실제 서버 API로 검증했다. 기존 파일 DB는 사용하지 않았다.
  - `db-modeling-management.cjs`: 이름 변경과 새로고침 유지, 변경 실패 시 원래 이름 유지, JSON 다운로드·테이블 위치 백업·복원·서버 위치 보존, 잘못된 파일 거부, 삭제 취소·전체 삭제·새로고침 후 빈 상태, 삭제 ID 저장 409, 빈 상태에서 새 ID로 복원 통과.
  - `db-modeling-toolbar.cjs`: 기존 DBML·SQL·JSON 다운로드, 코드 복사, 샘플, ERD 생성·에디터 접기, 메뉴 닫기·반응형 검증 통과.
  - `db-modeling-layout.cjs`: 캔버스·관계·속성 패널·드래그·격자·확대·창 크기 변경 검증 통과.
  - `app-navigation.cjs`: 공통 메뉴·프로젝트 선택·키보드·모바일 검증 통과.
  - JavaScript 실행 오류 없음.
- 초기 공통 메뉴 회귀 검증의 타임아웃은 실행 중인 QA JAR를 재빌드로 덮어써 클래스 로딩 오류가 발생한 것이었다. 빌드 산출물을 `target/schema-management-qa.jar`에 복사한 별도 QA 서버로 재실행해 검증했다. 임시 탐색 대기 조건 변경은 원복했다.
- `target/schema-management-menu.png`에서 6개 항목과 삭제 강조 표시를 직접 확인했다.
- MariaDB 환경은 제공되지 않아 실행 검증하지 않았다. SQL은 H2/MariaDB 공통의 BOOLEAN·UPDATE·조건식과 기존 ALTER 문법을 사용한다.
- 기존 사용자 IDE 설정 변경은 보존했다.

## 미해결 이슈와 다음 작업
- 이번 요청 범위의 미해결 이슈 없음.
- 실행 중인 앱은 갱신한 빌드로 재시작해야 한다. 시작 시 기존 DB에 삭제 상태 컬럼이 추가된다.
