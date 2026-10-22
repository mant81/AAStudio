# 캔버스 도구 전환 토스트

## 목적
- Space로 이동·선택 도구가 바뀔 때 화면 하단에 짧은 알림을 보여준다.

## 분석 및 수용 기준
- 두 캔버스에서 Space 누름에 `이동 모드`, 해제에 `선택 모드` 토스트가 표시된다.
- 키 반복 입력은 토스트를 계속 재생성하지 않는다.

## 변경 파일
- `diagram.js`, `db-modeling.js`: 도구 전환 토스트 표시 및 타이머 관리.
- `app.css`: 화면 하단 알약형 토스트 스타일.
- `fragments/layout.html`: CSS/JS 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/diagram.js`: 통과.
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 토스트 위치·지속 시간·Space 전환을 확인한다.
