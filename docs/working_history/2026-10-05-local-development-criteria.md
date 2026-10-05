# AAStudio 내부 개발 기준 이관

## 목적

외부 하네스에 있던 개발·검증 원칙을 AAStudio 저장소의 `docs`에 정리하고, 이후 작업이 프로젝트 내부 문서만 참조하도록 한다.

## 분석 결과

- 요구사항과 현재 구현을 먼저 조사하는 Context 단계가 필요하다.
- Plan, Design, Implement, Verify, Record를 분리하면 범위 초과와 검증 누락을 줄일 수 있다.
- 가능한 변경에는 Red-Green-Refactor를 적용한다.
- UI 변경은 selector, dataset, CSS 우선순위를 서버·템플릿 검증과 함께 확인해야 한다.
- Spring Boot 프로젝트 특성상 Controller-Template, Service-Mapper-XML, SQL-화면 키의 교차 검증이 필요하다.
- 작업 이력에는 변경 파일, 검증 결과, 실행 불가 사유, 다음 작업을 남긴다.

## 변경 파일

- `AGENTS.md`: 외부 하네스 경로 대신 저장소 내부 기준을 참조하도록 변경
- `docs/development-guide.md`: AAStudio 독립 개발 기준, QA 체크리스트, 검증 명령, 이력 형식 추가

## 검증

- 저장소 내 외부 하네스 경로 참조 여부 확인
- `git diff --check`

## 미해결 이슈와 다음 작업

- 없음
