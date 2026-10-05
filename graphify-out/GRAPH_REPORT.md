# Graph Report - AAStudio  (2026-10-05)

## Corpus Check
- 23 files · ~42,975 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 49 file(s) not represented in the graph (top: .ttf 33, .prefs 5, (none) 4)

## Summary
- 175 nodes · 195 edges · 23 communities (14 shown, 9 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac248e99`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AAStudio 제품 요구사항 정의서(PRD)
- DashboardService
- AAStudio 개발 기준
- 펜 옵션 기본 색상 변경
- ViewController
- DESIGN.md
- Image border property fix
- AAStudio Core
- AAStudio 내부 개발 기준 이관
- 12. 하네스 기반 아키텍처 및 개발 방식
- Current group picker
- Diagram toolbar icon alignment
- AAStudio 개발 지침
- AastudioCoreApplication.java
- LayoutModelFactory.java
- 6.2 DB 모델링
- 6.3 API 정의서
- 6.4 WIKI
- working_history/README.md
- com.aastudio:aastudio-core

## God Nodes (most connected - your core abstractions)
1. `AAStudio 제품 요구사항 정의서(PRD)` - 17 edges
2. `DashboardService` - 13 edges
3. `펜 옵션 기본 색상 변경` - 12 edges
4. `DashboardMapper` - 11 edges
5. `ViewController` - 10 edges
6. `AAStudio 개발 기준` - 9 edges
7. `AAStudio Core` - 7 edges
8. `3. 표준 작업 흐름` - 7 edges
9. `Image border property fix` - 7 edges
10. `12. 하네스 기반 아키텍처 및 개발 방식` - 6 edges

## Surprising Connections (you probably didn't know these)
- `ViewController` --references--> `DashboardService`  [EXTRACTED]
  src/main/java/com/aastudio/core/web/ViewController.java → src/main/java/com/aastudio/core/dashboard/service/DashboardService.java
- `DashboardService` --references--> `DashboardMapper`  [EXTRACTED]
  src/main/java/com/aastudio/core/dashboard/service/DashboardService.java → src/main/java/com/aastudio/core/dashboard/mapper/DashboardMapper.java

## Import Cycles
- None detected.

## Communities (23 total, 9 thin omitted)

### Community 0 - "AAStudio 제품 요구사항 정의서(PRD)"
Cohesion: 0.07
Nodes (26): 10. 성공 지표, 11. 오픈 이슈, 1. 문서 개요, 2. 제품 목표, 3. 대상 사용자, 4. 제품 범위, 5. 정보 구조, 6.1 다이어그램 (+18 more)

### Community 2 - "AAStudio 개발 기준"
Cohesion: 0.11
Nodes (18): 1. 문서와 기준의 우선순위, 2. 현재 프로젝트 기준선, 3. 표준 작업 흐름, 4. 역할별 검토 관점, 5. AAStudio 통합 QA 체크리스트, 6. 기본 검증 명령, 7. 작업 이력 형식, 8. 외부 기준 이관 완료 (+10 more)

### Community 3 - "펜 옵션 기본 색상 변경"
Cohesion: 0.15
Nodes (12): 검증, 미해결 이슈, 변경 사항, 추가 변경: 선택 모드 선 이동, 추가 변경: 이미지 Blob 첨부, 추가 변경: 지우개 모드 커서 고정, 추가 변경: 지우개 사용 중 펜 선 이동 방지, 추가 변경: 지우개 옵션 UI 단순화 (+4 more)

### Community 5 - "DESIGN.md"
Cohesion: 0.25
Nodes (7): Brand & Style, Colors, Components, Elevation & Depth, Layout & Spacing, Shapes, Typography

### Community 6 - "Image border property fix"
Cohesion: 0.25
Nodes (7): Changed files, Follow-up, Image border property fix, Open issues / next work, Purpose, Scope and decision, Verification

### Community 7 - "AAStudio Core"
Cohesion: 0.25
Nodes (7): AAStudio Core, UI 규칙, 구조 포인트, 기술 스택, 실행 설정, 원본 화면 기준, 화면

### Community 8 - "AAStudio 내부 개발 기준 이관"
Cohesion: 0.29
Nodes (6): AAStudio 내부 개발 기준 이관, 검증, 목적, 미해결 이슈와 다음 작업, 변경 파일, 분석 결과

### Community 9 - "12. 하네스 기반 아키텍처 및 개발 방식"
Cohesion: 0.33
Nodes (6): 12.1 프로젝트 구조, 12.2 표준 작업 단계, 12.3 에이전트 역할, 12.4 품질 게이트, 12.5 작업 이력 규칙, 12. 하네스 기반 아키텍처 및 개발 방식

### Community 10 - "Current group picker"
Cohesion: 0.33
Nodes (5): Current group picker, 검증, 목적, 미해결 이슈, 변경 내용

### Community 11 - "Diagram toolbar icon alignment"
Cohesion: 0.33
Nodes (5): Diagram toolbar icon alignment, 검증, 목적, 미해결 이슈, 변경 파일

### Community 12 - "AAStudio 개발 지침"
Cohesion: 0.40
Nodes (4): AAStudio 개발 지침, 기본 원칙, 완료 기준, 작업 흐름

### Community 15 - "6.2 DB 모델링"
Cohesion: 0.50
Nodes (4): 6.2 DB 모델링, 목적, 요구사항, 입력 예시

### Community 16 - "6.3 API 정의서"
Cohesion: 0.50
Nodes (4): 6.3 API 정의서, payload 처리 흐름, 목적, 요구사항

### Community 17 - "6.4 WIKI"
Cohesion: 0.50
Nodes (4): 6.4 WIKI, 권장 문서 템플릿, 목적, 요구사항

## Knowledge Gaps
- **98 isolated node(s):** `com.aastudio:aastudio-core`, `기본 원칙`, `작업 흐름`, `완료 기준`, `Brand & Style` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 114 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AAStudio 제품 요구사항 정의서(PRD)` connect `AAStudio 제품 요구사항 정의서(PRD)` to `6.3 API 정의서`, `12. 하네스 기반 아키텍처 및 개발 방식`, `6.4 WIKI`, `6.2 DB 모델링`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `com.aastudio:aastudio-core`, `기본 원칙`, `작업 흐름` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AAStudio 제품 요구사항 정의서(PRD)` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Why does `DashboardService` connect `DashboardService` to `ViewController`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `AAStudio 개발 기준` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `12. 하네스 기반 아키텍처 및 개발 방식` connect `12. 하네스 기반 아키텍처 및 개발 방식` to `AAStudio 제품 요구사항 정의서(PRD)`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._