# AAStudio SQLite 테이블 초안

## 1. 목적

이 문서는 AAStudio의 로컬 저장 구조를 위한 SQLite 테이블 초안을 정의한다.

목표는 프로젝트, 소스 분석 결과, 소스코드 점검, 보안점검, DB 모델링, 다이어그램, API 명세, Wiki, WBS, 파일 첨부, 접근 로그를 한 저장소에서 관리하는 것이다.

## 2. 설계 원칙

- 메타데이터는 SQLite에 저장한다.
- 첨부 파일 원본은 파일 시스템에 저장한다.
- Wiki는 버전 이력을 남긴다.
- 소스코드 점검과 보안점검은 분리해서 저장한다.
- 외부 readonly 공유를 위해 접근 권한과 로그를 남긴다.

## 3. 테이블 목록

- `project`
- `project_workspace`
- `project_dashboard`
- `project_stage_assignment`
- `project_stage_history`
- `source_scan`
- `source_code_scan`
- `security_scan`
- `security_issue`
- `db_model`
- `db_table`
- `db_column`
- `db_relation`
- `diagram`
- `api_group`
- `api_endpoint`
- `api_schema`
- `api_test_case`
- `api_test_result`
- `api_auth_profile`
- `sample_dataset`
- `sample_dataset_item`
- `wiki_page`
- `wiki_page_version`
- `attachment`
- `wbs_item`
- `access_log`

## 4. 테이블 초안

### 4.1 project

- `id`
- `name`
- `description`
- `root_path`
- `created_at`
- `updated_at`

### 4.2 project_workspace

- `id`
- `project_id`
- `workspace_name`
- `workspace_type`
- `is_active`
- `created_at`

### 4.3 project_dashboard

- `id`
- `project_id`
- `current_stage`
- `summary`
- `updated_at`

### 4.4 project_stage_assignment

- `id`
- `project_id`
- `stage_name`
- `assignee_name`
- `assignee_title`
- `assignee_phone`
- `assignee_email`
- `related_item_type`
- `related_item_id`
- `status`
- `created_at`

### 4.5 project_stage_history

- `id`
- `project_id`
- `stage_name`
- `before_status`
- `after_status`
- `changed_by`
- `change_note`
- `created_at`

### 4.6 source_scan

- `id`
- `project_id`
- `scan_path`
- `language`
- `framework`
- `status`
- `created_at`

### 4.7 source_code_scan

- `id`
- `project_id`
- `source_scan_id`
- `file_path`
- `rule_name`
- `severity`
- `summary`
- `detail`
- `line_from`
- `line_to`
- `confidence`
- `created_at`

### 4.8 security_scan

- `id`
- `project_id`
- `source_scan_id`
- `scan_type`
- `policy_name`
- `status`
- `created_at`

### 4.9 security_issue

- `id`
- `security_scan_id`
- `category`
- `title`
- `description`
- `file_path`
- `line_from`
- `line_to`
- `risk_level`
- `evidence`
- `recommendation`
- `created_at`

### 4.10 db_model

- `id`
- `project_id`
- `name`
- `description`
- `created_at`
- `updated_at`

### 4.11 db_table

- `id`
- `db_model_id`
- `name`
- `description`
- `primary_key`
- `created_at`

### 4.12 db_column

- `id`
- `db_table_id`
- `name`
- `data_type`
- `nullable`
- `default_value`
- `is_unique`
- `is_indexed`
- `description`

### 4.13 db_relation

- `id`
- `db_model_id`
- `from_table_id`
- `to_table_id`
- `relation_type`
- `from_column`
- `to_column`
- `description`

### 4.14 diagram

- `id`
- `project_id`
- `diagram_type`
- `name`
- `payload_json`
- `created_at`
- `updated_at`

### 4.15 api_group

- `id`
- `project_id`
- `name`
- `description`
- `created_at`

### 4.16 api_endpoint

- `id`
- `api_group_id`
- `method`
- `path`
- `summary`
- `auth_required`
- `request_schema_id`
- `response_schema_id`
- `status_code`
- `created_at`

### 4.17 api_schema

- `id`
- `project_id`
- `name`
- `schema_type`
- `payload_json`
- `created_at`

### 4.18 api_auth_profile

- `id`
- `project_id`
- `name`
- `auth_type`
- `config_json`
- `is_default`
- `created_at`

### 4.19 api_test_case

- `id`
- `project_id`
- `api_endpoint_id`
- `auth_profile_id`
- `request_json`
- `expected_status_code`
- `expected_response_json`
- `sample_dataset_id`
- `created_at`

### 4.20 api_test_result

- `id`
- `api_test_case_id`
- `executed_at`
- `request_snapshot_json`
- `response_snapshot_json`
- `status_code`
- `result_status`
- `message`

### 4.21 sample_dataset

- `id`
- `project_id`
- `name`
- `description`
- `is_shared`
- `created_at`

### 4.22 sample_dataset_item

- `id`
- `sample_dataset_id`
- `item_key`
- `item_value_json`
- `created_at`

### 4.23 wiki_page

- `id`
- `project_id`
- `title`
- `slug`
- `content`
- `tags`
- `created_by`
- `created_at`
- `updated_at`

### 4.24 wiki_page_version

- `id`
- `wiki_page_id`
- `version_no`
- `content_snapshot`
- `change_note`
- `created_by`
- `created_at`

### 4.25 attachment

- `id`
- `project_id`
- `wiki_page_id`
- `original_name`
- `stored_name`
- `file_path`
- `mime_type`
- `file_size`
- `file_hash`
- `created_at`

### 4.26 wbs_item

- `id`
- `project_id`
- `parent_id`
- `title`
- `description`
- `status`
- `priority`
- `linked_type`
- `linked_id`
- `created_at`
- `updated_at`

### 4.27 access_log

- `id`
- `project_id`
- `actor`
- `action`
- `target_type`
- `target_id`
- `ip_address`
- `created_at`

## 5. 관계 요약

- `project`는 모든 작업의 루트다.
- `project_workspace`는 프로젝트별 활성 작업 영역을 관리한다.
- `project_dashboard`는 프로젝트의 현재 상태를 요약한다.
- `project_stage_assignment`는 개발 단계별 담당자 정보를 관리한다.
- `project_stage_history`는 단계 상태 변경 이력을 남긴다.
- `api_auth_profile`는 공통 인증 설정을 저장한다.
- `api_test_case`와 `api_test_result`는 실제 호출 테스트를 저장한다.
- `sample_dataset`과 `sample_dataset_item`은 DB 샘플 데이터를 유지한다.
- `project`는 여러 `source_scan`, `db_model`, `diagram`, `api_group`, `wiki_page`, `wbs_item`을 가진다.
- `source_scan`은 `source_code_scan`과 `security_scan`의 기준이 된다.
- `wiki_page`는 여러 `wiki_page_version`을 가진다.
- `wiki_page`는 여러 `attachment`를 가질 수 있다.
- `wbs_item`은 상하위 계층을 가진다.

## 6. 저장 정책

- Wiki 저장 시 항상 `wiki_page_version`을 추가한다.
- 첨부 파일은 SQLite가 아니라 파일 시스템에 둔다.
- 분석 결과는 재생성 가능하도록 원본과 추론 결과를 분리 저장한다.
- 보안점검은 코드 흐름 기반 판단과 외부 솔루션 연동 결과를 분리한다.

## 7. 다음 단계

이 초안을 기준으로 다음 문서를 추가하면 된다.

1. 화면 구성 문서
2. 분석 흐름도
3. 보안점검 상세 규칙 문서
4. Wiki 버전 정책 문서
