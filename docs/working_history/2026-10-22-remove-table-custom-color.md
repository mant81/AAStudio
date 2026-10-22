# 테이블 설정 Custom 색상 제거

## 목적
- 테이블 설정에서 사용자 지정 색상 입력을 제거한다.

## 분석 및 수용 기준
- 설정 레이어에는 테이블명과 지정된 색상 팔레트만 보인다.
- 팔레트 선택 후 저장 시 해당 헤더 색상이 유지된다.

## 변경 파일
- `db-modeling.html`: Custom 및 색상 코드 입력 삭제.
- `db-modeling.js`: 선택 색상을 메모리에 보관해 미리보기와 저장에 사용.
- `fragments/layout.html`: JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저 화면에서 팔레트 선택 및 저장을 확인한다.
