# ERD 오버레이 레이아웃 수정

## 분석

- DBML 편집기는 `secondary-sidebar`의 원래 왼쪽 위치를 유지해야 한다.
- ERD는 편집기와 별도의 고정 폭 flex 영역이 아니라 캔버스 위에 표시되는 오버레이여야 한다.
- 기존 구현은 `db-erd-view`와 `erd-canvas`를 일반 flex 자식으로 배치해 캔버스 폭 계산과 카드 표시가 깨질 수 있었다.

## 변경

- `db-erd-view`를 `db-modeling-workspace` 전체를 덮는 absolute 오버레이로 변경했다.
- 오버레이 내부의 `erd-canvas`와 `canvas-pan-area`는 캔버스 폭을 100% 사용하도록 정리했다.
- 에디터 모드 전환 로직이 자동으로 편집기를 숨기지 않도록 수정해 왼쪽 Monaco 편집기를 계속 표시한다.
- CSS 캐시 버전을 갱신했다.

## 검증

- `node --check src/main/resources/static/js/db-modeling.js` 통과
- `git diff --check` 통과
- `gradlew.bat test`는 Gradle 실행이 장시간 출력 없이 대기하여 완료 결과를 확인하지 못했다.

## 추가 변경

- ERD 창을 캔버스 우측 absolute 오버레이로 열고 닫도록 토글 버튼을 추가했다.
- 토글 버튼은 Remix Icon 화살표를 사용하고, ERD 창 상태에 따라 방향과 접근성 레이블을 갱신한다.
- ERD 오버레이를 닫아도 캔버스 배경이 사라지지 않도록 기본 캔버스 레이어를 분리했다.
- 초기 HTML에도 캔버스 표시와 ERD 닫힘 상태를 명시해 JavaScript 초기화 시점에 화면이 비지 않도록 보강했다.
- 기본 캔버스 배경을 실제 `<canvas>`로 변경하고, 화면 크기와 기기 픽셀 비율에 맞춰 격자를 다시 그리도록 했다.
- 초기 측정값이 0인 브라우저 레이아웃에서도 보이도록 CSS 배경색과 최초 프레임 재렌더링을 추가했다.
- 다이어그램의 프로퍼티 패널과 동일한 absolute 우측 패널 및 `w-0/w-[520px]` 토글 방식으로 ERD 오버레이를 정리했다.
- 동적으로 추가되는 Tailwind arbitrary width에 의존하지 않도록 `db-erd-panel-open` 전용 CSS를 추가하고, 패널을 연 직후 ERD를 다시 렌더링하도록 했다.
- 기본 캔버스에 테이블 카드와 컬럼을 직접 그려 패널이 닫혀 있어도 ERD 테이블이 보이도록 했다.
