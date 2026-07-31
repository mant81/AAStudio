from __future__ import annotations

import sqlite3
from pathlib import Path


SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    root_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_dashboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL UNIQUE,
    current_stage TEXT NOT NULL DEFAULT 'planning',
    summary TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_share (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL UNIQUE,
    is_readonly INTEGER NOT NULL DEFAULT 0,
    share_scope TEXT NOT NULL DEFAULT 'internal',
    note TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_workspace (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    workspace_name TEXT NOT NULL,
    workspace_type TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_stage_assignment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    stage_name TEXT NOT NULL,
    assignee_name TEXT NOT NULL DEFAULT '',
    assignee_title TEXT NOT NULL DEFAULT '',
    assignee_phone TEXT NOT NULL DEFAULT '',
    assignee_email TEXT NOT NULL DEFAULT '',
    related_item_type TEXT NOT NULL DEFAULT '',
    related_item_id INTEGER,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_stage_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    stage_name TEXT NOT NULL,
    before_status TEXT NOT NULL DEFAULT '',
    after_status TEXT NOT NULL DEFAULT '',
    changed_by TEXT NOT NULL DEFAULT '',
    change_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source_scan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    scan_path TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT '',
    framework TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'completed',
    file_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source_code_scan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    source_scan_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    summary TEXT NOT NULL DEFAULT '',
    detail TEXT NOT NULL DEFAULT '',
    line_from INTEGER,
    line_to INTEGER,
    confidence REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY(source_scan_id) REFERENCES source_scan(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS security_scan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    source_scan_id INTEGER NOT NULL,
    scan_type TEXT NOT NULL DEFAULT 'code-flow',
    policy_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY(source_scan_id) REFERENCES source_scan(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS security_issue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    security_scan_id INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    file_path TEXT NOT NULL DEFAULT '',
    line_from INTEGER,
    line_to INTEGER,
    risk_level TEXT NOT NULL DEFAULT 'medium',
    evidence TEXT NOT NULL DEFAULT '',
    recommendation TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(security_scan_id) REFERENCES security_scan(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wiki_page (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wiki_page_version (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wiki_page_id INTEGER NOT NULL,
    version_no INTEGER NOT NULL,
    content_snapshot TEXT NOT NULL DEFAULT '',
    change_note TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(wiki_page_id) REFERENCES wiki_page(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attachment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    wiki_page_id INTEGER,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT '',
    file_size INTEGER NOT NULL DEFAULT 0,
    file_hash TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY(wiki_page_id) REFERENCES wiki_page(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wbs_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    parent_id INTEGER,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'normal',
    linked_type TEXT NOT NULL DEFAULT '',
    linked_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY(parent_id) REFERENCES wbs_item(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS db_model (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS db_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    db_model_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    primary_key TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(db_model_id) REFERENCES db_model(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS db_column (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    db_table_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    data_type TEXT NOT NULL DEFAULT '',
    nullable INTEGER NOT NULL DEFAULT 1,
    default_value TEXT NOT NULL DEFAULT '',
    is_unique INTEGER NOT NULL DEFAULT 0,
    is_indexed INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    FOREIGN KEY(db_table_id) REFERENCES db_table(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS db_relation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    db_model_id INTEGER NOT NULL,
    from_table_id INTEGER NOT NULL,
    to_table_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL DEFAULT '',
    from_column TEXT NOT NULL DEFAULT '',
    to_column TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(db_model_id) REFERENCES db_model(id) ON DELETE CASCADE,
    FOREIGN KEY(from_table_id) REFERENCES db_table(id) ON DELETE CASCADE,
    FOREIGN KEY(to_table_id) REFERENCES db_table(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diagram (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    diagram_type TEXT NOT NULL DEFAULT 'erd',
    name TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_group (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_schema (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    schema_type TEXT NOT NULL DEFAULT '',
    payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_endpoint (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_group_id INTEGER NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    auth_required INTEGER NOT NULL DEFAULT 0,
    request_schema_id INTEGER,
    response_schema_id INTEGER,
    status_code INTEGER NOT NULL DEFAULT 200,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(api_group_id) REFERENCES api_group(id) ON DELETE CASCADE,
    FOREIGN KEY(request_schema_id) REFERENCES api_schema(id) ON DELETE SET NULL,
    FOREIGN KEY(response_schema_id) REFERENCES api_schema(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sample_dataset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_shared INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sample_dataset_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sample_dataset_id INTEGER NOT NULL,
    item_key TEXT NOT NULL,
    item_value_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sample_dataset_id) REFERENCES sample_dataset(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_auth_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    auth_type TEXT NOT NULL DEFAULT '',
    config_json TEXT NOT NULL DEFAULT '{}',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_test_case (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    api_endpoint_id INTEGER NOT NULL,
    auth_profile_id INTEGER,
    request_json TEXT NOT NULL DEFAULT '{}',
    expected_status_code INTEGER NOT NULL DEFAULT 200,
    expected_response_json TEXT NOT NULL DEFAULT '{}',
    sample_dataset_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY(api_endpoint_id) REFERENCES api_endpoint(id) ON DELETE CASCADE,
    FOREIGN KEY(auth_profile_id) REFERENCES api_auth_profile(id) ON DELETE SET NULL,
    FOREIGN KEY(sample_dataset_id) REFERENCES sample_dataset(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS api_test_result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_test_case_id INTEGER NOT NULL,
    executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_snapshot_json TEXT NOT NULL DEFAULT '{}',
    response_snapshot_json TEXT NOT NULL DEFAULT '{}',
    status_code INTEGER NOT NULL DEFAULT 0,
    result_status TEXT NOT NULL DEFAULT 'pending',
    message TEXT NOT NULL DEFAULT '',
    FOREIGN KEY(api_test_case_id) REFERENCES api_test_case(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    actor TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL DEFAULT '',
    target_type TEXT NOT NULL DEFAULT '',
    target_id INTEGER,
    ip_address TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS standard_word_dictionary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    recommended_spelling TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    version_no INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS standard_word_check_result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    vo_name TEXT NOT NULL,
    field_name TEXT NOT NULL DEFAULT '',
    extracted_words TEXT NOT NULL DEFAULT '',
    unmatched_words TEXT NOT NULL DEFAULT '',
    match_status TEXT NOT NULL DEFAULT 'pending',
    recommended_spelling TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);
"""


def get_connection(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def initialize_database(db_path: Path) -> None:
    with get_connection(db_path) as conn:
        conn.executescript(SCHEMA_SQL)
