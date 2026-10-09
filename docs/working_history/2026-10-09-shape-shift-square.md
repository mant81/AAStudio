# 도형 Shift 정사각형 그리기

## 변경 내용

- 도형을 그리는 동안 `Shift` 키를 누르면 가로·세로 길이를 동일하게 유지한다.
- 시작점에서 드래그한 방향은 유지하면서 가장 긴 축을 기준으로 정사각형을 만든다.
- 그룹 박스, 연결선, 펜 도구에는 적용하지 않는다.

## 검증

- `node --check src/main/resources/static/js/diagram.js`
- `git diff --check`
