# H2 파일 DB 시작 오류 수정

## 원인

H2 2.3.232에서 `AUTO_SERVER=TRUE`와 `DB_CLOSE_ON_EXIT=FALSE`를 함께 사용하면 데이터소스 연결 생성 단계에서 `Feature not supported` 오류가 발생한다.

## 조치

파일 DB와 자동 서버 기능은 유지하고 `DB_CLOSE_ON_EXIT=FALSE` 옵션을 제거했다.

변경된 URL:

`jdbc:h2:file:./data/aastudio;MODE=MariaDB;AUTO_SERVER=TRUE`

## 검증

- `git diff --check` 통과
- 애플리케이션은 변경된 설정으로 재시작 필요
