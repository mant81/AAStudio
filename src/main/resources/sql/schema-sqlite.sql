CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    enabled VARCHAR(1) NOT NULL DEFAULT 'Y'
);

CREATE TABLE IF NOT EXISTS project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    root_path VARCHAR(1000),
    current_stage VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_workspace (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    workspace_name VARCHAR(200) NOT NULL,
    workspace_type VARCHAR(50) NOT NULL,
    is_active VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_workspace_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_dashboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL UNIQUE,
    summary VARCHAR(2000),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dashboard_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS code_group (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_code VARCHAR(100) NOT NULL UNIQUE,
    group_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    enabled VARCHAR(1) NOT NULL DEFAULT 'Y'
);

CREATE TABLE IF NOT EXISTS source_scan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    scan_path VARCHAR(1000) NOT NULL,
    language VARCHAR(100),
    framework VARCHAR(100),
    file_count INTEGER NOT NULL DEFAULT 0,
    code_issue_count INTEGER NOT NULL DEFAULT 0,
    security_issue_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'READY',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_source_scan_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source_code_scan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    source_scan_id BIGINT,
    file_path VARCHAR(1000),
    rule_name VARCHAR(200),
    severity VARCHAR(30),
    summary VARCHAR(1000),
    detail VARCHAR(1000000),
    line_from INTEGER,
    line_to INTEGER,
    confidence DECIMAL(5, 2),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    review_note VARCHAR(2000),
    llm_explanation VARCHAR(1000000),
    llm_model VARCHAR(200),
    llm_reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_code_scan_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_code_scan_source FOREIGN KEY (source_scan_id) REFERENCES source_scan(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS security_issue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    source_scan_id BIGINT,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description VARCHAR(1000000),
    file_path VARCHAR(1000),
    risk_level VARCHAR(30),
    evidence VARCHAR(1000000),
    recommendation VARCHAR(1000000),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    review_note VARCHAR(2000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_security_issue_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_security_issue_source FOREIGN KEY (source_scan_id) REFERENCES source_scan(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS security_scan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    source_scan_id BIGINT,
    scan_type VARCHAR(50) NOT NULL,
    policy_name VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'READY',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_security_scan_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_security_scan_source FOREIGN KEY (source_scan_id) REFERENCES source_scan(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS db_model (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    ddl_text VARCHAR(1000000),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_db_model_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS db_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    db_model_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    primary_key_name VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_db_table_model FOREIGN KEY (db_model_id) REFERENCES db_model(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS db_column (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    db_table_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    data_type VARCHAR(100) NOT NULL,
    nullable VARCHAR(1) NOT NULL DEFAULT 'Y',
    default_value VARCHAR(500),
    is_primary VARCHAR(1) NOT NULL DEFAULT 'N',
    is_unique VARCHAR(1) NOT NULL DEFAULT 'N',
    is_indexed VARCHAR(1) NOT NULL DEFAULT 'N',
    description VARCHAR(1000),
    CONSTRAINT fk_db_column_table FOREIGN KEY (db_table_id) REFERENCES db_table(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS db_relation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    db_model_id BIGINT NOT NULL,
    from_table_id BIGINT NOT NULL,
    to_table_id BIGINT NOT NULL,
    relation_type VARCHAR(30) NOT NULL,
    from_column VARCHAR(200) NOT NULL,
    to_column VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    CONSTRAINT fk_db_relation_model FOREIGN KEY (db_model_id) REFERENCES db_model(id) ON DELETE CASCADE,
    CONSTRAINT fk_db_relation_from FOREIGN KEY (from_table_id) REFERENCES db_table(id) ON DELETE CASCADE,
    CONSTRAINT fk_db_relation_to FOREIGN KEY (to_table_id) REFERENCES db_table(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diagram (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    diagram_type VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    payload_json VARCHAR(1000000),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_diagram_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_endpoint (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    api_group_id BIGINT,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    summary VARCHAR(500),
    auth_required VARCHAR(1) NOT NULL DEFAULT 'N',
    request_schema VARCHAR(1000000),
    response_schema VARCHAR(1000000),
    request_schema_id BIGINT,
    response_schema_id BIGINT,
    status_code INTEGER DEFAULT 200,
    source_type VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_api_endpoint_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_group (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_api_group_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_schema (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    schema_type VARCHAR(30) NOT NULL,
    payload_json VARCHAR(1000000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_api_schema_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_auth_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    auth_type VARCHAR(30) NOT NULL,
    config_json VARCHAR(1000000),
    is_default VARCHAR(1) NOT NULL DEFAULT 'N',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_api_auth_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sample_dataset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    payload_json VARCHAR(1000000),
    is_shared VARCHAR(1) NOT NULL DEFAULT 'N',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sample_dataset_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sample_dataset_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sample_dataset_id BIGINT NOT NULL,
    item_key VARCHAR(200) NOT NULL,
    item_value_json VARCHAR(1000000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dataset_item_dataset FOREIGN KEY (sample_dataset_id) REFERENCES sample_dataset(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_test_case (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    api_endpoint_id BIGINT NOT NULL,
    auth_profile_id BIGINT,
    name VARCHAR(200) NOT NULL,
    request_json VARCHAR(1000000),
    expected_status_code INTEGER NOT NULL DEFAULT 200,
    expected_response_json VARCHAR(1000000),
    sample_dataset_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_test_case_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_case_endpoint FOREIGN KEY (api_endpoint_id) REFERENCES api_endpoint(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_case_auth FOREIGN KEY (auth_profile_id) REFERENCES api_auth_profile(id) ON DELETE SET NULL,
    CONSTRAINT fk_test_case_dataset FOREIGN KEY (sample_dataset_id) REFERENCES sample_dataset(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS api_test_result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_test_case_id BIGINT NOT NULL,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_snapshot_json VARCHAR(1000000),
    response_snapshot_json VARCHAR(1000000),
    status_code INTEGER,
    result_status VARCHAR(30) NOT NULL,
    message VARCHAR(1000),
    duration_ms BIGINT,
    CONSTRAINT fk_test_result_case FOREIGN KEY (api_test_case_id) REFERENCES api_test_case(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wiki_page (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) NOT NULL,
    content VARCHAR(1000000),
    tags VARCHAR(500),
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wiki_slug UNIQUE (project_id, slug),
    CONSTRAINT fk_wiki_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wiki_page_version (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wiki_page_id BIGINT NOT NULL,
    version_no INTEGER NOT NULL,
    content_snapshot VARCHAR(1000000),
    change_note VARCHAR(500),
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wiki_version_page FOREIGN KEY (wiki_page_id) REFERENCES wiki_page(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wbs_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    parent_id BIGINT,
    title VARCHAR(300) NOT NULL,
    description VARCHAR(1000000),
    status VARCHAR(30) NOT NULL DEFAULT 'TODO',
    priority VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    progress INTEGER NOT NULL DEFAULT 0,
    assignee_name VARCHAR(100),
    due_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wbs_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_wbs_parent FOREIGN KEY (parent_id) REFERENCES wbs_item(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_stage_assignment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    assignee_name VARCHAR(100),
    assignee_title VARCHAR(100),
    assignee_phone VARCHAR(50),
    assignee_email VARCHAR(200),
    role_name VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'READY',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_stage UNIQUE (project_id, stage_name),
    CONSTRAINT fk_stage_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_stage_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    before_status VARCHAR(30),
    after_status VARCHAR(30) NOT NULL,
    changed_by VARCHAR(100),
    change_note VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stage_history_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS standard_term (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    source_word VARCHAR(200) NOT NULL,
    standard_word VARCHAR(200),
    match_status VARCHAR(30) NOT NULL DEFAULT 'UNREGISTERED',
    recommendation VARCHAR(500),
    review_memo VARCHAR(1000),
    excluded VARCHAR(1) NOT NULL DEFAULT 'N',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_standard_term_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attachment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    wiki_page_id BIGINT,
    original_name VARCHAR(500) NOT NULL,
    stored_name VARCHAR(100) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(200),
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attachment_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_attachment_wiki FOREIGN KEY (wiki_page_id) REFERENCES wiki_page(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT,
    actor VARCHAR(100),
    action VARCHAR(30) NOT NULL,
    target_type VARCHAR(100),
    target_id VARCHAR(200),
    ip_address VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_access_log_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS project_artifact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    artifact_type VARCHAR(50) NOT NULL,
    name VARCHAR(300) NOT NULL,
    version_no INTEGER NOT NULL,
    content_text VARCHAR(1000000) NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_artifact_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_share_token (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(200) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    allow_download VARCHAR(1) NOT NULL DEFAULT 'N',
    enabled VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_share_token_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wbs_status_note (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    wbs_item_id BIGINT NOT NULL,
    note_text VARCHAR(2000) NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wbs_note_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_wbs_note_item FOREIGN KEY (wbs_item_id) REFERENCES wbs_item(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wbs_artifact_link (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    wbs_item_id BIGINT NOT NULL,
    artifact_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wbs_artifact UNIQUE (wbs_item_id, artifact_id),
    CONSTRAINT fk_wbs_artifact_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_wbs_artifact_item FOREIGN KEY (wbs_item_id) REFERENCES wbs_item(id) ON DELETE CASCADE,
    CONSTRAINT fk_wbs_artifact_artifact FOREIGN KEY (artifact_id) REFERENCES project_artifact(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS db_change_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(300) NOT NULL,
    change_type VARCHAR(30) NOT NULL,
    detail_text VARCHAR(2000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_db_history_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS security_external_result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id BIGINT NOT NULL,
    tool_name VARCHAR(200) NOT NULL,
    summary_text VARCHAR(2000),
    payload_json VARCHAR(1000000) NOT NULL,
    imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_security_external_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

