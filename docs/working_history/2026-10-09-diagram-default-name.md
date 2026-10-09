# 다이어그램 기본 이름 변경

## 변경 내용

- 최초 다이어그램 기본 이름을 `다이어그램 1`로 변경했다.
- 이름을 입력하지 않고 새 다이어그램을 추가하면 `다이어그램 2`, `다이어그램 3`처럼 번호를 붙인다.
- 기존에 사용자가 직접 지정한 이름은 변경하지 않는다.

## 변경 파일

- `src/main/resources/templates/diagram.html`
- `src/main/java/com/aastudio/core/web/ViewController.java`
- `src/main/resources/static/js/diagram.js`

## 검증

- `node --check src/main/resources/static/js/diagram.js`
- `git diff --check`
