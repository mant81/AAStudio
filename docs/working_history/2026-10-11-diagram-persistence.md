# 다이어그램 추가 항목 영속화

## 목적

- 새로 추가한 다이어그램과 그 안의 노드·연결선을 서비스 재시작 후에도 복원한다.

## 분석 및 변경

- 기존 저장 API는 캔버스 상태만 저장하고, 동적으로 추가한 다이어그램 목록은 브라우저 DOM에만 존재했다.
- `diagram_document`에 `group_name`을 추가하고 저장된 다이어그램 목록 조회 API를 추가했다.
- 저장 요청에 그룹명을 포함하고, 다이어그램 화면 초기화 시 서버 목록을 읽어 동적 다이어그램 버튼을 복원한다.
- 다이어그램 추가 직후 빈 캔버스도 저장 큐에 넣어, 콘텐츠를 그리기 전에도 목록 레코드가 생성되도록 했다.
- 목록 생성은 지연 저장에만 의존하지 않고 `POST /api/diagrams`로 즉시 DB에 기록하도록 보강했다.
- H2가 목록 Map 키를 대문자로 반환하는 문제를 명시적 MyBatis `resultMap`으로 수정했다.
- 실제 API 왕복에서 DB 행은 저장되지만 응답 키가 `DIAGRAMNAME` 등으로 직렬화되어 프런트가 목록을 무시하는 현상을 재현했고, 명시적 스네이크 케이스 Map 키로 수정했다.
- 다이어그램이 1개일 때 삭제 대신 캔버스만 초기화하고, 빈 상태를 DB에 저장하도록 변경했다.
- 기존 정적 다이어그램과 서버 목록이 중복되지 않도록 다이어그램 ID 기준으로 병합한다.

## 변경 파일

- `src/main/java/com/aastudio/core/diagram/mapper/DiagramMapper.java`
  - 목록 조회와 그룹명 저장 파라미터 추가
- `src/main/resources/mapper/diagram/DiagramMapper.xml`
  - `group_name` 컬럼 보정, 목록 조회, 저장 SQL 보강
- `src/main/java/com/aastudio/core/diagram/service/DiagramService.java`
  - 다이어그램 목록 조회와 그룹명 저장 연결
- `src/main/java/com/aastudio/core/web/DiagramStateController.java`
  - `GET /api/diagrams` 추가
- `src/main/resources/schema.sql`
  - `diagram_document.group_name` 추가
- `src/main/resources/static/js/diagram.js`
  - 저장 시 그룹명 전송, 서버 목록 복원

## 검증

- `node --check src/main/resources/static/js/diagram.js`: 통과
- `git diff --check`: 통과
- `gradlew test` (Java 25 지정): 통과 (`test`: `NO-SOURCE`)
- 별도 포트에서 Spring Boot 실행 후 `POST /api/diagrams` → `GET /api/diagrams` 왕복 확인: 스네이크 케이스 목록 반환 및 삭제 확인

## 미해결 이슈 및 다음 작업

- 실행 중인 Spring Boot 프로세스가 있다면 변경된 Java/Mapper 반영을 위해 재시작이 필요하다.
- 실제 브라우저에서 다이어그램 추가 → 노드 작성 → 저장 상태 확인 → 서비스 재시작 → 복원 여부를 확인해야 한다.
- 기본 프로젝트를 `project-1`/`프로젝트1`로 고정하고, 기존 `alpha` 프로젝트 및 연결 데이터를 이관·제거했다.
- 기존 다이어그램 ID를 다른 프로젝트 컨텍스트에서 저장할 때 INSERT 중복키가 발생하던 경로를 보완했다. 프로젝트 범위 UPDATE가 0건이면 다이어그램 ID 기준으로 UPDATE 후, 그래도 없을 때만 INSERT한다.
- 다이어그램과 카테고리를 이름이 아닌 `group_id`로 연결하고, 카탈로그 조회·추가·자동 저장·복원에 동일 키를 사용하도록 보강했다.
- `diagram_group`을 별도 키 테이블로 추가했다. `group_name`은 표시값으로만 사용하고, 카테고리 복원 시 이름 비교를 제거했다.
- 그룹당 다이어그램이 하나라는 정책에 맞춰 별도 `group_id`를 제거하고, `(project_id, diagram_id)`를 유일한 저장 키로 사용하도록 정리했다.

## 프로젝트 ID 명시 API 보완

- 기존 `/api/diagrams/{diagram_id}/state`는 URL에 `project_id`가 없어 프로젝트가 바뀌거나 다이어그램 ID가 겹칠 때 저장 대상이 불명확했다.
- 다이어그램 API를 `/api/projects/{project_id}/diagrams` 및 `/api/projects/{project_id}/diagrams/{diagram_id}/state`로 변경했다.
- 다이어그램 API에서는 프로젝트 쿠키나 기본 프로젝트 fallback을 사용하지 않고, URL의 `project_id`와 `diagram_id`를 DB 복합 키에 그대로 전달한다.
- `diagram_document`의 저장·조회·삭제 SQL은 모두 `(project_id, diagram_id)` 조건을 사용한다.
- 검증: `gradlew test` 성공, `node --check src/main/resources/static/js/diagram.js` 성공, `git diff --check` 성공.
- 구주소 요청이 브라우저 캐시에서 재사용되지 않도록 레이아웃의 `diagram.js` 버전을 갱신했다.
- 프로젝트별 `last_opened_diagram_id`를 localStorage에 저장하고, 다이어그램 화면 재진입 시 마지막 열린 카테고리의 다이어그램 상태를 먼저 복원하도록 변경했다.
- 이미지/PDF 내보내기 범위를 viewport나 고정 stage 크기가 아닌 노드·라인의 실제 데이터 경계로 계산하고, 경계 밖 빈 영역을 제외하도록 변경했다.
- 지우개가 선만 판정하던 문제를 수정해 노드도 캔버스 좌표와 지우개 반경으로 판정하고, 노드 삭제 시 연결된 선과 그룹 참조도 함께 정리하도록 변경했다.
- 노드 내부 편집 요소에서 지우개 이벤트 좌표가 전달되지 않던 문제를 수정하고, `Ctrl+Z` 복원 후 현재 다이어그램 상태와 DB 저장 대기를 동기화하도록 보완했다.
- 펜 자유곡선 지우기 판정을 샘플 점 비교에서 선분과 지우개 중심 사이의 거리 비교로 변경해 짧거나 빠르게 지나간 선 구간도 지워지도록 보완했다.
