# DB 모델링 에디터 및 DDL 자동 ERD

## 목적
- `/db-modeling`에서 스키마를 직접 작성하고, 실제 DDL을 붙여넣어 ERD를 자동 생성한다.

## 구현
- 에디터 기본 모드와 ERD 보기 모드를 추가했다.
- DBML `Table`/`Ref` 문법과 `CREATE TABLE` DDL을 브라우저에서 자동 판별한다.
- 유효한 DDL 입력이 감지되면 ERD 보기로 자동 전환한다.
- 인라인 DBML `ref`와 스키마/대괄호로 감싼 SQL 식별자를 처리한다.
- 보조 사이드바의 접기/펼치기, 그룹 접기, 테이블 검색, 새 테이블 추가 동작을 연결했다.
- 테이블, 컬럼 타입, PK, FK를 추출해 좌측 목록·ERD 노드·관계선에 반영한다.
- 마지막 입력 스키마를 `localStorage`에 저장해 새로고침 후 복원한다.
- 사용자 입력은 HTML 이스케이프 후 화면에 렌더링한다.

## 변경 파일
- `src/main/resources/templates/db-modeling.html`
- `src/main/resources/templates/fragments/layout.html`
- `src/main/resources/static/js/db-modeling.js`

## 검증
- `node --check src/main/resources/static/js/db-modeling.js` 통과
- `git diff --check` 통과
- 실제 DDL 샘플을 Node 실행으로 검증: 테이블 2개, PK 2개, FK 1개 추출
- 실제 DBML 샘플을 Node 실행으로 검증: 테이블 2개, PK 2개, FK 1개 추출
- 실행 중인 `/db-modeling`에서 최신 템플릿·스크립트 제공 확인
- Chrome headless smoke test에서 ERD 노드 생성 및 브라우저 런타임 오류 없음 확인
- Chrome DevTools 자동화로 실제 textarea에 DDL을 주입해 검증: 에디터 숨김, ERD 표시, 테이블 2개, 관계선 1개 생성
- Chrome DevTools 자동화로 사이드바 접기, 검색 결과 1건, 새 테이블 추가 및 에디터 포커스를 검증

## 미해결
- 실제 브라우저에서 사용자가 DDL을 붙여넣는 상호작용은 수동 확인이 필요하다.
- 현재 Maven 실행 파일이 없어 서버 통합 테스트는 실행하지 못했다.
