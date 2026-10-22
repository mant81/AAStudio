# 테이블 설정과 컬럼 수정 모달 분리

## 목적
- 기존 테이블 설정 동작을 유지하면서 Properties의 수정 아이콘에 컬럼 수정 모달을 제공한다.

## 변경 파일
- `db-modeling.html`: 컬럼 전용 중앙 모달 추가.
- `db-modeling.js`: 수정 아이콘의 컬럼 모달 열기와 저장 처리, 기존 설정 레이어에서 컬럼 입력 제거.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 컬럼 수정값을 DBML/DDL 원문에 재작성하는 저장 경로는 별도 보강이 필요하다.
