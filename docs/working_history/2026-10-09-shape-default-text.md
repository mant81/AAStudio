# 도형 기본 문구 제거

## 변경 내용

- 도형 툴바에서 새 도형을 그릴 때 자동으로 표시되던 한글 도형명과 `Shape` 문구를 제거했다.
- 도형의 기본 형태와 아이콘 기능은 유지했다.
- 속성 패널에서 사용자가 도형 이름을 입력하면 입력한 문구는 도형 내부에 표시된다.

## 검증

- `node --check src/main/resources/static/js/diagram.js`
- `git diff --check`
