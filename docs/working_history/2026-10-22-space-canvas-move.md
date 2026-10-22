# 캔버스 임시 이동 키 Space 통일

## 목적
- 다이어그램과 DB 모델링의 임시 캔버스 이동 키를 Alt에서 Space로 변경한다.

## 분석 및 수용 기준
- Space를 누르는 동안 Move 아이콘이 활성화되고 드래그로 캔버스를 이동한다.
- Space를 놓으면 Pointer가 활성화된다.
- 텍스트 입력 중 Space는 정상적으로 입력된다.

## 변경 파일
- `diagram.js`: Space 키로 Move 선택, 해제 시 Pointer 복귀, Alt 드래그 이동 제거.
- `db-modeling.js`: Space 키로 Move 선택 및 팬 처리, 해제 시 Pointer 복귀.
- `app.css`: Space 이동 커서 스타일.
- `fragments/layout.html`: CSS/JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/diagram.js`: 통과.
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 두 화면의 Space+드래그 및 입력창 Space 동작을 확인한다.
