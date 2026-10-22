# 스키마 관리 ERD 생성 항목 삭제

## 목적
- 스키마 관리 메뉴에서 ERD 생성 항목을 제거한다.

## 분석 및 수용 기준
- 메뉴의 `db-schema-rebuild` 항목과 JavaScript 참조가 없어야 한다.
- 기존 편집기와 자동 ERD 생성은 유지한다.
- 기존 사용자 변경을 보존한다. 수정 시점에 템플릿의 메뉴 항목은 이미 제거된 상태여서 추가 수정하지 않았다.

## 변경 파일
- `src/main/resources/static/js/db-modeling.js`: 전용 클릭 이벤트 및 활성화 목록 참조 제거.
- `docs/prd.md`: 스키마 관리 메뉴 요구사항 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 파일의 CRLF 변환 경고만 발생).
- PowerShell 정적 검증: 템플릿·스크립트의 `db-schema-rebuild` 부재와 `db-editor-render` 유지 확인.
- `gradlew.bat test syncIdeResources --offline`: `.gradle/9.8.0/fileHashes/fileHashes.lock` 액세스 거부로 빌드 시작 실패.
- 초기 Node 인라인 검증은 PowerShell 인용부호 전달 오류로 실패하여 PowerShell 정적 검증으로 대체했다.
- 브라우저 수동 검증은 수행하지 않았다.

## 미해결 이슈와 다음 작업
- Gradle 캐시 잠금 파일 접근 권한 해결 후 테스트 및 IDE 리소스 동기화를 재실행한다.
