# AAStudio 개발 지침

AAStudio의 개발 기준은 저장소 내부 문서로 관리한다.

- 개발 기준: `docs/development-guide.md`
- 제품 요구사항: `docs/prd.md`
- 작업 이력: `docs/working_history/`
- 실행·기술 기준: `README.md`, `pom.xml`

작업 전 요구사항, 현재 구현, 테스트와 실행 환경, 영향 범위를 먼저 확인한다.

## 기본 원칙

1. 기능을 작은 작업 단위로 분해한다.
2. 가능한 기능은 Red-Green-Refactor 순서로 개발한다.
3. 구조 변경과 기능 변경을 분리한다.
4. 구현 후 정적 검사와 관련 테스트를 실행한다.
5. 실패한 테스트, 결정 사항, 다음 작업을 작업 이력에 기록한다.
6. 기존 사용자 변경을 보존하고 범위를 벗어난 리팩터링을 하지 않는다.

## 작업 흐름

Context → Plan → Design → Implement → Verify → Record 순서로 진행한다.

## 완료 기준

- 요구사항의 수용 기준을 충족한다.
- 관련 테스트가 통과하거나 실행 불가 사유가 기록되어 있다.
- 변경 파일과 검증 결과가 명확하다.
- 다음 작업 또는 오픈 이슈가 문서화되어 있다.

세부 절차와 AAStudio 전용 QA 체크리스트는 `docs/development-guide.md`를 따른다.
