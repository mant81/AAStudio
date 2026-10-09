# H2 파일 DB 재시작 오류 수정

## 원인

파일 기반 H2에서 `spring.sql.init.mode=always`가 시작할 때마다 `schema.sql`과 `data.sql`을 실행했다. 기존 테이블과 기본 데이터가 이미 존재해 테이블 생성 및 기본 데이터 삽입이 중복으로 실패했다.

## 변경 내용

- `schema.sql`의 모든 테이블 생성문에 `IF NOT EXISTS`를 적용했다.
- `data.sql`의 기본 데이터 삽입문에 `INSERT IGNORE`를 적용해 재시작 시 중복 키 오류를 방지했다.
- 기존 파일 DB와 사용자 데이터는 삭제하지 않았다.

## 검증

- H2 2.3.232 MariaDB 모드에서 스키마와 데이터 스크립트를 2회 연속 실행
- 두 번째 실행 후 기본 `metric_card` 데이터 4건 유지 확인
- `git diff --check` 통과
