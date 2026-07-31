# AAStudio

AAStudio는 Spring Boot 3, Java 21, Thymeleaf, MyBatis 기반의 로컬 분석 워크스테이션입니다.

## 목표 구조

```text
project-root
├─ build.gradle
├─ settings.gradle
├─ src
│  ├─ main
│  │  ├─ java
│  │  │  └─ com
│  │  │     └─ aastudio
│  │  │        ├─ AastudioApplication.java
│  │  │        ├─ config
│  │  │        ├─ common
│  │  │        └─ domain
│  │  │           ├─ auth
│  │  │           │  ├─ AuthController.java
│  │  │           │  ├─ AuthService.java
│  │  │           │  └─ AuthVO.java
│  │  │           ├─ code
│  │  │           │  ├─ CodeController.java
│  │  │           │  ├─ CodeService.java
│  │  │           │  └─ CodeVO.java
│  │  │           ├─ dashboard
│  │  │           │  └─ DashboardController.java
│  │  │           ├─ project
│  │  │           │  ├─ ProjectController.java
│  │  │           │  ├─ ProjectService.java
│  │  │           │  └─ ProjectVO.java
│  │  │           └─ user
│  │  │              ├─ UserController.java
│  │  │              ├─ UserService.java
│  │  │              └─ UserVO.java
│  │  │        └─ mapper
│  │  │           ├─ CodeMapper.java
│  │  │           ├─ ProjectMapper.java
│  │  │           └─ UserMapper.java
│  │  └─ common
│  │     └─ config
│  │        └─ UserSeedConfig.java
│  │  └─ resources
│  │     ├─ application.yml
│  │     ├─ sql
│  │     │  ├─ CodeMapper.xml
│  │     │  ├─ ProjectMapper.xml
│  │     │  ├─ UserMapper.xml
│  │     │  ├─ data.sql
│  │     │  └─ schema-sqlite.sql
│  │     ├─ templates
│  │     │  ├─ layout
│  │     │  ├─ project
│  │     │  ├─ user
│  │     │  ├─ code
│  │     │  └─ auth
│  │     └─ static
│  │        ├─ css
│  │        ├─ js
│  │        └─ images
│  └─ test
│     └─ java
└─ README.md
```

## 설계 원칙

- 도메인별로 `auth`, `project`, `user`, `code`, `dashboard`처럼 기능 단위로만 나눕니다.
- 각 도메인 안은 파일을 직접 둬서 깊이를 최소화합니다.
- `user` 도메인은 `UserController`, `UserService`, `UserVO`처럼 단일 파일 구성을 유지합니다.
- VO는 기능 단위로 1개 중심으로 운영하고, Lombok을 사용합니다.
- Mapper 인터페이스는 `com.aastudio.mapper`에 둡니다.
- MyBatis XML과 초기화 SQL은 `resources/sql`에 직접 둡니다.
- 화면은 Thymeleaf로 구성하고, 공통 레이아웃은 `templates/layout`에서 관리합니다.
- 로그인 후 대시보드에서 프로젝트, 사용자, 코드 그룹으로 바로 이동할 수 있습니다.
- 로그인 계정은 DB 기반으로 관리하고, 시작 시 기본 관리자 계정을 시드합니다.
- 기본 실행 DB는 `data/aastudio.sqlite3`에 저장되는 SQLite이며, 테스트는 격리된 SQLite 메모리 DB를 사용합니다.
- 현재 애플리케이션은 단일 `app.datasource`를 사용합니다.
- `project`, `user`, `code` 화면은 각각 목록, 상세, 수정, 생성 흐름을 가진다.
- 프로젝트는 상세 화면에서 복사할 수 있다.
- 대시보드는 프로젝트 이름, 설명, 상태를 기준으로 검색하거나 상태로 필터링할 수 있다.
- 프로젝트 상태 필터는 드롭다운으로 선택한다.
- `user`와 `code` 목록도 키워드 검색이 가능하다.
- 프로젝트 목록에는 최근 수정 시각이 함께 표시된다.
- 프로젝트 상태는 배지 스타일로 시각 구분된다.
- 대시보드는 프로젝트 상태별 개수를 함께 보여준다.
- 대시보드 상태 요약 카드는 해당 상태 목록으로 바로 이동한다.

## UI 방향

최신 트렌드 기반으로 다음 원칙을 적용합니다.

- 대시보드형 레이아웃
- 미니멀한 정보 밀도
- 카드와 테이블 중심 구조
- 절제된 모션
- 디자인 시스템 기반 컴포넌트 재사용
- 접근성 우선

## 구현된 워크벤치

프로젝트 상세의 `Open Workbench`에서 다음 화면과 저장 기능을 제공합니다.

