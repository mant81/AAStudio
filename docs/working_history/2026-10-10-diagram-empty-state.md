# 다이어그램 빈 화면 안내

## 목적

- 노드와 연결선이 없는 다이어그램을 처음 열었을 때 사용자가 다음 작업을 알 수 있도록 안내 문구를 표시한다.

## 분석 및 수용 기준

- 캔버스가 비어 있으면 안내 카드가 표시된다.
- 도형, 텍스트, 연결선 등 콘텐츠를 추가하면 안내 카드가 숨겨진다.
- 다이어그램 전환, 초기화, 저장 상태 복원 후에도 빈 상태가 정확히 반영된다.
- 안내 영역은 다이어그램 저장 데이터에 포함되지 않고 편집 동작을 방해하지 않는다.

## 변경 파일

- `src/main/resources/templates/diagram.html`
  - 빈 캔버스 안내 카드 추가
- `src/main/resources/static/js/diagram.js`
  - 노드·연결선 존재 여부에 따른 안내 카드 표시 상태 동기화

## 검증

- `node --check src/main/resources/static/js/diagram.js`
- `git diff --check`
- `mvn test`: `mvn` 명령을 찾을 수 없어 실행하지 못했다. 저장소에 Maven Wrapper도 없다.

## 미해결 이슈 및 다음 작업

- 없음
