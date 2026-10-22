# DB 모델링 문서 메뉴 통일

## 목적
- 다이어그램에서 정리한 문서 작업 바 구성을 DB 모델링에도 적용한다.

## 분석 및 수용 기준
- 왼쪽은 스키마 선택·추가·더보기·저장 상태, 오른쪽은 샘플·내보내기·공유 순서로 배치한다.
- 공통 상단 56px, 문서 작업 바 48px, 코드 편집기·ERD 배치를 유지한다.
- 기존 DB 화면의 공유·SQL 내보내기 버튼에는 이벤트가 없었다. 새 메뉴는 실제 동작을 연결한다.
- 더보기에는 기존 ERD 재생성·에디터 접기/펼치기를 연결한다.
- 샘플 버튼은 기존 예시 불러오기 동작을 사용한다. 현재 편집 내용을 예시 코드로 교체하는 기존 동작을 유지한다.
- 내보내기는 원본 코드를 DBML 또는 SQL로 저장하고 모델 JSON에는 코드와 테이블 위치를 포함한다. DBML을 SQL로 변환하는 기능은 추가하지 않는다.
- 공유는 현재 스키마 코드를 확인·복사하는 방식으로 제공한다. 별도 공개 링크나 서버 공개 API는 만들지 않는다.

## 변경 파일
- `src/main/resources/templates/db-modeling.html`: 더보기, 샘플, 내보내기 목록, 코드 공유 팝오버 추가.
- `src/main/resources/static/js/db-modeling.js`: 기존 편집 동작 연결, DBML/SQL/JSON 다운로드, 클립보드 복사와 실패 시 수동 복사 안내.
- `src/main/resources/static/js/app.js`: 공통 details 메뉴의 닫기 처리를 DB 메뉴에도 적용.
- `src/main/resources/static/css/workspace-navigation.css`: 관리·공유 메뉴와 버튼 아이콘, 모바일 코드 복사 표시 스타일 추가.
- `src/main/resources/templates/fragments/layout.html`: 변경 리소스 캐시 버전 갱신.
- `src/test/js/db-modeling-toolbar.cjs`: 실제 다운로드 내용·복사·기존 동작 연결 및 반응형 브라우저 검증 추가.
- `docs/prd.md`: DB 문서 메뉴와 내보내기·공유의 실제 동작 반영.

## 검증
- Java 25로 `gradlew.bat test build --console=plain`: 통과. Java 테스트는 소스가 없어 `NO-SOURCE`로 완료.
- `node --check`로 `app.js`, `db-modeling.js`, `db-modeling-toolbar.cjs` 검사: 통과.
- `git diff --check`: 통과.
- 격리된 H2 메모리 DB 서버(18080) 및 Playwright:
  - `node src/test/js/db-modeling-toolbar.cjs`: 통과.
  - DBML·SQL 파일 확장자와 실제 원본 코드, JSON 스키마 코드·테이블 위치 데이터 확인.
  - 클립보드에 복사한 코드가 현재 편집 내용과 동일한지 확인.
  - 샘플 불러오기, ERD 재생성, 에디터 접기·펼치기 확인.
  - 메뉴 선택·Escape·외부 클릭 닫기, 1024px·375px 화면의 겹침 없음 및 메뉴 텍스트 표시 확인.
  - 최초 에디터 토글 점검은 DDL 입력 후 400ms 자동 분석이 끝나기 전에 토글을 시작해 실패했다. 자동 분석으로 테이블이 표시된 뒤 상호작용하도록 검증 순서를 교정했다. 기존 자동 분석 동작은 유지했다.
  - `node src/test/js/db-modeling-layout.cjs`: 기존 캔버스·속성·드래그·격자·확대·리사이즈 검증 통과.
  - `node src/test/js/app-navigation.cjs`: 6개 화면·프로젝트 메뉴·키보드·모바일 검증 통과.
  - JavaScript 실행 오류 없음.
- `target/db-modeling-menus.png`, `target/db-modeling-export-menu.png`에 캡처하고 실제 배치를 확인했다.
- 기존 파일 DB와 사용자 IDE 설정 변경은 보존했다.

## 미해결 이슈와 다음 작업
- 이번 메뉴 구성 변경 범위의 미해결 이슈 없음.
- 실행 중인 앱은 갱신한 빌드로 재시작하면 반영된다.
