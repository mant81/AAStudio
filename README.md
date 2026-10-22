# AAStudio Core

Spring Boot 기반의 기본 업무 포털 샘플입니다.

## 기술 스택

- Spring Boot 3
- MyBatis XML Mapper
- Thymeleaf
- H2
- MariaDB 전환용 프로필

## 실행 설정

기본 프로필은 `h2`입니다.

```bash
gradlew bootRun
```

STS/Eclipse는 `bin/main`의 리소스로 실행합니다. 외부 편집 후 `fragments/navigation` 등을 찾지 못하면 아래 명령으로 실행 리소스를 갱신한 뒤 앱을 재시작합니다. IDE에서는 프로젝트 Refresh(F5) 후 Project → Clean으로도 갱신할 수 있습니다.

```bash
gradlew syncIdeResources
```

이 명령은 리소스만 복사하며 컴파일된 Java 클래스는 보존합니다. Gradle의 `bootRun`과 빌드된 JAR는 Gradle이 처리한 리소스를 사용합니다.

MariaDB로 실행할 때는 `application.yml`의 `mariadb` 프로필 값을 환경에 맞게 수정한 뒤 아래처럼 실행합니다.

```bash
gradlew bootRun --args='--spring.profiles.active=mariadb'
```

## 화면

- `/` : Dashboard
- `/diagram` : Diagram
- `/db-modeling` : DB Modeling
- `/api` : API Specification
- `/wiki` : Wiki
- `/settings` : Settings
- `/h2-console` : H2 Console

## 원본 화면 기준

- `dashboard.html` -> `/`
- `diagram.html` -> `/diagram`
- `db_modeling.html` -> `/db-modeling`
- `api.html` -> `/api`
- `wiki.html` -> `/wiki`
- `setting.html` -> `/settings`

## 구조 포인트

- 프로젝트 선택과 공통 메뉴는 상단 Thymeleaf navigation fragment로 분리
- DB 접근은 `DashboardMapper.xml` 중심의 XML 매퍼 구조
- H2 URL에 `MODE=MariaDB`를 적용해 초기 개발과 추후 MariaDB 전환 간 차이를 줄임

## UI 규칙

- `D:\ai\new` 아래 제공된 원본 HTML을 화면 기준으로 사용한다.
- 공통 레이아웃이어도 좌측 메뉴, 헤더, 본문 구조를 임의로 재해석하거나 단순화하지 않는다.
- 디자인 수정이 필요하면 먼저 원본 HTML 기준을 유지한 상태로 반영한다.
- Java 코드에서는 `VO`, `Model` 네이밍과 `model` 패키지를 사용하지 않는다.
- Java 데이터 타입은 의미에 맞게 `domain`, `request`, `response`, `entity` 같은 이름으로 구분한다.
- 조회/화면 바인딩 데이터는 Java 클래스 대신 `Map<String, Object>` 기반으로 작업한다.
- 질문 응답은 10자 이내로 작성하고 상세 설명은 하지 않는다.
