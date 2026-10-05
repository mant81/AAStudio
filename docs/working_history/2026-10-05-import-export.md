# Diagram import and export actions

## 변경 내용

- 헤더에서 History를 제거
- Share 왼쪽에 Import와 Export 추가
- Import: JSON 파일을 읽어 다이어그램 상태 복원
- Export: JSON, JPG, PNG 지원
- PDF: 캔버스 JPEG를 포함한 PDF 파일로 직접 다운로드

## 내보내기 보완

- 캔버스 중앙 정렬·확대 transform을 제거한 전체 작업 영역으로 렌더링
- 노드 bounds를 포함해 이미지가 잘리지 않도록 크기 계산
- PDF 파일명에 현재 다이어그램명 사용
- 내보내기용 CSS의 상대 폰트 경로를 절대 URL로 변환해 Material Symbols/Remix 아이콘이 텍스트로 출력되지 않도록 보완
- Material Symbols/Remix 폰트 파일을 export SVG에 data URL로 직접 내장

## 검증

- `node --check src/main/resources/static/js/diagram.js` 통과
- `git diff --check` 통과

## 미해결 이슈

- PDF 파일 저장은 브라우저 인쇄 대화상자의 PDF 저장 기능을 사용한다.
