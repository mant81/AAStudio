# 다이어그램 H2 상태 저장 보강

## 목적

- 다이어그램을 수정한 직후 새로고침해도 H2 파일에 상태가 남도록 저장 시점을 보강한다.

## 분석 및 변경

- H2 파일 `data/aastudio.mv.db`와 `diagram_document` 저장 API를 확인했다.
- 기존 저장은 1.2초 지연 후 실행되어 그 전에 페이지를 떠나면 요청이 취소될 수 있었다.
- `pagehide`와 `visibilitychange`에서 대기 중인 상태를 `keepalive` 요청으로 즉시 저장하도록 변경했다.
- 상태 조회 요청과 API 응답에 캐시 방지(`no-store`)를 적용해 이전 빈 응답이 재사용되지 않도록 했다.
- 상태 조회를 `Map`/`Clob` 변환에 의존하지 않고 `state_json` 문자열을 직접 조회하도록 변경했다.
- 저장 시 기존 문서 선조회 대신 UPDATE 결과 건수를 기준으로 INSERT를 수행하도록 변경했다.

## 검증

- `node --check src/main/resources/static/js/diagram.js`
- `git diff --check`
- `mvn test`: Maven 명령이 설치되지 않아 실행하지 못했다.
- 실행 중인 애플리케이션의 API 왕복 검증은 서버 재시작이 필요하다.

## 미해결 이슈

- 실행 중인 Maven 환경이 없어 브라우저 새로고침을 포함한 통합 테스트는 실행하지 못했다.
