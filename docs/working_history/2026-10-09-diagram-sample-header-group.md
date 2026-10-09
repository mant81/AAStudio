# 샘플 영역 헤더 그룹화

## 변경 내용

- `diagram-sample-button`을 내보내기 그룹과 분리된 샘플 전용 컨테이너로 배치했다.
- 샘플 영역 제목과 구분선을 추가해 샘플 기능임을 명확하게 표시했다.
- 기존 버튼 ID와 JavaScript 동작은 유지했다.

## 검증

- 템플릿의 샘플 버튼 ID와 JavaScript selector 일치 확인
- `git diff --check`
