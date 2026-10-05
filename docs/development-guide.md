# AAStudio 개발 기준

이 문서는 AAStudio 저장소 안에서 요구사항 분석부터 구현, 검증, 기록까지 수행하기 위한 독립 기준이다. 외부 하네스나 개인 환경의 문서에 의존하지 않는다.

## 1. 문서와 기준의 우선순위

작업 시 다음 순서로 판단한다.

1. 사용자의 현재 요청
2. `docs/prd.md`의 제품 요구사항
3. `README.md`와 `pom.xml`의 실행·기술 기준
4. 현재 소스 코드와 테스트
5. `docs/working_history/`의 최근 결정과 미해결 이슈

문서와 코드가 다르면 차이를 기록하고, 현재 요청에 필요한 최소 범위만 수정한다. 기존 사용자 변경은 보존한다.

## 2. 현재 프로젝트 기준선

- Spring Boot 3.4.2
- Java 21
- MyBatis XML Mapper
- Thymeleaf 템플릿
- H2 기본 실행 환경, MariaDB 프로파일 지원
- 서버 코드: `src/main/java/`
- 템플릿·정적 리소스: `src/main/resources/templates/`, `src/main/resources/static/`
- SQL·Mapper: `src/main/resources/schema.sql`, `src/main/resources/data.sql`, `src/main/resources/mapper/`
- 요구사항: `docs/prd.md`
- 작업 기록: `docs/working_history/`

기능을 수정할 때 Java 컨트롤러/서비스뿐 아니라 템플릿의 selector, 정적 JavaScript의 상태 변경, CSS, Mapper와 SQL의 연결까지 함께 확인한다.

## 3. 표준 작업 흐름

### Context

- 요청을 기능 단위로 분해한다.
- 관련 요구사항, 현재 구현, 테스트, 실행 명령을 조사한다.
- 변경 파일과 연결 경계를 목록화한다.
- 기존 미완료 작업이나 사용자 변경을 확인한다.

### Plan

- 수용 기준을 관찰 가능한 문장으로 작성한다.
- 변경하지 않을 범위를 명확히 한다.
- 테스트 가능 여부와 검증 명령을 정한다.

### Design

- 데이터 흐름을 `UI → Controller → Service → Mapper/DB` 또는 실제 적용되는 흐름으로 정리한다.
- 구조 변경과 기능 변경을 분리한다.
- 기존 경계를 재사용하고 새 추상화는 필요할 때만 추가한다.

### Implement

- 가능한 경우 Red-Green-Refactor로 진행한다.
- 먼저 실패하는 작은 테스트 또는 재현 절차를 만든다.
- 통과에 필요한 최소 코드만 수정한다.
- 동작이 안정된 뒤 중복과 가독성만 정리한다.

테스트를 만들기 어려운 UI 작업은 재현 절차와 상태 변화(입력값, DOM/CSS 결과)를 수용 기준으로 기록하고, 정적 검사와 수동 검증으로 보완한다.

### Verify

- 관련 테스트를 먼저 실행한 뒤 전체 테스트 또는 빌드를 실행한다.
- JavaScript 변경 시 `node --check <파일>`을 실행한다.
- 템플릿 selector와 JavaScript의 `querySelector`/data attribute가 일치하는지 확인한다.
- Controller 경로와 Thymeleaf 템플릿 이름, Service와 Mapper namespace/id, SQL 컬럼과 Java 사용 키를 교차 확인한다.
- 실행 불가한 검증은 명령과 실패 사유를 기록한다.

### Record

- 변경 파일, 수용 기준, 검증 결과, 실패 사유, 미해결 이슈를 `docs/working_history/`에 기록한다.
- 다음 작업자가 바로 이어갈 수 있도록 다음 단계와 전제 조건을 남긴다.

## 4. 역할별 검토 관점

작은 수정은 한 사람이 처리하되 다음 관점을 모두 확인한다.

- Analyst: 요구사항·현재 구현·영향 범위가 정확한가?
- Architect: 모듈 경계와 데이터 흐름이 기존 구조와 맞는가?
- Builder: 최소 변경으로 동작과 오류 처리를 구현했는가?
- QA: 정상·경계·회귀 시나리오를 검증했는가?
- Reviewer: 보안·성능·유지보수성·범위 초과가 없는가?

## 5. AAStudio 통합 QA 체크리스트

### 화면과 정적 리소스

- [ ] 템플릿의 id/class/data attribute와 JavaScript selector가 일치한다.
- [ ] 이벤트 입력이 dataset 또는 서버 데이터에 올바르게 반영된다.
- [ ] 선택 상태, 빈 상태, 오류 상태가 모두 처리된다.
- [ ] CSS 우선순위와 inline style 때문에 변경 결과가 가려지지 않는다.

### 서버와 템플릿

- [ ] Controller URL과 템플릿 파일명이 일치한다.
- [ ] 모델 키와 Thymeleaf 표현식이 일치한다.
- [ ] 유효하지 않은 입력과 빈 결과가 안전하게 처리된다.

### Service, Mapper, DB

- [ ] Service가 호출하는 Mapper namespace/id가 XML과 일치한다.
- [ ] SQL 컬럼명, 반환 Map key, 화면 사용 key를 교차 확인한다.
- [ ] `schema.sql`과 `data.sql` 변경 필요성을 검토한다.
- [ ] H2 기본 프로파일과 MariaDB 프로파일의 동작 차이를 확인한다.

## 6. 기본 검증 명령

```text
mvn test
mvn package
node --check src/main/resources/static/js/<changed-file>.js
git diff --check
```

환경에 명령이 없거나 의존성 다운로드가 불가능하면 대체 검증을 수행하고 그 사실을 작업 이력에 남긴다.

## 7. 작업 이력 형식

파일명은 `docs/working_history/YYYY-MM-DD-<topic>.md`를 사용한다.

```markdown
# 작업 제목

## 목적
- 무엇을 해결하는가

## 분석 및 수용 기준
- 현재 원인
- 완료 조건

## 변경 파일
- 경로와 변경 이유

## 검증
- 실행한 명령과 결과
- 실행하지 못한 검증과 사유

## 미해결 이슈와 다음 작업
- 없으면 없음
```

## 8. 외부 기준 이관 완료

이 문서와 `AGENTS.md`, `docs/prd.md`, `docs/working_history/`가 AAStudio의 작업 기준이다. 이후 작업에서 외부 하네스 경로를 참조하지 않는다.
