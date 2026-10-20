# DB 테이블 목록 선택 시 캔버스 순서 보존

## 목적
- `db-table-list`에서 테이블을 선택할 때 캔버스 노드의 DOM·겹침 순서가 바뀌는 문제를 수정한다.

## 분석 및 수용 기준
- 목록 클릭 후 기존 캔버스 노드를 삭제·재생성하지 않는다.
- 선택 상태와 속성 패널은 갱신하되 캔버스 뷰포트는 이동하지 않는다.
- 기존 노드가 없는 경우에만 ERD를 다시 그린다.

## 변경 파일
- `src/main/resources/static/js/db-modeling.js`
  - 목록 클릭 시 `renderErd()`를 우선 호출하지 않고 기존 노드의 선택 상태만 갱신한다.
  - 목록 활성 상태를 선택한 테이블에 맞춰 갱신한다.
  - 목록 선택에서는 ERD를 다시 렌더링하지 않으며, `erdPanX`/`erdPanY`와 노드 DOM 순서를 변경하지 않는다.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js` 통과
- `git diff --check` 통과
- `./gradlew.bat test` 실행 불가: 로컬에 Java 25 toolchain이 없어 Gradle이 테스트 컴파일러를 찾지 못함

## 미해결 이슈 및 다음 작업
- Java 25 설치 또는 Gradle toolchain 다운로드 저장소 설정 후 전체 테스트를 재실행한다.
