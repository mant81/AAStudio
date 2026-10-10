# Gradle 전환

## 목적

- Maven 빌드 구성을 Gradle 빌드 구성으로 전환한다.
- 기존 Spring Boot, Java, MyBatis 의존성과 실행 프로파일 동작을 유지한다.

## 분석 및 수용 기준

- 기존 `pom.xml`의 플러그인, 의존성, Java 버전과 동일한 Gradle 구성을 제공한다.
- Gradle Wrapper로 테스트와 패키징을 실행할 수 있어야 한다.
- README와 개발 지침의 빌드 명령을 Gradle 기준으로 갱신한다.

## 변경 파일

- `build.gradle`: Spring Boot 4.1.1, Java 25, MyBatis Spring Boot Starter 4.1.0, 기존 의존성 및 테스트 태스크 구성
- `settings.gradle`: Eclipse workspace 폴더명과 일치하는 프로젝트명 및 저장소 설정
- `gradlew`, `gradlew.bat`, `gradle/wrapper/*`: Gradle Wrapper 추가
- `pom.xml`: Maven 구성 제거
- `README.md`, `docs/development-guide.md`: 실행 및 검증 명령 갱신

## 검증

- Java 25로 실행한 `gradlew build`: 성공. `build/libs/`에 일반 JAR와 실행 JAR가 생성됨.
- `git diff --check`: 통과

## 미해결 이슈 및 다음 작업

- Java 25 실행 환경을 위해 Gradle Wrapper를 9.8.0으로 사용한다.
- STS의 Gradle 실행 JDK가 Java 25가 아니면 동일한 환경 오류가 재발할 수 있다.
