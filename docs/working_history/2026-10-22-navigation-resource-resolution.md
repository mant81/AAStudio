# STS 공통 내비게이션 템플릿 누락 오류 개선

## 목적
- 첨부 로그의 대시보드 렌더링 실패를 해결한다.
- 오류: `Error resolving template [fragments/navigation]` (`fragments/layout` 122행).

## 분석 및 수용 기준
- `src/main/resources/templates/fragments/navigation.html`과 Gradle 출력에는 파일이 존재하지만 STS 출력인 `bin/main/templates/fragments/`에는 `layout.html`만 있었다.
- `.classpath`는 Java와 리소스의 실행 출력을 `bin/main`으로 지정한다. 외부 편집으로 추가한 공통 fragment가 IDE 실행 리소스에 반영되지 않은 상태였다.
- 실행 리소스를 갱신하고 기존 Java 클래스·사용자 IDE 설정은 보존한다.
- 기본 classpath 템플릿 설정으로 실제 HTTP 요청 시 공통 내비게이션을 사용하는 6개 화면이 정상 렌더링되어야 한다.

## 변경 파일
- `build.gradle`: `syncIdeResources` Copy 작업을 추가했다. Gradle의 main 리소스를 STS/Eclipse의 `bin/main`으로 복사하며 Java 클래스를 삭제하지 않는다. 일반 빌드의 동작은 유지하고 필요할 때 명시적으로 실행한다.
- `README.md`: STS 리소스 누락 시 `gradlew syncIdeResources` 실행과 IDE Refresh/Clean 절차를 안내했다.
- `src/test/java/com/aastudio/core/web/PageRenderingTest.java`: H2 메모리 DB·임의 포트의 실제 서버에서 `/`, `/diagram`, `/db-modeling`, `/api`, `/wiki`, `/settings`를 요청한다. 200 응답, 내비게이션·프로젝트 메뉴·현재 페이지 표시를 검증한다. 템플릿 경로를 파일 시스템으로 우회하지 않는다.
- `bin/main`(Git 제외): 동기화 명령으로 누락된 fragment와 현재 정적 리소스를 갱신했다.

## 검증
- Java 25에서 `gradlew.bat syncIdeResources test build --console=plain`: 성공.
- 신규 HTTP 렌더링 테스트 6개와 기존 DB 모델링 서비스 테스트 3개: 총 9개 통과.
- 원본과 `bin/main`의 `navigation.html`, `layout.html` SHA-256 일치 확인.
- `git diff --check`: 통과.
- 8080 서버의 직접 확인은 연결 실패로 실행하지 못했다. 해당 서버는 작업 시점에 실행 중이지 않았다. 임의 포트의 통합 테스트 서버에서는 6개 화면 모두 정상 확인했다.
- `.project`, `.settings/org.eclipse.jdt.core.prefs` 등 기존 사용자 변경은 수정하지 않았다.

## 미해결 이슈와 다음 작업
- 실행 리소스 누락 해결 완료. STS에서 앱을 시작해 반영한다.
- 이후 외부 편집 파일이 IDE에 반영되지 않는 경우 Refresh/Clean 또는 추가한 동기화 명령을 사용한다.
