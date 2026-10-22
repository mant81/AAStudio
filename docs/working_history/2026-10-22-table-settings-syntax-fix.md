# 테이블 설정 구문 오류 수정

## 목적
- `db-modeling.js`의 구문 오류로 스키마 화면 스크립트 전체가 중단되는 문제를 해결한다.

## 분석 및 수용 기준
- 테이블 설정의 이름 변경 코드가 유효한 JavaScript여야 한다.
- 테이블 이름과 헤더 색상 설정이 저장 경로에 반영되어야 한다.

## 변경 파일
- `src/main/resources/static/js/db-modeling.js`: 잘못된 정규식 구문 수정, 테이블명 변경 시 참조 및 색상 레이아웃 키 갱신, 드래그 시 색상 유지.
- `src/main/resources/templates/fragments/layout.html`: 변경된 스크립트의 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 변환 경고만 출력).
- 브라우저 수동 검증은 수행하지 못했다.

## 미해결 이슈와 다음 작업
- DDL 입력의 테이블명 변경은 현재 모달에서 지원하지 않는다. 해당 형식에서도 이름 변경이 필요하면 파서와 편집 경로를 별도로 확장한다.
