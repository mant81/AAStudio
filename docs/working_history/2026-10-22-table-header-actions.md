# 테이블 헤더 표시 간소화

## 목적
- ERD 테이블 헤더의 관계 수 숫자를 제거하고 설정 아이콘을 작게 표시한다.

## 변경 파일
- `db-modeling.js`: 관계 수 배지와 계산 제거.
- `app.css`: 설정 버튼과 아이콘 축소, 미사용 배지 스타일 제거.
- `fragments/layout.html`: 정적 리소스 캐시 버전 갱신.

## 검증
- `node --check src/main/resources/static/js/db-modeling.js`: 통과.
- `git diff --check`: 통과(기존 줄바꿈 경고만 출력).

## 미해결 이슈와 다음 작업
- 브라우저에서 헤더 표시를 확인한다.
