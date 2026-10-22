# 테이블 컬럼 인라인 수정

## 목적
- Properties에서 테이블 선택 시 하단 컬럼 상세 목록을 제거하고, 캔버스 테이블 더블클릭으로 컬럼을 수정한다.

## 분석 및 수용 기준
- Properties에는 선택 테이블 요약만 표시한다.
- 테이블을 더블클릭하면 테이블 옆 설정 레이어에 컬럼명·타입·코멘트 입력란이 표시된다.
- 저장 후 캔버스 컬럼 표시가 갱신된다.

## 변경 파일
- `db-modeling.html`: 설정 레이어에 Columns 편집 영역 추가.
- `db-modeling.js`: Properties 컬럼 목록 제거, 더블클릭 연결, 컬럼 값 반영.
- `app.css`: 컬럼 입력 행 스타일.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 컬럼 편집값을 DBML/DDL 원문에 재작성하는 저장 경로는 별도 보강이 필요하다.
