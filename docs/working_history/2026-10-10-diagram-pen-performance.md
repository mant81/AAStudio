# 다이어그램 펜 입력 성능 개선

## 목적
- `/diagram` 펜 그리기 중 stroke가 길어질수록 느려지는 현상을 개선한다.

## 원인
- 포인터 이동마다 전체 점 배열을 다시 순회해 곡선 경로 문자열을 재생성했다.
- stroke 길이에 따라 경로 생성 비용이 누적되는 구조였다.

## 변경
- `src/main/resources/static/js/diagram.js`
  - 펜 시작 시 경로 문자열을 저장
  - 이후 입력점은 기존 경로에 `L` 세그먼트로 증분 추가
  - 기존 저장 구조와 `points` 데이터는 유지

## 검증
- `node --check src/main/resources/static/js/diagram.js`: 통과
- `git diff --check`: 통과

## 오픈 이슈
- 브라우저에서 장시간 stroke와 펜/터치 입력을 시각적으로 확인할 필요가 있다.
