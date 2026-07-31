from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path

from .db import get_connection, initialize_database


@dataclass(slots=True)
class ProjectSummary:
    id: int
    name: str
    description: str
    root_path: str
    current_stage: str | None
    is_readonly: bool


@dataclass(slots=True)
class ProjectDashboardSummary:
    project_id: int
    project_name: str
    current_stage: str
    summary: str
    latest_source_scan_id: int | None
    latest_source_scan_path: str | None
    latest_source_scan_language: str | None
    latest_source_scan_framework: str | None
    latest_security_scan_id: int | None
    latest_security_issue_title: str | None
    latest_security_issue_risk_level: str | None
    latest_api_test_case_id: int | None
    latest_api_test_status_code: int | None
    latest_api_test_result_status: str | None
    latest_api_test_message: str | None


@dataclass(slots=True)
class ProjectShareSummary:
    project_id: int
    is_readonly: bool
    share_scope: str
    note: str


@dataclass(slots=True)
class ProjectOverviewSummary:
    project_id: int
    project_name: str
    current_stage: str
    source_scans: int
    source_code_findings: int
    security_scans: int
    security_issues: int
    wiki_pages: int
    wbs_items: int
    db_models: int
    diagrams: int
    api_groups: int
    api_endpoints: int
    sample_datasets: int
    api_test_cases: int
    api_test_results: int
    access_logs: int
    db_relations: int
    attachments: int
    workspaces: int
    standard_words: int
    standard_word_checks: int


@dataclass(slots=True)
class ProjectStageAssignmentResult:
    id: int
    project_id: int
    stage_name: str
    assignee_name: str
    assignee_title: str
    assignee_phone: str
    assignee_email: str
    related_item_type: str
    related_item_id: int | None
    status: str


@dataclass(slots=True)
class ProjectStageHistoryResult:
    id: int
    project_id: int
    stage_name: str
    before_status: str
    after_status: str
    changed_by: str
    change_note: str


def _fetch_all(conn, query: str, params: tuple = ()) -> list[dict]:
    return [dict(row) for row in conn.execute(query, params).fetchall()]


class ProjectRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_project(self, name: str, root_path: str, description: str = "") -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO project (name, description, root_path) VALUES (?, ?, ?)",
                (name, description, root_path),
            )
            project_id = int(cursor.lastrowid)
            conn.execute(
                "INSERT OR IGNORE INTO project_dashboard (project_id, current_stage, summary) VALUES (?, ?, ?)",
                (project_id, "planning", ""),
            )
            return project_id

    def list_projects(self) -> list[ProjectSummary]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT p.id, p.name, p.description, p.root_path, d.current_stage, COALESCE(s.is_readonly, 0) AS is_readonly
                FROM project p
                LEFT JOIN project_dashboard d ON d.project_id = p.id
                LEFT JOIN project_share s ON s.project_id = p.id
                ORDER BY p.created_at DESC, p.id DESC
                """
            ).fetchall()
            return [
                ProjectSummary(
                    id=row["id"],
                    name=row["name"],
                    description=row["description"],
                    root_path=row["root_path"],
                    current_stage=row["current_stage"],
                    is_readonly=bool(row["is_readonly"]),
                )
                for row in rows
            ]

    def search_projects(self, query: str) -> list[ProjectSummary]:
        like_query = f"%{query.strip()}%"
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT p.id, p.name, p.description, p.root_path, d.current_stage, COALESCE(s.is_readonly, 0) AS is_readonly
                FROM project p
                LEFT JOIN project_dashboard d ON d.project_id = p.id
                LEFT JOIN project_share s ON s.project_id = p.id
                WHERE p.name LIKE ? OR p.description LIKE ? OR p.root_path LIKE ?
                ORDER BY p.created_at DESC, p.id DESC
                """,
                (like_query, like_query, like_query),
            ).fetchall()
            return [
                ProjectSummary(
                    id=row["id"],
                    name=row["name"],
                    description=row["description"],
                    root_path=row["root_path"],
                    current_stage=row["current_stage"],
                    is_readonly=bool(row["is_readonly"]),
                )
                for row in rows
            ]

    def get_recent_projects(self, limit: int = 10) -> list[ProjectSummary]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT p.id, p.name, p.description, p.root_path, d.current_stage, COALESCE(s.is_readonly, 0) AS is_readonly
                FROM project p
                LEFT JOIN project_dashboard d ON d.project_id = p.id
                LEFT JOIN project_share s ON s.project_id = p.id
                ORDER BY p.updated_at DESC, p.id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            return [
                ProjectSummary(
                    id=row["id"],
                    name=row["name"],
                    description=row["description"],
                    root_path=row["root_path"],
                    current_stage=row["current_stage"],
                    is_readonly=bool(row["is_readonly"]),
                )
                for row in rows
            ]

    def delete_project(self, project_id: int) -> None:
        with get_connection(self.db_path) as conn:
            conn.execute("DELETE FROM project WHERE id = ?", (project_id,))

    def copy_project(self, project_id: int, new_name: str, new_root_path: str | None = None) -> int:
        with get_connection(self.db_path) as conn:
            project = conn.execute(
                "SELECT name, description, root_path FROM project WHERE id = ?",
                (project_id,),
            ).fetchone()
            if project is None:
                raise ValueError(f"Project not found: {project_id}")
            cursor = conn.execute(
                "INSERT INTO project (name, description, root_path) VALUES (?, ?, ?)",
                (
                    new_name,
                    project["description"],
                    new_root_path or project["root_path"],
                ),
            )
            new_project_id = int(cursor.lastrowid)
            dashboard = conn.execute(
                "SELECT current_stage, summary FROM project_dashboard WHERE project_id = ?",
                (project_id,),
            ).fetchone()
            if dashboard is not None:
                conn.execute(
                    "INSERT INTO project_dashboard (project_id, current_stage, summary) VALUES (?, ?, ?)",
                    (new_project_id, dashboard["current_stage"], dashboard["summary"]),
                )
            share = conn.execute(
                "SELECT is_readonly, share_scope, note FROM project_share WHERE project_id = ?",
                (project_id,),
            ).fetchone()
            if share is not None:
                conn.execute(
                    "INSERT INTO project_share (project_id, is_readonly, share_scope, note) VALUES (?, ?, ?, ?)",
                    (new_project_id, share["is_readonly"], share["share_scope"], share["note"]),
                )
            return new_project_id

    def set_project_share(self, project_id: int, is_readonly: bool, share_scope: str = "external", note: str = "") -> None:
        with get_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO project_share (project_id, is_readonly, share_scope, note, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(project_id) DO UPDATE SET
                    is_readonly = excluded.is_readonly,
                    share_scope = excluded.share_scope,
                    note = excluded.note,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (project_id, int(is_readonly), share_scope, note),
            )

    def get_project_share(self, project_id: int) -> ProjectShareSummary:
        with get_connection(self.db_path) as conn:
            row = conn.execute(
                """
                SELECT project_id, is_readonly, share_scope, note
                FROM project_share
                WHERE project_id = ?
                """,
                (project_id,),
            ).fetchone()
            if row is None:
                return ProjectShareSummary(project_id=project_id, is_readonly=False, share_scope="internal", note="")
            return ProjectShareSummary(
                project_id=row["project_id"],
                is_readonly=bool(row["is_readonly"]),
                share_scope=row["share_scope"],
                note=row["note"],
            )

    def export_project_bundle(self, project_id: int) -> dict:
        with get_connection(self.db_path) as conn:
            project = conn.execute("SELECT * FROM project WHERE id = ?", (project_id,)).fetchone()
            if project is None:
                raise ValueError(f"Project not found: {project_id}")
            bundle = {
                "project": dict(project),
                "project_dashboard": dict(
                    conn.execute("SELECT * FROM project_dashboard WHERE project_id = ?", (project_id,)).fetchone() or {}
                ),
                "project_workspace": _fetch_all(conn, "SELECT * FROM project_workspace WHERE project_id = ?", (project_id,)),
                "project_stage_assignment": _fetch_all(conn, "SELECT * FROM project_stage_assignment WHERE project_id = ?", (project_id,)),
                "project_stage_history": _fetch_all(conn, "SELECT * FROM project_stage_history WHERE project_id = ?", (project_id,)),
                "source_scan": _fetch_all(conn, "SELECT * FROM source_scan WHERE project_id = ?", (project_id,)),
                "source_code_scan": _fetch_all(conn, "SELECT sc.* FROM source_code_scan sc JOIN source_scan s ON s.id = sc.source_scan_id WHERE s.project_id = ?", (project_id,)),
                "security_scan": _fetch_all(conn, "SELECT * FROM security_scan WHERE project_id = ?", (project_id,)),
                "security_issue": _fetch_all(conn, "SELECT si.* FROM security_issue si JOIN security_scan ss ON ss.id = si.security_scan_id WHERE ss.project_id = ?", (project_id,)),
                "wiki_page": _fetch_all(conn, "SELECT * FROM wiki_page WHERE project_id = ?", (project_id,)),
                "wiki_page_version": _fetch_all(conn, "SELECT wv.* FROM wiki_page_version wv JOIN wiki_page wp ON wp.id = wv.wiki_page_id WHERE wp.project_id = ?", (project_id,)),
                "attachment": _fetch_all(conn, "SELECT * FROM attachment WHERE project_id = ?", (project_id,)),
                "wbs_item": _fetch_all(conn, "SELECT * FROM wbs_item WHERE project_id = ?", (project_id,)),
                "db_model": _fetch_all(conn, "SELECT * FROM db_model WHERE project_id = ?", (project_id,)),
                "db_table": _fetch_all(conn, "SELECT dt.* FROM db_table dt JOIN db_model dm ON dm.id = dt.db_model_id WHERE dm.project_id = ?", (project_id,)),
                "db_column": _fetch_all(conn, "SELECT dbc.* FROM db_column dbc JOIN db_table dt ON dt.id = dbc.db_table_id JOIN db_model dm ON dm.id = dt.db_model_id WHERE dm.project_id = ?", (project_id,)),
                "diagram": _fetch_all(conn, "SELECT * FROM diagram WHERE project_id = ?", (project_id,)),
                "api_group": _fetch_all(conn, "SELECT * FROM api_group WHERE project_id = ?", (project_id,)),
                "api_schema": _fetch_all(conn, "SELECT * FROM api_schema WHERE project_id = ?", (project_id,)),
                "api_endpoint": _fetch_all(conn, "SELECT ae.* FROM api_endpoint ae JOIN api_group ag ON ag.id = ae.api_group_id WHERE ag.project_id = ?", (project_id,)),
                "sample_dataset": _fetch_all(conn, "SELECT * FROM sample_dataset WHERE project_id = ?", (project_id,)),
                "sample_dataset_item": _fetch_all(conn, "SELECT sdi.* FROM sample_dataset_item sdi JOIN sample_dataset sd ON sd.id = sdi.sample_dataset_id WHERE sd.project_id = ?", (project_id,)),
                "api_auth_profile": _fetch_all(conn, "SELECT * FROM api_auth_profile WHERE project_id = ?", (project_id,)),
                "api_test_case": _fetch_all(conn, "SELECT * FROM api_test_case WHERE project_id = ?", (project_id,)),
                "api_test_result": _fetch_all(conn, "SELECT atr.* FROM api_test_result atr JOIN api_test_case atc ON atc.id = atr.api_test_case_id WHERE atc.project_id = ?", (project_id,)),
                "access_log": _fetch_all(conn, "SELECT * FROM access_log WHERE project_id = ?", (project_id,)),
                "standard_word_dictionary": _fetch_all(conn, "SELECT * FROM standard_word_dictionary WHERE project_id = ?", (project_id,)),
                "standard_word_check_result": _fetch_all(conn, "SELECT * FROM standard_word_check_result WHERE project_id = ?", (project_id,)),
            }
            return bundle

    def import_project_bundle(self, bundle: dict, new_name: str | None = None, new_root_path: str | None = None) -> int:
        with get_connection(self.db_path) as conn:
            project = dict(bundle["project"])
            cursor = conn.execute(
                "INSERT INTO project (name, description, root_path) VALUES (?, ?, ?)",
                (
                    new_name or project["name"],
                    project.get("description", ""),
                    new_root_path or project.get("root_path", ""),
                ),
            )
            new_project_id = int(cursor.lastrowid)
            dashboard = dict(bundle.get("project_dashboard") or {})
            conn.execute(
                "INSERT INTO project_dashboard (project_id, current_stage, summary) VALUES (?, ?, ?)",
                (
                    new_project_id,
                    dashboard.get("current_stage", "planning"),
                    dashboard.get("summary", ""),
                ),
            )

            def remap_many(rows: list[dict], insert_sql: str, transform):
                mapping: dict[int, int] = {}
                for row in rows:
                    old_id = int(row["id"])
                    payload = transform(dict(row))
                    cursor = conn.execute(insert_sql, payload)
                    mapping[old_id] = int(cursor.lastrowid)
                return mapping

            workspace_rows = bundle.get("project_workspace", [])
            for row in workspace_rows:
                conn.execute(
                    "INSERT INTO project_workspace (project_id, workspace_name, workspace_type, is_active, created_at) VALUES (?, ?, ?, ?, ?)",
                    (new_project_id, row["workspace_name"], row["workspace_type"], row["is_active"], row["created_at"]),
                )

            for row in bundle.get("project_stage_assignment", []):
                conn.execute(
                    """
                    INSERT INTO project_stage_assignment (
                        project_id, stage_name, assignee_name, assignee_title, assignee_phone,
                        assignee_email, related_item_type, related_item_id, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (new_project_id, row["stage_name"], row["assignee_name"], row["assignee_title"], row["assignee_phone"], row["assignee_email"], row["related_item_type"], row["related_item_id"], row["status"], row["created_at"]),
                )

            for row in bundle.get("project_stage_history", []):
                conn.execute(
                    "INSERT INTO project_stage_history (project_id, stage_name, before_status, after_status, changed_by, change_note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (new_project_id, row["stage_name"], row["before_status"], row["after_status"], row["changed_by"], row["change_note"], row["created_at"]),
                )

            source_scan_map = remap_many(
                bundle.get("source_scan", []),
                "INSERT INTO source_scan (project_id, scan_path, language, framework, status, file_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                lambda row: (new_project_id, row["scan_path"], row["language"], row["framework"], row["status"], row["file_count"], row["created_at"]),
            )
            for row in bundle.get("source_code_scan", []):
                conn.execute(
                    "INSERT INTO source_code_scan (project_id, source_scan_id, file_path, rule_name, severity, summary, detail, line_from, line_to, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (new_project_id, source_scan_map[row["source_scan_id"]], row["file_path"], row["rule_name"], row["severity"], row["summary"], row["detail"], row["line_from"], row["line_to"], row["confidence"], row["created_at"]),
                )
            security_scan_map = remap_many(
                bundle.get("security_scan", []),
                "INSERT INTO security_scan (project_id, source_scan_id, scan_type, policy_name, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                lambda row: (new_project_id, source_scan_map[row["source_scan_id"]], row["scan_type"], row["policy_name"], row["status"], row["created_at"]),
            )
            for row in bundle.get("security_issue", []):
                conn.execute(
                    "INSERT INTO security_issue (security_scan_id, category, title, description, file_path, line_from, line_to, risk_level, evidence, recommendation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (security_scan_map[row["security_scan_id"]], row["category"], row["title"], row["description"], row["file_path"], row["line_from"], row["line_to"], row["risk_level"], row["evidence"], row["recommendation"], row["created_at"]),
                )

            wiki_page_map = remap_many(
                bundle.get("wiki_page", []),
                "INSERT INTO wiki_page (project_id, title, slug, content, tags, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                lambda row: (new_project_id, row["title"], row["slug"], row["content"], row["tags"], row["created_by"], row["created_at"], row["updated_at"]),
            )
            for row in bundle.get("wiki_page_version", []):
                conn.execute(
                    "INSERT INTO wiki_page_version (wiki_page_id, version_no, content_snapshot, change_note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (wiki_page_map[row["wiki_page_id"]], row["version_no"], row["content_snapshot"], row["change_note"], row["created_by"], row["created_at"]),
                )
            for row in bundle.get("attachment", []):
                wiki_page_id = wiki_page_map.get(row["wiki_page_id"]) if row.get("wiki_page_id") is not None else None
                conn.execute(
                    "INSERT INTO attachment (project_id, wiki_page_id, original_name, stored_name, file_path, mime_type, file_size, file_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (new_project_id, wiki_page_id, row["original_name"], row["stored_name"], row["file_path"], row["mime_type"], row["file_size"], row["file_hash"], row["created_at"]),
                )

            wbs_map = remap_many(
                bundle.get("wbs_item", []),
                "INSERT INTO wbs_item (project_id, parent_id, title, description, status, priority, linked_type, linked_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                lambda row: (new_project_id, row["parent_id"], row["title"], row["description"], row["status"], row["priority"], row["linked_type"], row["linked_id"], row["created_at"], row["updated_at"]),
            )
            model_map = remap_many(
                bundle.get("db_model", []),
                "INSERT INTO db_model (project_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                lambda row: (new_project_id, row["name"], row["description"], row["created_at"], row["updated_at"]),
            )
            table_map = {}
            for row in bundle.get("db_table", []):
                new_model_id = model_map[row["db_model_id"]]
                cursor = conn.execute(
                    "INSERT INTO db_table (db_model_id, name, description, primary_key, created_at) VALUES (?, ?, ?, ?, ?)",
                    (new_model_id, row["name"], row["description"], row["primary_key"], row["created_at"]),
                )
                table_map[int(row["id"])] = int(cursor.lastrowid)
            for row in bundle.get("db_column", []):
                conn.execute(
                    "INSERT INTO db_column (db_table_id, name, data_type, nullable, default_value, is_unique, is_indexed, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (table_map[row["db_table_id"]], row["name"], row["data_type"], row["nullable"], row["default_value"], row["is_unique"], row["is_indexed"], row["description"]),
                )

            for row in bundle.get("diagram", []):
                conn.execute(
                    "INSERT INTO diagram (project_id, diagram_type, name, payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (new_project_id, row["diagram_type"], row["name"], row["payload_json"], row["created_at"], row["updated_at"]),
                )
            api_group_map = remap_many(
                bundle.get("api_group", []),
                "INSERT INTO api_group (project_id, name, description, created_at) VALUES (?, ?, ?, ?)",
                lambda row: (new_project_id, row["name"], row["description"], row["created_at"]),
            )
            api_schema_map = remap_many(
                bundle.get("api_schema", []),
                "INSERT INTO api_schema (project_id, name, schema_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)",
                lambda row: (new_project_id, row["name"], row["schema_type"], row["payload_json"], row["created_at"]),
            )
            endpoint_map = {}
            for row in bundle.get("api_endpoint", []):
                cursor = conn.execute(
                    "INSERT INTO api_endpoint (api_group_id, method, path, summary, auth_required, request_schema_id, response_schema_id, status_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (api_group_map[row["api_group_id"]], row["method"], row["path"], row["summary"], row["auth_required"], api_schema_map.get(row["request_schema_id"]) if row["request_schema_id"] is not None else None, api_schema_map.get(row["response_schema_id"]) if row["response_schema_id"] is not None else None, row["status_code"], row["created_at"]),
                )
                endpoint_map[int(row["id"])] = int(cursor.lastrowid)
            sample_map = remap_many(
                bundle.get("sample_dataset", []),
                "INSERT INTO sample_dataset (project_id, name, description, is_shared, created_at) VALUES (?, ?, ?, ?, ?)",
                lambda row: (new_project_id, row["name"], row["description"], row["is_shared"], row["created_at"]),
            )
            for row in bundle.get("sample_dataset_item", []):
                conn.execute(
                    "INSERT INTO sample_dataset_item (sample_dataset_id, item_key, item_value_json, created_at) VALUES (?, ?, ?, ?)",
                    (sample_map[row["sample_dataset_id"]], row["item_key"], row["item_value_json"], row["created_at"]),
                )
            auth_map = remap_many(
                bundle.get("api_auth_profile", []),
                "INSERT INTO api_auth_profile (project_id, name, auth_type, config_json, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                lambda row: (new_project_id, row["name"], row["auth_type"], row["config_json"], row["is_default"], row["created_at"]),
            )
            case_map = {}
            for row in bundle.get("api_test_case", []):
                cursor = conn.execute(
                    "INSERT INTO api_test_case (project_id, api_endpoint_id, auth_profile_id, request_json, expected_status_code, expected_response_json, sample_dataset_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (new_project_id, endpoint_map[row["api_endpoint_id"]], auth_map.get(row["auth_profile_id"]) if row["auth_profile_id"] is not None else None, row["request_json"], row["expected_status_code"], row["expected_response_json"], sample_map.get(row["sample_dataset_id"]) if row["sample_dataset_id"] is not None else None, row["created_at"]),
                )
                case_map[int(row["id"])] = int(cursor.lastrowid)
            for row in bundle.get("api_test_result", []):
                conn.execute(
                    "INSERT INTO api_test_result (api_test_case_id, executed_at, request_snapshot_json, response_snapshot_json, status_code, result_status, message) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (case_map[row["api_test_case_id"]], row["executed_at"], row["request_snapshot_json"], row["response_snapshot_json"], row["status_code"], row["result_status"], row["message"]),
                )
            for row in bundle.get("access_log", []):
                conn.execute(
                    "INSERT INTO access_log (project_id, actor, action, target_type, target_id, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (new_project_id, row["actor"], row["action"], row["target_type"], row["target_id"], row["ip_address"], row["created_at"]),
                )
            for row in bundle.get("standard_word_dictionary", []):
                conn.execute(
                    """
                    INSERT INTO standard_word_dictionary (
                        project_id, word, recommended_spelling, note, version_no, created_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        new_project_id,
                        row["word"],
                        row["recommended_spelling"],
                        row["note"],
                        row["version_no"],
                        row["created_by"],
                        row["created_at"],
                    ),
                )
            for row in bundle.get("standard_word_check_result", []):
                conn.execute(
                    """
                    INSERT INTO standard_word_check_result (
                        project_id, vo_name, field_name, extracted_words, unmatched_words,
                        match_status, recommended_spelling, note, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        new_project_id,
                        row["vo_name"],
                        row["field_name"],
                        row["extracted_words"],
                        row["unmatched_words"],
                        row["match_status"],
                        row["recommended_spelling"],
                        row["note"],
                        row["created_at"],
                    ),
                )
            return new_project_id

    def get_overview_summary(self, project_id: int) -> ProjectOverviewSummary:
        with get_connection(self.db_path) as conn:
            row = conn.execute(
                """
                SELECT
                    p.id AS project_id,
                    p.name AS project_name,
                    COALESCE(d.current_stage, 'planning') AS current_stage,
                    (SELECT COUNT(*) FROM source_scan s WHERE s.project_id = p.id) AS source_scans,
                    (SELECT COUNT(*) FROM source_code_scan sc WHERE sc.project_id = p.id) AS source_code_findings,
                    (SELECT COUNT(*) FROM security_scan ss WHERE ss.project_id = p.id) AS security_scans,
                    (SELECT COUNT(*) FROM security_issue si JOIN security_scan ss ON ss.id = si.security_scan_id WHERE ss.project_id = p.id) AS security_issues,
                    (SELECT COUNT(*) FROM wiki_page w WHERE w.project_id = p.id) AS wiki_pages,
                    (SELECT COUNT(*) FROM wbs_item wbs WHERE wbs.project_id = p.id) AS wbs_items,
                    (SELECT COUNT(*) FROM db_model dm WHERE dm.project_id = p.id) AS db_models,
                    (SELECT COUNT(*) FROM db_relation dr WHERE dr.db_model_id IN (SELECT id FROM db_model WHERE project_id = p.id)) AS db_relations,
                    (SELECT COUNT(*) FROM diagram dgm WHERE dgm.project_id = p.id) AS diagrams,
                    (SELECT COUNT(*) FROM api_group ag WHERE ag.project_id = p.id) AS api_groups,
                    (SELECT COUNT(*) FROM api_endpoint ae JOIN api_group ag ON ag.id = ae.api_group_id WHERE ag.project_id = p.id) AS api_endpoints,
                    (SELECT COUNT(*) FROM sample_dataset sd WHERE sd.project_id = p.id) AS sample_datasets,
                    (SELECT COUNT(*) FROM api_test_case atc WHERE atc.project_id = p.id) AS api_test_cases,
                    (SELECT COUNT(*) FROM api_test_result atr JOIN api_test_case atc ON atc.id = atr.api_test_case_id WHERE atc.project_id = p.id) AS api_test_results,
                    (SELECT COUNT(*) FROM access_log al WHERE al.project_id = p.id) AS access_logs,
                    (SELECT COUNT(*) FROM attachment a WHERE a.project_id = p.id) AS attachments,
                    (SELECT COUNT(*) FROM project_workspace pw WHERE pw.project_id = p.id) AS workspaces,
                    (SELECT COUNT(*) FROM standard_word_dictionary swd WHERE swd.project_id = p.id) AS standard_words,
                    (SELECT COUNT(*) FROM standard_word_check_result swc WHERE swc.project_id = p.id) AS standard_word_checks
                FROM project p
                LEFT JOIN project_dashboard d ON d.project_id = p.id
                WHERE p.id = ?
                """,
                (project_id,),
            ).fetchone()
            if row is None:
                raise ValueError(f"Project not found: {project_id}")

            return ProjectOverviewSummary(
                project_id=row["project_id"],
                project_name=row["project_name"],
                current_stage=row["current_stage"],
                source_scans=row["source_scans"],
                source_code_findings=row["source_code_findings"],
                security_scans=row["security_scans"],
                security_issues=row["security_issues"],
                wiki_pages=row["wiki_pages"],
                wbs_items=row["wbs_items"],
                db_models=row["db_models"],
                db_relations=row["db_relations"],
                diagrams=row["diagrams"],
                api_groups=row["api_groups"],
                api_endpoints=row["api_endpoints"],
                sample_datasets=row["sample_datasets"],
                api_test_cases=row["api_test_cases"],
                api_test_results=row["api_test_results"],
                access_logs=row["access_logs"],
                attachments=row["attachments"],
                workspaces=row["workspaces"],
                standard_words=row["standard_words"],
                standard_word_checks=row["standard_word_checks"],
            )

    def get_dashboard_summary(self, project_id: int) -> ProjectDashboardSummary:
        with get_connection(self.db_path) as conn:
            row = conn.execute(
                """
                SELECT
                    p.id AS project_id,
                    p.name AS project_name,
                    COALESCE(d.current_stage, 'planning') AS current_stage,
                    COALESCE(d.summary, '') AS summary
                FROM project p
                LEFT JOIN project_dashboard d ON d.project_id = p.id
                WHERE p.id = ?
                """,
                (project_id,),
            ).fetchone()
            if row is None:
                raise ValueError(f"Project not found: {project_id}")

            latest_source_scan = conn.execute(
                """
                SELECT id, scan_path, language, framework
                FROM source_scan
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT 1
                """,
                (project_id,),
            ).fetchone()

            latest_security_issue = conn.execute(
                """
                SELECT si.title, si.risk_level, ss.id AS security_scan_id
                FROM security_issue si
                JOIN security_scan ss ON ss.id = si.security_scan_id
                WHERE ss.project_id = ?
                ORDER BY si.created_at DESC, si.id DESC
                LIMIT 1
                """,
                (project_id,),
            ).fetchone()

            latest_api_test = conn.execute(
                """
                SELECT
                    atr.api_test_case_id,
                    atr.status_code,
                    atr.result_status,
                    atr.message
                FROM api_test_result atr
                JOIN api_test_case atc ON atc.id = atr.api_test_case_id
                WHERE atc.project_id = ?
                ORDER BY atr.executed_at DESC, atr.id DESC
                LIMIT 1
                """,
                (project_id,),
            ).fetchone()

            return ProjectDashboardSummary(
                project_id=row["project_id"],
                project_name=row["project_name"],
                current_stage=row["current_stage"],
                summary=row["summary"],
                latest_source_scan_id=latest_source_scan["id"] if latest_source_scan else None,
                latest_source_scan_path=latest_source_scan["scan_path"] if latest_source_scan else None,
                latest_source_scan_language=latest_source_scan["language"] if latest_source_scan else None,
                latest_source_scan_framework=latest_source_scan["framework"] if latest_source_scan else None,
                latest_security_scan_id=latest_security_issue["security_scan_id"] if latest_security_issue else None,
                latest_security_issue_title=latest_security_issue["title"] if latest_security_issue else None,
                latest_security_issue_risk_level=latest_security_issue["risk_level"] if latest_security_issue else None,
                latest_api_test_case_id=latest_api_test["api_test_case_id"] if latest_api_test else None,
                latest_api_test_status_code=latest_api_test["status_code"] if latest_api_test else None,
                latest_api_test_result_status=latest_api_test["result_status"] if latest_api_test else None,
                latest_api_test_message=latest_api_test["message"] if latest_api_test else None,
            )

    def update_dashboard(self, project_id: int, current_stage: str | None = None, summary: str | None = None) -> None:
        if current_stage is None and summary is None:
            return
        with get_connection(self.db_path) as conn:
            assignments = []
            params = []
            if current_stage is not None:
                assignments.append("current_stage = ?")
                params.append(current_stage)
            if summary is not None:
                assignments.append("summary = ?")
                params.append(summary)
            assignments.append("updated_at = CURRENT_TIMESTAMP")
            params.append(project_id)
            conn.execute(
                f"UPDATE project_dashboard SET {', '.join(assignments)} WHERE project_id = ?",
                params,
            )

    def create_stage_assignment(
        self,
        project_id: int,
        stage_name: str,
        assignee_name: str = "",
        assignee_title: str = "",
        assignee_phone: str = "",
        assignee_email: str = "",
        related_item_type: str = "",
        related_item_id: int | None = None,
        status: str = "open",
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO project_stage_assignment (
                    project_id, stage_name, assignee_name, assignee_title, assignee_phone,
                    assignee_email, related_item_type, related_item_id, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project_id,
                    stage_name,
                    assignee_name,
                    assignee_title,
                    assignee_phone,
                    assignee_email,
                    related_item_type,
                    related_item_id,
                    status,
                ),
            )
            return int(cursor.lastrowid)

    def list_stage_assignments(self, project_id: int) -> list[ProjectStageAssignmentResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, stage_name, assignee_name, assignee_title, assignee_phone,
                       assignee_email, related_item_type, related_item_id, status
                FROM project_stage_assignment
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                ProjectStageAssignmentResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    stage_name=row["stage_name"],
                    assignee_name=row["assignee_name"],
                    assignee_title=row["assignee_title"],
                    assignee_phone=row["assignee_phone"],
                    assignee_email=row["assignee_email"],
                    related_item_type=row["related_item_type"],
                    related_item_id=row["related_item_id"],
                    status=row["status"],
                )
                for row in rows
            ]

    def create_stage_history(
        self,
        project_id: int,
        stage_name: str,
        before_status: str,
        after_status: str,
        changed_by: str = "",
        change_note: str = "",
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO project_stage_history (
                    project_id, stage_name, before_status, after_status, changed_by, change_note
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (project_id, stage_name, before_status, after_status, changed_by, change_note),
            )
            return int(cursor.lastrowid)

    def list_stage_history(self, project_id: int) -> list[ProjectStageHistoryResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, stage_name, before_status, after_status, changed_by, change_note
                FROM project_stage_history
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                ProjectStageHistoryResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    stage_name=row["stage_name"],
                    before_status=row["before_status"],
                    after_status=row["after_status"],
                    changed_by=row["changed_by"],
                    change_note=row["change_note"],
                )
                for row in rows
            ]


@dataclass(slots=True)
class SourceScanResult:
    id: int
    project_id: int
    scan_path: str
    language: str
    framework: str
    status: str
    file_count: int


@dataclass(slots=True)
class SourceCodeFinding:
    id: int
    project_id: int
    source_scan_id: int
    file_path: str
    rule_name: str
    severity: str
    summary: str
    detail: str
    line_from: int | None
    line_to: int | None
    confidence: float


@dataclass(slots=True)
class SecurityScanResult:
    id: int
    project_id: int
    source_scan_id: int
    scan_type: str
    policy_name: str
    status: str


@dataclass(slots=True)
class SecurityIssueResult:
    id: int
    security_scan_id: int
    category: str
    title: str
    description: str
    file_path: str
    line_from: int | None
    line_to: int | None
    risk_level: str
    evidence: str
    recommendation: str


@dataclass(slots=True)
class WikiPageResult:
    id: int
    project_id: int
    title: str
    slug: str
    content: str
    tags: str


@dataclass(slots=True)
class WikiPageVersionResult:
    id: int
    wiki_page_id: int
    version_no: int
    content_snapshot: str
    change_note: str
    created_by: str


@dataclass(slots=True)
class AttachmentResult:
    id: int
    project_id: int
    wiki_page_id: int | None
    original_name: str
    stored_name: str
    file_path: str
    mime_type: str
    file_size: int
    file_hash: str


@dataclass(slots=True)
class ProjectWorkspaceResult:
    id: int
    project_id: int
    workspace_name: str
    workspace_type: str
    is_active: bool


@dataclass(slots=True)
class WbsItemResult:
    id: int
    project_id: int
    parent_id: int | None
    title: str
    description: str
    status: str
    priority: str
    linked_type: str
    linked_id: int | None


@dataclass(slots=True)
class DbModelResult:
    id: int
    project_id: int
    name: str
    description: str


@dataclass(slots=True)
class DbTableResult:
    id: int
    db_model_id: int
    name: str
    description: str
    primary_key: str


@dataclass(slots=True)
class DbColumnResult:
    id: int
    db_table_id: int
    name: str
    data_type: str
    nullable: bool
    default_value: str
    is_unique: bool
    is_indexed: bool
    description: str


@dataclass(slots=True)
class DbRelationResult:
    id: int
    db_model_id: int
    from_table_id: int
    to_table_id: int
    relation_type: str
    from_column: str
    to_column: str
    description: str


@dataclass(slots=True)
class DiagramResult:
    id: int
    project_id: int
    diagram_type: str
    name: str
    payload_json: str


@dataclass(slots=True)
class ApiGroupResult:
    id: int
    project_id: int
    name: str
    description: str


@dataclass(slots=True)
class ApiSchemaResult:
    id: int
    project_id: int
    name: str
    schema_type: str
    payload_json: str


@dataclass(slots=True)
class ApiEndpointResult:
    id: int
    api_group_id: int
    method: str
    path: str
    summary: str
    auth_required: bool
    request_schema_id: int | None
    response_schema_id: int | None
    status_code: int


@dataclass(slots=True)
class SampleDatasetResult:
    id: int
    project_id: int
    name: str
    description: str
    is_shared: bool


@dataclass(slots=True)
class SampleDatasetItemResult:
    id: int
    sample_dataset_id: int
    item_key: str
    item_value_json: str


@dataclass(slots=True)
class ApiAuthProfileResult:
    id: int
    project_id: int
    name: str
    auth_type: str
    config_json: str
    is_default: bool


@dataclass(slots=True)
class ApiTestCaseResult:
    id: int
    project_id: int
    api_endpoint_id: int
    auth_profile_id: int | None
    request_json: str
    expected_status_code: int
    expected_response_json: str
    sample_dataset_id: int | None


@dataclass(slots=True)
class ApiTestResultResult:
    id: int
    api_test_case_id: int
    executed_at: str
    request_snapshot_json: str
    response_snapshot_json: str
    status_code: int
    result_status: str
    message: str


@dataclass(slots=True)
class AccessLogResult:
    id: int
    project_id: int
    actor: str
    action: str
    target_type: str
    target_id: int | None
    ip_address: str
    created_at: str


@dataclass(slots=True)
class StandardWordDictionaryResult:
    id: int
    project_id: int
    word: str
    recommended_spelling: str
    note: str
    version_no: int
    created_by: str
    created_at: str


@dataclass(slots=True)
class StandardWordCheckResult:
    id: int
    project_id: int
    vo_name: str
    field_name: str
    extracted_words: str
    unmatched_words: str
    match_status: str
    recommended_spelling: str
    note: str
    created_at: str


class SourceScanRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_scan(
        self,
        project_id: int,
        scan_path: str,
        language: str,
        framework: str,
        file_count: int,
        status: str = "completed",
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO source_scan (project_id, scan_path, language, framework, status, file_count)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (project_id, scan_path, language, framework, status, file_count),
            )
            return int(cursor.lastrowid)

    def list_scans(self, project_id: int) -> list[SourceScanResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, scan_path, language, framework, status, file_count
                FROM source_scan
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                SourceScanResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    scan_path=row["scan_path"],
                    language=row["language"],
                    framework=row["framework"],
                    status=row["status"],
                    file_count=row["file_count"],
                )
                for row in rows
            ]


class SourceCodeScanRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_finding(
        self,
        project_id: int,
        source_scan_id: int,
        file_path: str,
        rule_name: str,
        severity: str,
        summary: str,
        detail: str,
        line_from: int | None,
        line_to: int | None,
        confidence: float,
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO source_code_scan (
                    project_id, source_scan_id, file_path, rule_name, severity,
                    summary, detail, line_from, line_to, confidence
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project_id,
                    source_scan_id,
                    file_path,
                    rule_name,
                    severity,
                    summary,
                    detail,
                    line_from,
                    line_to,
                    confidence,
                ),
            )
            return int(cursor.lastrowid)

    def list_findings(self, source_scan_id: int) -> list[SourceCodeFinding]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, source_scan_id, file_path, rule_name, severity,
                       summary, detail, line_from, line_to, confidence
                FROM source_code_scan
                WHERE source_scan_id = ?
                ORDER BY id DESC
                """,
                (source_scan_id,),
            ).fetchall()
            return [
                SourceCodeFinding(
                    id=row["id"],
                    project_id=row["project_id"],
                    source_scan_id=row["source_scan_id"],
                    file_path=row["file_path"],
                    rule_name=row["rule_name"],
                    severity=row["severity"],
                    summary=row["summary"],
                    detail=row["detail"],
                    line_from=row["line_from"],
                    line_to=row["line_to"],
                    confidence=row["confidence"],
                )
                for row in rows
            ]


class SecurityScanRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_scan(self, project_id: int, source_scan_id: int, scan_type: str = "code-flow", policy_name: str = "basic-code-flow") -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO security_scan (project_id, source_scan_id, scan_type, policy_name, status)
                VALUES (?, ?, ?, ?, 'completed')
                """,
                (project_id, source_scan_id, scan_type, policy_name),
            )
            return int(cursor.lastrowid)

    def list_scans(self, project_id: int) -> list[SecurityScanResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, source_scan_id, scan_type, policy_name, status
                FROM security_scan
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                SecurityScanResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    source_scan_id=row["source_scan_id"],
                    scan_type=row["scan_type"],
                    policy_name=row["policy_name"],
                    status=row["status"],
                )
                for row in rows
            ]


class SecurityIssueRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_issue(
        self,
        security_scan_id: int,
        category: str,
        title: str,
        description: str,
        file_path: str,
        line_from: int | None,
        line_to: int | None,
        risk_level: str,
        evidence: str,
        recommendation: str,
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO security_issue (
                    security_scan_id, category, title, description, file_path,
                    line_from, line_to, risk_level, evidence, recommendation
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    security_scan_id,
                    category,
                    title,
                    description,
                    file_path,
                    line_from,
                    line_to,
                    risk_level,
                    evidence,
                    recommendation,
                ),
            )
            return int(cursor.lastrowid)

    def list_issues(self, security_scan_id: int) -> list[SecurityIssueResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, security_scan_id, category, title, description, file_path,
                       line_from, line_to, risk_level, evidence, recommendation
                FROM security_issue
                WHERE security_scan_id = ?
                ORDER BY id DESC
                """,
                (security_scan_id,),
            ).fetchall()
            return [
                SecurityIssueResult(
                    id=row["id"],
                    security_scan_id=row["security_scan_id"],
                    category=row["category"],
                    title=row["title"],
                    description=row["description"],
                    file_path=row["file_path"],
                    line_from=row["line_from"],
                    line_to=row["line_to"],
                    risk_level=row["risk_level"],
                    evidence=row["evidence"],
                    recommendation=row["recommendation"],
                )
                for row in rows
            ]

    def list_issues_for_project(self, project_id: int) -> list[SecurityIssueResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT si.id, si.security_scan_id, si.category, si.title, si.description, si.file_path,
                       si.line_from, si.line_to, si.risk_level, si.evidence, si.recommendation
                FROM security_issue si
                JOIN security_scan ss ON ss.id = si.security_scan_id
                WHERE ss.project_id = ?
                ORDER BY si.id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                SecurityIssueResult(
                    id=row["id"],
                    security_scan_id=row["security_scan_id"],
                    category=row["category"],
                    title=row["title"],
                    description=row["description"],
                    file_path=row["file_path"],
                    line_from=row["line_from"],
                    line_to=row["line_to"],
                    risk_level=row["risk_level"],
                    evidence=row["evidence"],
                    recommendation=row["recommendation"],
                )
                for row in rows
            ]


class WikiRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_page(self, project_id: int, title: str, slug: str, content: str, tags: str = "", created_by: str = "") -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO wiki_page (project_id, title, slug, content, tags, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (project_id, title, slug, content, tags, created_by),
            )
            page_id = int(cursor.lastrowid)
            conn.execute(
                """
                INSERT INTO wiki_page_version (wiki_page_id, version_no, content_snapshot, change_note, created_by)
                VALUES (?, 1, ?, ?, ?)
                """,
                (page_id, content, "Initial version", created_by),
            )
            return page_id

    def list_pages(self, project_id: int) -> list[WikiPageResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, title, slug, content, tags
                FROM wiki_page
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                WikiPageResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    title=row["title"],
                    slug=row["slug"],
                    content=row["content"],
                    tags=row["tags"],
                )
                for row in rows
            ]

    def list_versions(self, wiki_page_id: int) -> list[WikiPageVersionResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, wiki_page_id, version_no, content_snapshot, change_note, created_by
                FROM wiki_page_version
                WHERE wiki_page_id = ?
                ORDER BY version_no DESC, id DESC
                """,
                (wiki_page_id,),
            ).fetchall()
            return [
                WikiPageVersionResult(
                    id=row["id"],
                    wiki_page_id=row["wiki_page_id"],
                    version_no=row["version_no"],
                    content_snapshot=row["content_snapshot"],
                    change_note=row["change_note"],
                    created_by=row["created_by"],
                )
                for row in rows
            ]

    def restore_version(self, wiki_page_id: int, version_no: int, restored_by: str = "") -> int:
        with get_connection(self.db_path) as conn:
            page = conn.execute(
                "SELECT id, content, tags FROM wiki_page WHERE id = ?",
                (wiki_page_id,),
            ).fetchone()
            if page is None:
                raise ValueError(f"Wiki page not found: {wiki_page_id}")
            version = conn.execute(
                """
                SELECT version_no, content_snapshot
                FROM wiki_page_version
                WHERE wiki_page_id = ? AND version_no = ?
                """,
                (wiki_page_id, version_no),
            ).fetchone()
            if version is None:
                raise ValueError(f"Wiki version not found: page={wiki_page_id}, version={version_no}")
            next_version = conn.execute(
                "SELECT COALESCE(MAX(version_no), 0) + 1 AS next_version FROM wiki_page_version WHERE wiki_page_id = ?",
                (wiki_page_id,),
            ).fetchone()["next_version"]
            conn.execute(
                "UPDATE wiki_page SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (version["content_snapshot"], wiki_page_id),
            )
            cursor = conn.execute(
                """
                INSERT INTO wiki_page_version (wiki_page_id, version_no, content_snapshot, change_note, created_by)
                VALUES (?, ?, ?, ?, ?)
                """,
                (wiki_page_id, next_version, version["content_snapshot"], f"Restored from version {version_no}", restored_by),
            )
            return int(cursor.lastrowid)

    def get_page_project_id(self, wiki_page_id: int) -> int | None:
        with get_connection(self.db_path) as conn:
            row = conn.execute("SELECT project_id FROM wiki_page WHERE id = ?", (wiki_page_id,)).fetchone()
            return None if row is None else int(row["project_id"])

    def add_attachment(
        self,
        project_id: int,
        wiki_page_id: int | None,
        original_name: str,
        stored_name: str,
        file_path: str,
        mime_type: str = "",
        file_size: int = 0,
        file_hash: str = "",
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO attachment (
                    project_id, wiki_page_id, original_name, stored_name, file_path,
                    mime_type, file_size, file_hash
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project_id,
                    wiki_page_id,
                    original_name,
                    stored_name,
                    file_path,
                    mime_type,
                    file_size,
                    file_hash,
                ),
            )
            return int(cursor.lastrowid)

    def list_attachments(self, project_id: int, wiki_page_id: int | None = None) -> list[AttachmentResult]:
        with get_connection(self.db_path) as conn:
            if wiki_page_id is None:
                rows = conn.execute(
                    """
                    SELECT id, project_id, wiki_page_id, original_name, stored_name, file_path,
                           mime_type, file_size, file_hash
                    FROM attachment
                    WHERE project_id = ?
                    ORDER BY created_at DESC, id DESC
                    """,
                    (project_id,),
                ).fetchall()
            else:
                rows = conn.execute(
                    """
                    SELECT id, project_id, wiki_page_id, original_name, stored_name, file_path,
                           mime_type, file_size, file_hash
                    FROM attachment
                    WHERE project_id = ? AND wiki_page_id = ?
                    ORDER BY created_at DESC, id DESC
                    """,
                    (project_id, wiki_page_id),
                ).fetchall()
            return [
                AttachmentResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    wiki_page_id=row["wiki_page_id"],
                    original_name=row["original_name"],
                    stored_name=row["stored_name"],
                    file_path=row["file_path"],
                    mime_type=row["mime_type"],
                    file_size=row["file_size"],
                    file_hash=row["file_hash"],
                )
                for row in rows
            ]

    def get_attachment(self, project_id: int, attachment_id: int) -> AttachmentResult | None:
        with get_connection(self.db_path) as conn:
            row = conn.execute(
                """
                SELECT id, project_id, wiki_page_id, original_name, stored_name, file_path,
                       mime_type, file_size, file_hash
                FROM attachment
                WHERE project_id = ? AND id = ?
                """,
                (project_id, attachment_id),
            ).fetchone()
            if row is None:
                return None
            return AttachmentResult(
                id=row["id"],
                project_id=row["project_id"],
                wiki_page_id=row["wiki_page_id"],
                original_name=row["original_name"],
                stored_name=row["stored_name"],
                file_path=row["file_path"],
                mime_type=row["mime_type"],
                file_size=row["file_size"],
                file_hash=row["file_hash"],
            )


class ProjectWorkspaceRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_workspace(self, project_id: int, workspace_name: str, workspace_type: str = "", is_active: bool = True) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO project_workspace (project_id, workspace_name, workspace_type, is_active)
                VALUES (?, ?, ?, ?)
                """,
                (project_id, workspace_name, workspace_type, int(is_active)),
            )
            return int(cursor.lastrowid)

    def list_workspaces(self, project_id: int) -> list[ProjectWorkspaceResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, workspace_name, workspace_type, is_active
                FROM project_workspace
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                ProjectWorkspaceResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    workspace_name=row["workspace_name"],
                    workspace_type=row["workspace_type"],
                    is_active=bool(row["is_active"]),
                )
                for row in rows
            ]


class WbsRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_item(
        self,
        project_id: int,
        title: str,
        description: str = "",
        parent_id: int | None = None,
        status: str = "pending",
        priority: str = "normal",
        linked_type: str = "",
        linked_id: int | None = None,
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO wbs_item (
                    project_id, parent_id, title, description, status, priority, linked_type, linked_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (project_id, parent_id, title, description, status, priority, linked_type, linked_id),
            )
            return int(cursor.lastrowid)

    def list_items(self, project_id: int) -> list[WbsItemResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, parent_id, title, description, status, priority, linked_type, linked_id
                FROM wbs_item
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                WbsItemResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    parent_id=row["parent_id"],
                    title=row["title"],
                    description=row["description"],
                    status=row["status"],
                    priority=row["priority"],
                    linked_type=row["linked_type"],
                    linked_id=row["linked_id"],
                )
                for row in rows
            ]

    def get_item_project_id(self, wbs_item_id: int) -> int | None:
        with get_connection(self.db_path) as conn:
            row = conn.execute("SELECT project_id FROM wbs_item WHERE id = ?", (wbs_item_id,)).fetchone()
            return None if row is None else int(row["project_id"])


class DbModelRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_model(self, project_id: int, name: str, description: str = "") -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO db_model (project_id, name, description) VALUES (?, ?, ?)",
                (project_id, name, description),
            )
            return int(cursor.lastrowid)

    def list_models(self, project_id: int) -> list[DbModelResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, name, description
                FROM db_model
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                DbModelResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    name=row["name"],
                    description=row["description"],
                )
                for row in rows
            ]

    def get_model_project_id(self, db_model_id: int) -> int | None:
        with get_connection(self.db_path) as conn:
            row = conn.execute("SELECT project_id FROM db_model WHERE id = ?", (db_model_id,)).fetchone()
            return None if row is None else int(row["project_id"])


class DbTableRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_table(self, db_model_id: int, name: str, description: str = "", primary_key: str = "") -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO db_table (db_model_id, name, description, primary_key) VALUES (?, ?, ?, ?)",
                (db_model_id, name, description, primary_key),
            )
            return int(cursor.lastrowid)

    def list_tables(self, db_model_id: int) -> list[DbTableResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, db_model_id, name, description, primary_key
                FROM db_table
                WHERE db_model_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (db_model_id,),
            ).fetchall()
            return [
                DbTableResult(
                    id=row["id"],
                    db_model_id=row["db_model_id"],
                    name=row["name"],
                    description=row["description"],
                    primary_key=row["primary_key"],
                )
                for row in rows
            ]

    def get_table_project_id(self, db_table_id: int) -> int | None:
        with get_connection(self.db_path) as conn:
            row = conn.execute(
                """
                SELECT dm.project_id
                FROM db_table dt
                JOIN db_model dm ON dm.id = dt.db_model_id
                WHERE dt.id = ?
                """,
                (db_table_id,),
            ).fetchone()
            return None if row is None else int(row["project_id"])


class DbColumnRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_column(
        self,
        db_table_id: int,
        name: str,
        data_type: str,
        nullable: bool = True,
        default_value: str = "",
        is_unique: bool = False,
        is_indexed: bool = False,
        description: str = "",
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO db_column (
                    db_table_id, name, data_type, nullable, default_value, is_unique, is_indexed, description
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    db_table_id,
                    name,
                    data_type,
                    int(nullable),
                    default_value,
                    int(is_unique),
                    int(is_indexed),
                    description,
                ),
            )
            return int(cursor.lastrowid)

    def list_columns(self, db_table_id: int) -> list[DbColumnResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, db_table_id, name, data_type, nullable, default_value, is_unique, is_indexed, description
                FROM db_column
                WHERE db_table_id = ?
                ORDER BY id ASC
                """,
                (db_table_id,),
            ).fetchall()
            return [
                DbColumnResult(
                    id=row["id"],
                    db_table_id=row["db_table_id"],
                    name=row["name"],
                    data_type=row["data_type"],
                    nullable=bool(row["nullable"]),
                    default_value=row["default_value"],
                    is_unique=bool(row["is_unique"]),
                    is_indexed=bool(row["is_indexed"]),
                    description=row["description"],
                )
                for row in rows
            ]


class DbRelationRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_relation(
        self,
        db_model_id: int,
        from_table_id: int,
        to_table_id: int,
        relation_type: str,
        from_column: str = "",
        to_column: str = "",
        description: str = "",
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO db_relation (
                    db_model_id, from_table_id, to_table_id, relation_type, from_column, to_column, description
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (db_model_id, from_table_id, to_table_id, relation_type, from_column, to_column, description),
            )
            return int(cursor.lastrowid)

    def list_relations(self, db_model_id: int) -> list[DbRelationResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, db_model_id, from_table_id, to_table_id, relation_type, from_column, to_column, description
                FROM db_relation
                WHERE db_model_id = ?
                ORDER BY id DESC
                """,
                (db_model_id,),
            ).fetchall()
            return [
                DbRelationResult(
                    id=row["id"],
                    db_model_id=row["db_model_id"],
                    from_table_id=row["from_table_id"],
                    to_table_id=row["to_table_id"],
                    relation_type=row["relation_type"],
                    from_column=row["from_column"],
                    to_column=row["to_column"],
                    description=row["description"],
                )
                for row in rows
            ]


class DiagramRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_diagram(self, project_id: int, name: str, payload_json: str, diagram_type: str = "erd") -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO diagram (project_id, diagram_type, name, payload_json)
                VALUES (?, ?, ?, ?)
                """,
                (project_id, diagram_type, name, payload_json),
            )
            return int(cursor.lastrowid)

    def list_diagrams(self, project_id: int) -> list[DiagramResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, diagram_type, name, payload_json
                FROM diagram
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                DiagramResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    diagram_type=row["diagram_type"],
                    name=row["name"],
                    payload_json=row["payload_json"],
                )
                for row in rows
            ]


class ApiGroupRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_group(self, project_id: int, name: str, description: str = "") -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO api_group (project_id, name, description) VALUES (?, ?, ?)",
                (project_id, name, description),
            )
            return int(cursor.lastrowid)

    def list_groups(self, project_id: int) -> list[ApiGroupResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, name, description
                FROM api_group
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                ApiGroupResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    name=row["name"],
                    description=row["description"],
                )
                for row in rows
            ]

    def get_group_project_id(self, api_group_id: int) -> int | None:
        with get_connection(self.db_path) as conn:
            row = conn.execute("SELECT project_id FROM api_group WHERE id = ?", (api_group_id,)).fetchone()
            return None if row is None else int(row["project_id"])


class ApiSchemaRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_schema(self, project_id: int, name: str, schema_type: str, payload_json: str) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO api_schema (project_id, name, schema_type, payload_json) VALUES (?, ?, ?, ?)",
                (project_id, name, schema_type, payload_json),
            )
            return int(cursor.lastrowid)

    def list_schemas(self, project_id: int) -> list[ApiSchemaResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, name, schema_type, payload_json
                FROM api_schema
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                ApiSchemaResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    name=row["name"],
                    schema_type=row["schema_type"],
                    payload_json=row["payload_json"],
                )
                for row in rows
            ]


class ApiEndpointRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_endpoint(
        self,
        api_group_id: int,
        method: str,
        path: str,
        summary: str = "",
        auth_required: bool = False,
        request_schema_id: int | None = None,
        response_schema_id: int | None = None,
        status_code: int = 200,
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO api_endpoint (
                    api_group_id, method, path, summary, auth_required,
                    request_schema_id, response_schema_id, status_code
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    api_group_id,
                    method.upper(),
                    path,
                    summary,
                    int(auth_required),
                    request_schema_id,
                    response_schema_id,
                    status_code,
                ),
            )
            return int(cursor.lastrowid)

    def list_endpoints(self, api_group_id: int) -> list[ApiEndpointResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, api_group_id, method, path, summary, auth_required,
                       request_schema_id, response_schema_id, status_code
                FROM api_endpoint
                WHERE api_group_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (api_group_id,),
            ).fetchall()
            return [
                ApiEndpointResult(
                    id=row["id"],
                    api_group_id=row["api_group_id"],
                    method=row["method"],
                    path=row["path"],
                    summary=row["summary"],
                    auth_required=bool(row["auth_required"]),
                    request_schema_id=row["request_schema_id"],
                    response_schema_id=row["response_schema_id"],
                    status_code=row["status_code"],
                )
                for row in rows
            ]

    def get_endpoint_project_id(self, api_endpoint_id: int) -> int | None:
        with get_connection(self.db_path) as conn:
            row = conn.execute(
                """
                SELECT ag.project_id
                FROM api_endpoint ae
                JOIN api_group ag ON ag.id = ae.api_group_id
                WHERE ae.id = ?
                """,
                (api_endpoint_id,),
            ).fetchone()
            return None if row is None else int(row["project_id"])


class SampleDatasetRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_dataset(self, project_id: int, name: str, description: str = "", is_shared: bool = False) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO sample_dataset (project_id, name, description, is_shared) VALUES (?, ?, ?, ?)",
                (project_id, name, description, int(is_shared)),
            )
            return int(cursor.lastrowid)

    def create_item(self, sample_dataset_id: int, item_key: str, item_value_json: str) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO sample_dataset_item (sample_dataset_id, item_key, item_value_json) VALUES (?, ?, ?)",
                (sample_dataset_id, item_key, item_value_json),
            )
            return int(cursor.lastrowid)

    def list_datasets(self, project_id: int) -> list[SampleDatasetResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, name, description, is_shared
                FROM sample_dataset
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                SampleDatasetResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    name=row["name"],
                    description=row["description"],
                    is_shared=bool(row["is_shared"]),
                )
                for row in rows
            ]

    def get_dataset_project_id(self, sample_dataset_id: int) -> int | None:
        with get_connection(self.db_path) as conn:
            row = conn.execute("SELECT project_id FROM sample_dataset WHERE id = ?", (sample_dataset_id,)).fetchone()
            return None if row is None else int(row["project_id"])


class ApiAuthProfileRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_profile(self, project_id: int, name: str, auth_type: str, config_json: str, is_default: bool = False) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                "INSERT INTO api_auth_profile (project_id, name, auth_type, config_json, is_default) VALUES (?, ?, ?, ?, ?)",
                (project_id, name, auth_type, config_json, int(is_default)),
            )
            return int(cursor.lastrowid)

    def list_profiles(self, project_id: int) -> list[ApiAuthProfileResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, name, auth_type, config_json, is_default
                FROM api_auth_profile
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                ApiAuthProfileResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    name=row["name"],
                    auth_type=row["auth_type"],
                    config_json=row["config_json"],
                    is_default=bool(row["is_default"]),
                )
                for row in rows
            ]

    def get_profile_project_id(self, api_auth_profile_id: int) -> int | None:
        with get_connection(self.db_path) as conn:
            row = conn.execute("SELECT project_id FROM api_auth_profile WHERE id = ?", (api_auth_profile_id,)).fetchone()
            return None if row is None else int(row["project_id"])


class ApiTestRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_case(
        self,
        project_id: int,
        api_endpoint_id: int,
        request_json: str,
        expected_status_code: int,
        expected_response_json: str,
        auth_profile_id: int | None = None,
        sample_dataset_id: int | None = None,
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO api_test_case (
                    project_id, api_endpoint_id, auth_profile_id, request_json,
                    expected_status_code, expected_response_json, sample_dataset_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project_id,
                    api_endpoint_id,
                    auth_profile_id,
                    request_json,
                    expected_status_code,
                    expected_response_json,
                    sample_dataset_id,
                ),
            )
            return int(cursor.lastrowid)

    def create_result(
        self,
        api_test_case_id: int,
        request_snapshot_json: str,
        response_snapshot_json: str,
        status_code: int,
        result_status: str,
        message: str,
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO api_test_result (
                    api_test_case_id, request_snapshot_json, response_snapshot_json,
                    status_code, result_status, message
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    api_test_case_id,
                    request_snapshot_json,
                    response_snapshot_json,
                    status_code,
                    result_status,
                    message,
                ),
            )
            return int(cursor.lastrowid)

    def list_cases(self, project_id: int) -> list[ApiTestCaseResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, api_endpoint_id, auth_profile_id, request_json,
                       expected_status_code, expected_response_json, sample_dataset_id
                FROM api_test_case
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                ApiTestCaseResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    api_endpoint_id=row["api_endpoint_id"],
                    auth_profile_id=row["auth_profile_id"],
                    request_json=row["request_json"],
                    expected_status_code=row["expected_status_code"],
                    expected_response_json=row["expected_response_json"],
                    sample_dataset_id=row["sample_dataset_id"],
                )
                for row in rows
            ]

    def list_results(self, api_test_case_id: int) -> list[ApiTestResultResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, api_test_case_id, executed_at, request_snapshot_json, response_snapshot_json,
                       status_code, result_status, message
                FROM api_test_result
                WHERE api_test_case_id = ?
                ORDER BY executed_at DESC, id DESC
                """,
                (api_test_case_id,),
            ).fetchall()
            return [
                ApiTestResultResult(
                    id=row["id"],
                    api_test_case_id=row["api_test_case_id"],
                    executed_at=row["executed_at"],
                    request_snapshot_json=row["request_snapshot_json"],
                    response_snapshot_json=row["response_snapshot_json"],
                    status_code=row["status_code"],
                    result_status=row["result_status"],
                    message=row["message"],
                )
                for row in rows
            ]

    def get_case_project_id(self, api_test_case_id: int) -> int | None:
        with get_connection(self.db_path) as conn:
            row = conn.execute("SELECT project_id FROM api_test_case WHERE id = ?", (api_test_case_id,)).fetchone()
            return None if row is None else int(row["project_id"])


class StandardWordRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_dictionary_entry(
        self,
        project_id: int,
        word: str,
        recommended_spelling: str = "",
        note: str = "",
        version_no: int = 1,
        created_by: str = "",
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO standard_word_dictionary (
                    project_id, word, recommended_spelling, note, version_no, created_by
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (project_id, word, recommended_spelling, note, version_no, created_by),
            )
            return int(cursor.lastrowid)

    def create_check_result(
        self,
        project_id: int,
        vo_name: str,
        field_name: str = "",
        extracted_words: str = "",
        unmatched_words: str = "",
        match_status: str = "pending",
        recommended_spelling: str = "",
        note: str = "",
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO standard_word_check_result (
                    project_id, vo_name, field_name, extracted_words, unmatched_words,
                    match_status, recommended_spelling, note
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project_id,
                    vo_name,
                    field_name,
                    extracted_words,
                    unmatched_words,
                    match_status,
                    recommended_spelling,
                    note,
                ),
            )
            return int(cursor.lastrowid)

    def list_dictionary_entries(self, project_id: int) -> list[StandardWordDictionaryResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, word, recommended_spelling, note, version_no, created_by, created_at
                FROM standard_word_dictionary
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                StandardWordDictionaryResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    word=row["word"],
                    recommended_spelling=row["recommended_spelling"],
                    note=row["note"],
                    version_no=row["version_no"],
                    created_by=row["created_by"],
                    created_at=row["created_at"],
                )
                for row in rows
            ]

    def list_check_results(self, project_id: int) -> list[StandardWordCheckResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, vo_name, field_name, extracted_words, unmatched_words,
                       match_status, recommended_spelling, note, created_at
                FROM standard_word_check_result
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                StandardWordCheckResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    vo_name=row["vo_name"],
                    field_name=row["field_name"],
                    extracted_words=row["extracted_words"],
                    unmatched_words=row["unmatched_words"],
                    match_status=row["match_status"],
                    recommended_spelling=row["recommended_spelling"],
                    note=row["note"],
                    created_at=row["created_at"],
                )
                for row in rows
            ]


class AccessLogRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        initialize_database(db_path)

    def create_log(
        self,
        project_id: int,
        actor: str,
        action: str,
        target_type: str,
        target_id: int | None = None,
        ip_address: str = "",
    ) -> int:
        with get_connection(self.db_path) as conn:
            cursor = conn.execute(
                """
                INSERT INTO access_log (project_id, actor, action, target_type, target_id, ip_address)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (project_id, actor, action, target_type, target_id, ip_address),
            )
            return int(cursor.lastrowid)

    def list_logs(self, project_id: int) -> list[AccessLogResult]:
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT id, project_id, actor, action, target_type, target_id, ip_address, created_at
                FROM access_log
                WHERE project_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (project_id,),
            ).fetchall()
            return [
                AccessLogResult(
                    id=row["id"],
                    project_id=row["project_id"],
                    actor=row["actor"],
                    action=row["action"],
                    target_type=row["target_type"],
                    target_id=row["target_id"],
                    ip_address=row["ip_address"],
                    created_at=row["created_at"],
                )
                for row in rows
            ]
