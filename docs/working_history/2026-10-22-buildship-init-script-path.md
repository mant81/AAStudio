# Gradle Buildship 초기화 스크립트 경로 오류 개선

## 목적
- IDE의 `Could not run phased build action` 오류와 누락된 `init.gradle` 경로 참조를 제거한다.

## 분석 및 수용 기준
- 첨부 오류에 나타난 `...globalStorage/redhat.java/1.56.0/.../init.gradle` 경로가 `.settings/org.eclipse.buildship.core.prefs`의 `arguments` 항목에 절대 경로로 저장되어 있었다.
- 해당 경로는 VS Code Java 확장의 내부 버전별 캐시에 속해 확장 업데이트/정리 시 없어질 수 있다. Gradle 래퍼 실행 자체는 Gradle 9.8.0을 정상 실행한다.
- 저장소가 요구하는 Java 25와 일치하도록 Buildship JVM을 설정하고 캐시 내부 파일에 고정한 init-script 옵션을 제거한다.

## 변경 파일
- `.settings/org.eclipse.buildship.core.prefs`: 확장 임시 경로를 참조하던 다섯 개 `--init-script` 인자를 제거했다. Gradle JVM을 사용 가능한 JDK 25(`D:/sw/java/jdk-25.0.2`)로 맞췄다.

## 검증
- 설정 변경 전 `gradlew.bat --version --console=plain`으로 저장소 래퍼 Gradle 9.8.0과 Java 25 실행을 확인했다.
- 첨부 오류의 init-script 경로가 프로젝트 Buildship 설정에만 있음을 확인하고 제거했다.
- 이번 설정 변경 이후 Buildship의 phased build 재연결은 IDE에서 실행해야 하므로 수행하지 않았다. 테스트는 추가하거나 실행하지 않았다.

## 미해결 이슈와 다음 작업
- IDE에서 Gradle 프로젝트를 Refresh/Reload해 새 프로젝트 설정을 다시 읽는다. 오류가 사라졌는지 확인한다.
- 현재 IDE 컴퓨터에 JDK 25가 `D:/sw/java/jdk-25.0.2`에 설치되어 있어야 한다.
