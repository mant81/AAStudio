# AAStudio

AAStudio는 `docs/`의 설계 문서를 바탕으로 만든 로컬 분석 워크스테이션 골격입니다.

## 개요

이 저장소는 AAStudio의 개발 결과를 정리하고, 로컬 환경에서 분석과 실행을 이어갈 수 있도록 구성한 문서와 코드 묶음입니다.

## 진행 결과

- `CLI` 명령 표면은 대부분의 성공 경로와 런타임 경로까지 검증했습니다.
- `tests/test_smoke.py`는 `83 tests OK`까지 통과했습니다.
- 목표 완료 처리도 마쳤습니다.

## 추가 확인 소요

- 누적 사용량: `3,598,036` tokens
- 경과 시간: 약 `3시간 25분`

## 실행 방법

1. 터미널을 열고 저장소 루트로 이동합니다.
2. 아래 명령을 순서대로 그대로 실행합니다.

```bash
python -m pip install -e .
python -m aastudio init-db
python -m aastudio create-project 예시프로젝트 . --description "설계 문서 기반 프로젝트"
python -m aastudio list-projects
```

3. `init-db`는 처음 한 번만 실행합니다.
4. `create-project`는 새 프로젝트를 등록할 때 실행합니다.
   - `예시프로젝트`는 프로젝트 이름입니다.
   - `.`은 현재 폴더를 뜻합니다.
   - `--description`은 설명을 적는 곳입니다.
5. `list-projects`는 등록된 프로젝트를 확인할 때 실행합니다.
