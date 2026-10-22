# ERD 관계 수 참조 오류 수정

## 목적
- 관계 수 제거 후 남은 `relationCount` 템플릿 참조로 ERD가 렌더링되지 않는 오류를 해결한다.

## 변경 파일
- `db-modeling.js`: 헤더 배지 참조 제거.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `rg -n 'relationCount|db-erd-relation-count' src/main/resources/static/js/db-modeling.js`: 결과 없음.
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 ERD 렌더링을 확인한다.