- 프로젝트 대시보드, 작업영역, 단계별 담당자와 상태 이력, 접근 로그
- 소스 스캔 대상 메타데이터
- 코드점검 결과와 보안점검 세션/후보
- 표준단어 매칭, 권장 표기, 검토 메모, 제외 처리
- DB 모델, 테이블, 컬럼, 제약조건, 관계
- JSON 기반 ERD/흐름도, 자동 배치, 확대/축소, SVG 내보내기
- API 그룹, 수동/source-sync endpoint, request/response schema
- API 인증 프로필 메타데이터, 샘플 데이터, 테스트 케이스, 실제 HTTP 실행 이력
- Wiki 작성, 링크 삽입, 페이지 첨부, 버전 비교와 이전 버전 복원
- 계층형 WBS, 담당자, 마감일, 상태, 진행률, 상태 메모와 산출물 연결
- 프로젝트/Wiki 첨부파일 업로드, SHA-256 메타데이터, 다운로드와 삭제
- 단계별 내부 산출물 스냅샷, 버전 이력, Markdown/JSON/SQL/CSV 다운로드
- 외부 보안 솔루션 JSON 결과 import
- 프로젝트 공통 우측 선택 속성 패널과 최근 프로젝트 전환기

역할은 `ADMIN`, `OWNER`, `EDITOR`, `READONLY`를 사용합니다. `READONLY`는 프로젝트와
워크벤치를 조회할 수 있지만 서버의 쓰기 요청은 거부되며 화면에서도 편집 폼이 숨겨집니다.

소스 분석은 `app.analysis-root`로 지정한 로컬 디렉터리 내부에서만 실행됩니다. 기본값은
`data/sources`이며 이 범위를 벗어난 경로는 서버에서 거부합니다.

첨부파일은 `app.storage-root/attachments/{projectId}` 아래에 UUID 파일명으로 저장됩니다.
파일명 경로 정규화, 프로젝트 범위 확인, 25MB 제한과 SHA-256 해시를 적용합니다.

API 테스트는 기본적으로 loopback 호스트만 호출할 수 있습니다.

```yaml
app:
  api-test:
    allowed-hosts: localhost,127.0.0.1,::1
```

다른 내부 호스트가 필요하면 운영자가 `allowed-hosts`에 정확한 호스트명을 추가해야 합니다.
HTTP 리디렉션은 따르지 않으며 연결/요청 시간과 응답 본문은 제한됩니다. 인증 프로필에는
비밀값을 저장하지 않고 환경변수 이름만 JSON으로 등록합니다.

- Bearer: `{"tokenEnv":"API_TOKEN"}`
- Basic: `{"usernameEnv":"API_USER","passwordEnv":"API_PASSWORD"}`
- API key: `{"headerName":"X-API-Key","valueEnv":"API_KEY"}`

코드 리뷰 화면의 `Explain with local LLM`은 Ollama 호환 loopback API를 호출합니다.

```yaml
app:
  local-llm:
    base-url: http://127.0.0.1:11434
    model: qwen2.5-coder:7b
```

로컬 LLM URL은 loopback HTTP 주소만 허용되며 리디렉션을 따르지 않습니다. 생성된 설명,
모델명과 검토 시각은 해당 코드 이슈에 저장됩니다.

외부 readonly 공유는 Workbench의 `Share` 탭에서 생성합니다. 공유 링크는 프로젝트 정보,
단계 담당자, 다이어그램, Wiki, WBS, 산출물과 첨부파일 목록만 표시하며 편집 기능은
제공하지 않습니다.

- 256-bit 임의 토큰을 생성하고 DB에는 SHA-256 해시만 저장합니다.
- 원문 링크는 생성 직후 한 번만 표시합니다.
- 만료 시각은 현재 이후부터 최대 1년까지 설정할 수 있습니다.
- 링크를 폐기하면 즉시 접근할 수 없습니다.
- 첨부파일 다운로드는 링크 생성 시 별도로 허용한 경우에만 가능합니다.
- 공유 응답은 `no-store`와 `no-referrer` 정책을 사용합니다.

## 개발 시작

1. Spring Boot 3 + Java 21 프로젝트를 생성합니다.
2. 패키지명을 `com.aastudio`로 통일합니다.
3. 단일 데이터소스와 MyBatis 설정을 구성합니다.
4. 첫 화면은 대시보드형 Thymeleaf 템플릿으로 시작합니다.

## 실행과 검증

```powershell
.\gradlew.bat bootRun
```

기본 로컬 계정은 `admin / admin1234`이며 최초 실행 시 생성됩니다. 운영 전에 비밀번호를
변경해야 합니다.

```powershell
.\gradlew.bat clean test
```
