from __future__ import annotations

import argparse
import csv
import json
from dataclasses import asdict
from pathlib import Path

from .db import get_connection, initialize_database
from .webapp import serve_dashboard
from .repository import (
    ApiEndpointRepository,
    ApiGroupRepository,
    ApiAuthProfileRepository,
    ApiSchemaRepository,
    ApiTestRepository,
    AccessLogRepository,
    ProjectRepository,
    ProjectWorkspaceRepository,
    StandardWordRepository,
    DbColumnRepository,
    DiagramRepository,
    DbModelRepository,
    DbTableRepository,
    DbRelationRepository,
    SecurityIssueRepository,
    SecurityScanRepository,
    SourceCodeScanRepository,
    SourceScanRepository,
    SampleDatasetRepository,
    WikiRepository,
    WbsRepository,
)


def ensure_project_writable(repository: ProjectRepository, project_id: int) -> None:
    if repository.get_project_share(project_id).is_readonly:
        raise PermissionError(f"Project {project_id} is readonly")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="aastudio", description="AAStudio local workspace scaffold")

    subparsers = parser.add_subparsers(dest="command", required=True)
    def add_db_argument(command_parser: argparse.ArgumentParser) -> None:
        command_parser.add_argument("--db", default="data/aastudio.sqlite3", help="Path to the SQLite database file.")

    init_parser = subparsers.add_parser("init-db", help="Create the SQLite schema.")
    add_db_argument(init_parser)

    create_parser = subparsers.add_parser("create-project", help="Create a project record.")
    add_db_argument(create_parser)
    create_parser.add_argument("name")
    create_parser.add_argument("root_path")
    create_parser.add_argument("--description", default="")

    copy_parser = subparsers.add_parser("copy-project", help="Copy an existing project record.")
    add_db_argument(copy_parser)
    copy_parser.add_argument("project_id", type=int)
    copy_parser.add_argument("name")
    copy_parser.add_argument("--root-path")

    delete_parser = subparsers.add_parser("delete-project", help="Delete a project record.")
    add_db_argument(delete_parser)
    delete_parser.add_argument("project_id", type=int)

    list_parser = subparsers.add_parser("list-projects", help="List projects.")
    add_db_argument(list_parser)

    search_parser = subparsers.add_parser("search-projects", help="Search projects.")
    add_db_argument(search_parser)
    search_parser.add_argument("query")

    recent_parser = subparsers.add_parser("recent-projects", help="List recent projects.")
    add_db_argument(recent_parser)
    recent_parser.add_argument("--limit", type=int, default=10)

    share_set_parser = subparsers.add_parser("set-project-share", help="Set project readonly sharing state.")
    add_db_argument(share_set_parser)
    share_set_parser.add_argument("project_id", type=int)
    share_set_parser.add_argument("--readonly", action="store_true")
    share_set_parser.add_argument("--scope", default="external")
    share_set_parser.add_argument("--note", default="")

    share_show_parser = subparsers.add_parser("show-project-share", help="Show project sharing state.")
    add_db_argument(share_show_parser)
    share_show_parser.add_argument("project_id", type=int)

    export_parser = subparsers.add_parser("export-project", help="Export a project bundle to JSON.")
    add_db_argument(export_parser)
    export_parser.add_argument("project_id", type=int)
    export_parser.add_argument("output_path")

    import_parser = subparsers.add_parser("import-project", help="Import a project bundle from JSON.")
    add_db_argument(import_parser)
    import_parser.add_argument("input_path")
    import_parser.add_argument("name")
    import_parser.add_argument("root_path")

    dashboard_parser = subparsers.add_parser("show-dashboard", help="Show a project dashboard summary.")
    add_db_argument(dashboard_parser)
    dashboard_parser.add_argument("project_id", type=int)
    dashboard_parser.add_argument("--stage")
    dashboard_parser.add_argument("--summary")

    overview_parser = subparsers.add_parser("show-overview", help="Show a project artifact overview.")
    add_db_argument(overview_parser)
    overview_parser.add_argument("project_id", type=int)

    serve_parser = subparsers.add_parser("serve-dashboard", help="Serve the local HTML dashboard.")
    add_db_argument(serve_parser)
    serve_parser.add_argument("--host", default="127.0.0.1")
    serve_parser.add_argument("--port", type=int, default=8000)

    stage_assign_create_parser = subparsers.add_parser("create-stage-assignment", help="Assign a person to a project stage.")
    add_db_argument(stage_assign_create_parser)
    stage_assign_create_parser.add_argument("project_id", type=int)
    stage_assign_create_parser.add_argument("stage_name")
    stage_assign_create_parser.add_argument("--assignee-name", default="")
    stage_assign_create_parser.add_argument("--assignee-title", default="")
    stage_assign_create_parser.add_argument("--assignee-phone", default="")
    stage_assign_create_parser.add_argument("--assignee-email", default="")
    stage_assign_create_parser.add_argument("--related-item-type", default="")
    stage_assign_create_parser.add_argument("--related-item-id", type=int)
    stage_assign_create_parser.add_argument("--status", default="open")

    stage_assign_list_parser = subparsers.add_parser("list-stage-assignments", help="List project stage assignments.")
    add_db_argument(stage_assign_list_parser)
    stage_assign_list_parser.add_argument("project_id", type=int)

    stage_history_create_parser = subparsers.add_parser("create-stage-history", help="Create a project stage history entry.")
    add_db_argument(stage_history_create_parser)
    stage_history_create_parser.add_argument("project_id", type=int)
    stage_history_create_parser.add_argument("stage_name")
    stage_history_create_parser.add_argument("before_status")
    stage_history_create_parser.add_argument("after_status")
    stage_history_create_parser.add_argument("--changed-by", default="")
    stage_history_create_parser.add_argument("--change-note", default="")

    stage_history_list_parser = subparsers.add_parser("list-stage-history", help="List project stage history entries.")
    add_db_argument(stage_history_list_parser)
    stage_history_list_parser.add_argument("project_id", type=int)

    scan_parser = subparsers.add_parser("scan-source", help="Scan a source directory and store metadata.")
    add_db_argument(scan_parser)
    scan_parser.add_argument("project_id", type=int)
    scan_parser.add_argument("scan_path")

    scan_export_parser = subparsers.add_parser("export-source-scan", help="Export a source scan summary bundle.")
    add_db_argument(scan_export_parser)
    scan_export_parser.add_argument("project_id", type=int)
    scan_export_parser.add_argument("output_path")
    scan_export_parser.add_argument("--format", choices=["md", "json"], default="md")

    code_scan_parser = subparsers.add_parser("scan-code", help="Create a simple source code finding from a scan.")
    add_db_argument(code_scan_parser)
    code_scan_parser.add_argument("project_id", type=int)
    code_scan_parser.add_argument("source_scan_id", type=int)
    code_scan_parser.add_argument("file_path")
    code_scan_parser.add_argument("--rule-name", default="todo-comment")
    code_scan_parser.add_argument("--severity", default="minor")
    code_scan_parser.add_argument("--summary", default="Potential review item found.")
    code_scan_parser.add_argument("--detail", default="A simple rule-based finding was recorded.")
    code_scan_parser.add_argument("--line-from", type=int)
    code_scan_parser.add_argument("--line-to", type=int)
    code_scan_parser.add_argument("--confidence", type=float, default=0.5)

    code_scan_export_parser = subparsers.add_parser("export-code-scan", help="Export a source code scan report bundle.")
    add_db_argument(code_scan_export_parser)
    code_scan_export_parser.add_argument("project_id", type=int)
    code_scan_export_parser.add_argument("output_path")
    code_scan_export_parser.add_argument("--format", choices=["md", "json"], default="md")

    security_scan_parser = subparsers.add_parser("scan-security", help="Create a simple security scan and issue.")
    add_db_argument(security_scan_parser)
    security_scan_parser.add_argument("project_id", type=int)
    security_scan_parser.add_argument("source_scan_id", type=int)
    security_scan_parser.add_argument("file_path")
    security_scan_parser.add_argument("--category", default="input-validation")
    security_scan_parser.add_argument("--title", default="Potential security review item found.")
    security_scan_parser.add_argument("--description", default="A rule-based security candidate was recorded.")
    security_scan_parser.add_argument("--line-from", type=int)
    security_scan_parser.add_argument("--line-to", type=int)
    security_scan_parser.add_argument("--risk-level", default="medium")
    security_scan_parser.add_argument("--evidence", default="Source scan metadata suggests a candidate review point.")
    security_scan_parser.add_argument("--recommendation", default="Review the relevant code path and validate the input handling.")

    security_report_parser = subparsers.add_parser("export-security-report", help="Export a security candidate report markdown file.")
    add_db_argument(security_report_parser)
    security_report_parser.add_argument("project_id", type=int)
    security_report_parser.add_argument("output_path")

    security_csv_parser = subparsers.add_parser("export-security-csv", help="Export security candidate issues as CSV.")
    add_db_argument(security_csv_parser)
    security_csv_parser.add_argument("project_id", type=int)
    security_csv_parser.add_argument("output_path")

    wiki_create_parser = subparsers.add_parser("create-wiki", help="Create a wiki page with an initial version.")
    add_db_argument(wiki_create_parser)
    wiki_create_parser.add_argument("project_id", type=int)
    wiki_create_parser.add_argument("title")
    wiki_create_parser.add_argument("slug")
    wiki_create_parser.add_argument("content")
    wiki_create_parser.add_argument("--tags", default="")
    wiki_create_parser.add_argument("--created-by", default="")

    wiki_list_parser = subparsers.add_parser("list-wiki", help="List wiki pages for a project.")
    add_db_argument(wiki_list_parser)
    wiki_list_parser.add_argument("project_id", type=int)

    wiki_versions_parser = subparsers.add_parser("list-wiki-versions", help="List wiki versions for a page.")
    add_db_argument(wiki_versions_parser)
    wiki_versions_parser.add_argument("wiki_page_id", type=int)

    wiki_restore_parser = subparsers.add_parser("restore-wiki-version", help="Restore a wiki page to a previous version.")
    add_db_argument(wiki_restore_parser)
    wiki_restore_parser.add_argument("wiki_page_id", type=int)
    wiki_restore_parser.add_argument("version_no", type=int)
    wiki_restore_parser.add_argument("--restored-by", default="")

    attachment_add_parser = subparsers.add_parser("add-attachment", help="Add a wiki/project attachment record.")
    add_db_argument(attachment_add_parser)
    attachment_add_parser.add_argument("project_id", type=int)
    attachment_add_parser.add_argument("original_name")
    attachment_add_parser.add_argument("stored_name")
    attachment_add_parser.add_argument("file_path")
    attachment_add_parser.add_argument("--wiki-page-id", type=int)
    attachment_add_parser.add_argument("--mime-type", default="")
    attachment_add_parser.add_argument("--file-size", type=int, default=0)
    attachment_add_parser.add_argument("--file-hash", default="")

    attachment_list_parser = subparsers.add_parser("list-attachments", help="List attachments for a project.")
    add_db_argument(attachment_list_parser)
    attachment_list_parser.add_argument("project_id", type=int)
    attachment_list_parser.add_argument("--wiki-page-id", type=int)

    workspace_create_parser = subparsers.add_parser("create-workspace", help="Create a project workspace record.")
    add_db_argument(workspace_create_parser)
    workspace_create_parser.add_argument("project_id", type=int)
    workspace_create_parser.add_argument("workspace_name")
    workspace_create_parser.add_argument("--workspace-type", default="")
    workspace_create_parser.add_argument("--inactive", action="store_true")

    workspace_list_parser = subparsers.add_parser("list-workspaces", help="List project workspaces.")
    add_db_argument(workspace_list_parser)
    workspace_list_parser.add_argument("project_id", type=int)

    wbs_create_parser = subparsers.add_parser("create-wbs", help="Create a WBS item.")
    add_db_argument(wbs_create_parser)
    wbs_create_parser.add_argument("project_id", type=int)
    wbs_create_parser.add_argument("title")
    wbs_create_parser.add_argument("--description", default="")
    wbs_create_parser.add_argument("--parent-id", type=int)
    wbs_create_parser.add_argument("--status", default="pending")
    wbs_create_parser.add_argument("--priority", default="normal")
    wbs_create_parser.add_argument("--linked-type", default="")
    wbs_create_parser.add_argument("--linked-id", type=int)

    wbs_list_parser = subparsers.add_parser("list-wbs", help="List WBS items for a project.")
    add_db_argument(wbs_list_parser)
    wbs_list_parser.add_argument("project_id", type=int)

    wiki_export_parser = subparsers.add_parser("export-wiki", help="Export a wiki summary bundle.")
    add_db_argument(wiki_export_parser)
    wiki_export_parser.add_argument("project_id", type=int)
    wiki_export_parser.add_argument("output_path")
    wiki_export_parser.add_argument("--format", choices=["md", "json"], default="md")

    wbs_export_parser = subparsers.add_parser("export-wbs", help="Export a WBS summary bundle.")
    add_db_argument(wbs_export_parser)
    wbs_export_parser.add_argument("project_id", type=int)
    wbs_export_parser.add_argument("output_path")
    wbs_export_parser.add_argument("--format", choices=["md", "json"], default="md")

    db_model_create_parser = subparsers.add_parser("create-db-model", help="Create a DB model.")
    add_db_argument(db_model_create_parser)
    db_model_create_parser.add_argument("project_id", type=int)
    db_model_create_parser.add_argument("name")
    db_model_create_parser.add_argument("--description", default="")

    db_model_list_parser = subparsers.add_parser("list-db-models", help="List DB models for a project.")
    add_db_argument(db_model_list_parser)
    db_model_list_parser.add_argument("project_id", type=int)

    db_table_create_parser = subparsers.add_parser("create-db-table", help="Create a DB table.")
    add_db_argument(db_table_create_parser)
    db_table_create_parser.add_argument("db_model_id", type=int)
    db_table_create_parser.add_argument("name")
    db_table_create_parser.add_argument("--description", default="")
    db_table_create_parser.add_argument("--primary-key", default="")

    db_table_list_parser = subparsers.add_parser("list-db-tables", help="List DB tables for a model.")
    add_db_argument(db_table_list_parser)
    db_table_list_parser.add_argument("db_model_id", type=int)

    db_column_create_parser = subparsers.add_parser("create-db-column", help="Create a DB column.")
    add_db_argument(db_column_create_parser)
    db_column_create_parser.add_argument("db_table_id", type=int)
    db_column_create_parser.add_argument("name")
    db_column_create_parser.add_argument("data_type")
    db_column_create_parser.add_argument("--nullable", action="store_true", help="Mark the column as nullable.")
    db_column_create_parser.add_argument("--default-value", default="")
    db_column_create_parser.add_argument("--unique", action="store_true")
    db_column_create_parser.add_argument("--indexed", action="store_true")
    db_column_create_parser.add_argument("--description", default="")

    db_column_list_parser = subparsers.add_parser("list-db-columns", help="List DB columns for a table.")
    add_db_argument(db_column_list_parser)
    db_column_list_parser.add_argument("db_table_id", type=int)

    db_relation_create_parser = subparsers.add_parser("create-db-relation", help="Create a DB relation.")
    add_db_argument(db_relation_create_parser)
    db_relation_create_parser.add_argument("db_model_id", type=int)
    db_relation_create_parser.add_argument("from_table_id", type=int)
    db_relation_create_parser.add_argument("to_table_id", type=int)
    db_relation_create_parser.add_argument("relation_type")
    db_relation_create_parser.add_argument("--from-column", default="")
    db_relation_create_parser.add_argument("--to-column", default="")
    db_relation_create_parser.add_argument("--description", default="")

    db_relation_list_parser = subparsers.add_parser("list-db-relations", help="List DB relations for a model.")
    add_db_argument(db_relation_list_parser)
    db_relation_list_parser.add_argument("db_model_id", type=int)

    db_export_parser = subparsers.add_parser("export-db-design", help="Export a DB design or ERD artifact.")
    add_db_argument(db_export_parser)
    db_export_parser.add_argument("project_id", type=int)
    db_export_parser.add_argument("output_path")
    db_export_parser.add_argument("--format", choices=["md", "json", "sql"], default="md")

    diagram_create_parser = subparsers.add_parser("create-diagram", help="Create a diagram payload.")
    add_db_argument(diagram_create_parser)
    diagram_create_parser.add_argument("project_id", type=int)
    diagram_create_parser.add_argument("name")
    diagram_create_parser.add_argument("payload_json")
    diagram_create_parser.add_argument("--diagram-type", default="erd")

    diagram_list_parser = subparsers.add_parser("list-diagrams", help="List diagrams for a project.")
    add_db_argument(diagram_list_parser)
    diagram_list_parser.add_argument("project_id", type=int)

    diagram_export_parser = subparsers.add_parser("export-diagram", help="Export diagram payloads as an ERD bundle.")
    add_db_argument(diagram_export_parser)
    diagram_export_parser.add_argument("project_id", type=int)
    diagram_export_parser.add_argument("output_path")
    diagram_export_parser.add_argument("--format", choices=["md", "json"], default="md")

    api_group_create_parser = subparsers.add_parser("create-api-group", help="Create an API group.")
    add_db_argument(api_group_create_parser)
    api_group_create_parser.add_argument("project_id", type=int)
    api_group_create_parser.add_argument("name")
    api_group_create_parser.add_argument("--description", default="")

    api_group_list_parser = subparsers.add_parser("list-api-groups", help="List API groups for a project.")
    add_db_argument(api_group_list_parser)
    api_group_list_parser.add_argument("project_id", type=int)

    api_schema_create_parser = subparsers.add_parser("create-api-schema", help="Create an API schema.")
    add_db_argument(api_schema_create_parser)
    api_schema_create_parser.add_argument("project_id", type=int)
    api_schema_create_parser.add_argument("name")
    api_schema_create_parser.add_argument("schema_type")
    api_schema_create_parser.add_argument("payload_json")

    api_schema_list_parser = subparsers.add_parser("list-api-schemas", help="List API schemas for a project.")
    add_db_argument(api_schema_list_parser)
    api_schema_list_parser.add_argument("project_id", type=int)

    api_endpoint_create_parser = subparsers.add_parser("create-api-endpoint", help="Create an API endpoint.")
    add_db_argument(api_endpoint_create_parser)
    api_endpoint_create_parser.add_argument("api_group_id", type=int)
    api_endpoint_create_parser.add_argument("method")
    api_endpoint_create_parser.add_argument("path")
    api_endpoint_create_parser.add_argument("--summary", default="")
    api_endpoint_create_parser.add_argument("--auth-required", action="store_true")
    api_endpoint_create_parser.add_argument("--request-schema-id", type=int)
    api_endpoint_create_parser.add_argument("--response-schema-id", type=int)
    api_endpoint_create_parser.add_argument("--status-code", type=int, default=200)

    api_endpoint_list_parser = subparsers.add_parser("list-api-endpoints", help="List API endpoints for a group.")
    add_db_argument(api_endpoint_list_parser)
    api_endpoint_list_parser.add_argument("api_group_id", type=int)

    api_spec_parser = subparsers.add_parser("export-api-spec", help="Export an API specification bundle.")
    add_db_argument(api_spec_parser)
    api_spec_parser.add_argument("project_id", type=int)
    api_spec_parser.add_argument("output_path")
    api_spec_parser.add_argument("--format", choices=["json", "yaml", "md"], default="md")

    api_sync_parser = subparsers.add_parser("export-api-sync", help="Export an API sync review report bundle.")
    add_db_argument(api_sync_parser)
    api_sync_parser.add_argument("project_id", type=int)
    api_sync_parser.add_argument("output_path")
    api_sync_parser.add_argument("--format", choices=["json", "md"], default="md")

    api_test_report_parser = subparsers.add_parser("export-api-test-report", help="Export an API test report bundle.")
    add_db_argument(api_test_report_parser)
    api_test_report_parser.add_argument("project_id", type=int)
    api_test_report_parser.add_argument("output_path")
    api_test_report_parser.add_argument("--format", choices=["json", "md"], default="md")

    sample_dataset_create_parser = subparsers.add_parser("create-sample-dataset", help="Create a sample dataset.")
    add_db_argument(sample_dataset_create_parser)
    sample_dataset_create_parser.add_argument("project_id", type=int)
    sample_dataset_create_parser.add_argument("name")
    sample_dataset_create_parser.add_argument("--description", default="")
    sample_dataset_create_parser.add_argument("--shared", action="store_true")

    sample_dataset_item_parser = subparsers.add_parser("add-sample-item", help="Add an item to a sample dataset.")
    add_db_argument(sample_dataset_item_parser)
    sample_dataset_item_parser.add_argument("sample_dataset_id", type=int)
    sample_dataset_item_parser.add_argument("item_key")
    sample_dataset_item_parser.add_argument("item_value_json")

    sample_dataset_list_parser = subparsers.add_parser("list-sample-datasets", help="List sample datasets.")
    add_db_argument(sample_dataset_list_parser)
    sample_dataset_list_parser.add_argument("project_id", type=int)

    stdword_add_parser = subparsers.add_parser("create-standard-word", help="Create a standard word dictionary entry.")
    add_db_argument(stdword_add_parser)
    stdword_add_parser.add_argument("project_id", type=int)
    stdword_add_parser.add_argument("word")
    stdword_add_parser.add_argument("--recommended-spelling", default="")
    stdword_add_parser.add_argument("--note", default="")
    stdword_add_parser.add_argument("--version-no", type=int, default=1)
    stdword_add_parser.add_argument("--created-by", default="")

    stdword_check_parser = subparsers.add_parser("create-standard-word-check", help="Create a standard word check result.")
    add_db_argument(stdword_check_parser)
    stdword_check_parser.add_argument("project_id", type=int)
    stdword_check_parser.add_argument("vo_name")
    stdword_check_parser.add_argument("--field-name", default="")
    stdword_check_parser.add_argument("--extracted-words", default="")
    stdword_check_parser.add_argument("--unmatched-words", default="")
    stdword_check_parser.add_argument("--match-status", default="pending")
    stdword_check_parser.add_argument("--recommended-spelling", default="")
    stdword_check_parser.add_argument("--note", default="")

    stdword_list_parser = subparsers.add_parser("list-standard-words", help="List standard word dictionary entries.")
    add_db_argument(stdword_list_parser)
    stdword_list_parser.add_argument("project_id", type=int)

    stdword_check_list_parser = subparsers.add_parser("list-standard-word-checks", help="List standard word check results.")
    add_db_argument(stdword_check_list_parser)
    stdword_check_list_parser.add_argument("project_id", type=int)

    stdword_run_parser = subparsers.add_parser("run-standard-word-check", help="Scan a source tree and create standard word check results.")
    add_db_argument(stdword_run_parser)
    stdword_run_parser.add_argument("project_id", type=int)
    stdword_run_parser.add_argument("scan_path")

    stdword_report_parser = subparsers.add_parser("export-standard-word-report", help="Export a standard word report markdown file.")
    add_db_argument(stdword_report_parser)
    stdword_report_parser.add_argument("project_id", type=int)
    stdword_report_parser.add_argument("output_path")

    stdword_csv_parser = subparsers.add_parser("export-standard-word-csv", help="Export standard word results as CSV.")
    add_db_argument(stdword_csv_parser)
    stdword_csv_parser.add_argument("project_id", type=int)
    stdword_csv_parser.add_argument("output_path")

    auth_profile_create_parser = subparsers.add_parser("create-auth-profile", help="Create an API auth profile.")
    add_db_argument(auth_profile_create_parser)
    auth_profile_create_parser.add_argument("project_id", type=int)
    auth_profile_create_parser.add_argument("name")
    auth_profile_create_parser.add_argument("auth_type")
    auth_profile_create_parser.add_argument("config_json")
    auth_profile_create_parser.add_argument("--default", action="store_true")

    auth_profile_list_parser = subparsers.add_parser("list-auth-profiles", help="List API auth profiles.")
    add_db_argument(auth_profile_list_parser)
    auth_profile_list_parser.add_argument("project_id", type=int)

    api_test_create_parser = subparsers.add_parser("create-api-test-case", help="Create an API test case.")
    add_db_argument(api_test_create_parser)
    api_test_create_parser.add_argument("project_id", type=int)
    api_test_create_parser.add_argument("api_endpoint_id", type=int)
    api_test_create_parser.add_argument("request_json")
    api_test_create_parser.add_argument("expected_status_code", type=int)
    api_test_create_parser.add_argument("expected_response_json")
    api_test_create_parser.add_argument("--auth-profile-id", type=int)
    api_test_create_parser.add_argument("--sample-dataset-id", type=int)

    api_test_list_parser = subparsers.add_parser("list-api-test-cases", help="List API test cases.")
    add_db_argument(api_test_list_parser)
    api_test_list_parser.add_argument("project_id", type=int)

    api_test_result_parser = subparsers.add_parser("add-api-test-result", help="Add an API test result snapshot.")
    add_db_argument(api_test_result_parser)
    api_test_result_parser.add_argument("api_test_case_id", type=int)
    api_test_result_parser.add_argument("request_snapshot_json")
    api_test_result_parser.add_argument("response_snapshot_json")
    api_test_result_parser.add_argument("status_code", type=int)
    api_test_result_parser.add_argument("result_status")
    api_test_result_parser.add_argument("message")

    api_test_result_list_parser = subparsers.add_parser("list-api-test-results", help="List API test results.")
    add_db_argument(api_test_result_list_parser)
    api_test_result_list_parser.add_argument("api_test_case_id", type=int)

    access_log_create_parser = subparsers.add_parser("create-access-log", help="Create an access log entry.")
    add_db_argument(access_log_create_parser)
    access_log_create_parser.add_argument("project_id", type=int)
    access_log_create_parser.add_argument("actor")
    access_log_create_parser.add_argument("action")
    access_log_create_parser.add_argument("target_type")
    access_log_create_parser.add_argument("--target-id", type=int)
    access_log_create_parser.add_argument("--ip-address", default="")

    access_log_list_parser = subparsers.add_parser("list-access-logs", help="List access logs for a project.")
    add_db_argument(access_log_list_parser)
    access_log_list_parser.add_argument("project_id", type=int)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    db_path = Path(args.db)

    if args.command == "init-db":
        initialize_database(db_path)
        print(f"Initialized database at {db_path}")
        return

    repository = ProjectRepository(db_path)
    scan_repository = SourceScanRepository(db_path)
    code_scan_repository = SourceCodeScanRepository(db_path)
    security_scan_repository = SecurityScanRepository(db_path)
    security_issue_repository = SecurityIssueRepository(db_path)
    wiki_repository = WikiRepository(db_path)
    workspace_repository = ProjectWorkspaceRepository(db_path)
    wbs_repository = WbsRepository(db_path)
    db_model_repository = DbModelRepository(db_path)
    db_table_repository = DbTableRepository(db_path)
    db_column_repository = DbColumnRepository(db_path)
    db_relation_repository = DbRelationRepository(db_path)
    diagram_repository = DiagramRepository(db_path)
    api_group_repository = ApiGroupRepository(db_path)
    sample_dataset_repository = SampleDatasetRepository(db_path)
    api_auth_profile_repository = ApiAuthProfileRepository(db_path)
    api_test_repository = ApiTestRepository(db_path)
    access_log_repository = AccessLogRepository(db_path)
    standard_word_repository = StandardWordRepository(db_path)
    api_schema_repository = ApiSchemaRepository(db_path)
    api_endpoint_repository = ApiEndpointRepository(db_path)

    if args.command == "create-project":
        project_id = repository.create_project(args.name, args.root_path, args.description)
        print(f"Created project {project_id}: {args.name}")
        return

    if args.command == "copy-project":
        project_id = repository.copy_project(args.project_id, args.name, args.root_path)
        print(f"Copied project {args.project_id} to {project_id}: {args.name}")
        return

    if args.command == "delete-project":
        repository.delete_project(args.project_id)
        print(f"Deleted project {args.project_id}")
        return

    if args.command == "list-projects":
        for project in repository.list_projects():
            stage = project.current_stage or "planning"
            share = "readonly" if project.is_readonly else "internal"
            print(f"{project.id}\t{project.name}\t{stage}\t{share}\t{project.root_path}")
        return

    if args.command == "search-projects":
        for project in repository.search_projects(args.query):
            stage = project.current_stage or "planning"
            share = "readonly" if project.is_readonly else "internal"
            print(f"{project.id}\t{project.name}\t{stage}\t{share}\t{project.root_path}")
        return

    if args.command == "recent-projects":
        for project in repository.get_recent_projects(args.limit):
            stage = project.current_stage or "planning"
            share = "readonly" if project.is_readonly else "internal"
            print(f"{project.id}\t{project.name}\t{stage}\t{share}\t{project.root_path}")
        return

    if args.command == "set-project-share":
        repository.set_project_share(args.project_id, args.readonly, args.scope, args.note)
        print(f"Updated project share {args.project_id}: {'readonly' if args.readonly else 'internal'}")
        return

    if args.command == "show-project-share":
        share = repository.get_project_share(args.project_id)
        state = "readonly" if share.is_readonly else "internal"
        print(f"Project {share.project_id}: {state} / {share.share_scope} / {share.note or '-'}")
        return

    if args.command == "export-project":
        bundle = repository.export_project_bundle(args.project_id)
        Path(args.output_path).write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Exported project {args.project_id} to {args.output_path}")
        return

    if args.command == "import-project":
        bundle = json.loads(Path(args.input_path).read_text(encoding="utf-8"))
        project_id = repository.import_project_bundle(bundle, args.name, args.root_path)
        print(f"Imported project {project_id}: {args.name}")
        return

    if args.command == "show-dashboard":
        if args.stage is not None or args.summary is not None:
            ensure_project_writable(repository, args.project_id)
            repository.update_dashboard(args.project_id, args.stage, args.summary)
        dashboard = repository.get_dashboard_summary(args.project_id)
        print(f"Project: {dashboard.project_name} ({dashboard.project_id})")
        print(f"Stage: {dashboard.current_stage}")
        print(f"Summary: {dashboard.summary or '-'}")
        if dashboard.latest_source_scan_id is not None:
            print(
                "Latest source scan: "
                f"#{dashboard.latest_source_scan_id} "
                f"{dashboard.latest_source_scan_language or 'unknown'} / "
                f"{dashboard.latest_source_scan_framework or 'unknown'} / "
                f"{dashboard.latest_source_scan_path or '-'}"
            )
        else:
            print("Latest source scan: -")
        if dashboard.latest_security_scan_id is not None:
            print(
                "Latest security issue: "
                f"scan #{dashboard.latest_security_scan_id} / "
                f"{dashboard.latest_security_issue_title or '-'} / "
                f"{dashboard.latest_security_issue_risk_level or '-'}"
            )
        else:
            print("Latest security issue: -")
        if dashboard.latest_api_test_case_id is not None:
            print(
                "Latest API test: "
                f"case #{dashboard.latest_api_test_case_id} / "
                f"{dashboard.latest_api_test_status_code or '-'} / "
                f"{dashboard.latest_api_test_result_status or '-'} / "
                f"{dashboard.latest_api_test_message or '-'}"
            )
        else:
            print("Latest API test: -")
        return

    if args.command == "show-overview":
        overview = repository.get_overview_summary(args.project_id)
        print(f"Project: {overview.project_name} ({overview.project_id})")
        print(f"Stage: {overview.current_stage}")
        print(f"Source scans: {overview.source_scans}")
        print(f"Source code findings: {overview.source_code_findings}")
        print(f"Security scans: {overview.security_scans}")
        print(f"Security issues: {overview.security_issues}")
        print(f"Wiki pages: {overview.wiki_pages}")
        print(f"WBS items: {overview.wbs_items}")
        print(f"DB models: {overview.db_models}")
        print(f"DB relations: {overview.db_relations}")
        print(f"Diagrams: {overview.diagrams}")
        print(f"API groups: {overview.api_groups}")
        print(f"API endpoints: {overview.api_endpoints}")
        print(f"Sample datasets: {overview.sample_datasets}")
        print(f"API test cases: {overview.api_test_cases}")
        print(f"API test results: {overview.api_test_results}")
        print(f"Access logs: {overview.access_logs}")
        print(f"Attachments: {overview.attachments}")
        print(f"Workspaces: {overview.workspaces}")
        print(f"Standard words: {overview.standard_words}")
        print(f"Standard word checks: {overview.standard_word_checks}")
        return

    if args.command == "serve-dashboard":
        serve_dashboard(db_path, args.host, args.port)
        return

    if args.command == "create-stage-assignment":
        ensure_project_writable(repository, args.project_id)
        assignment_id = repository.create_stage_assignment(
            args.project_id,
            args.stage_name,
            args.assignee_name,
            args.assignee_title,
            args.assignee_phone,
            args.assignee_email,
            args.related_item_type,
            args.related_item_id,
            args.status,
        )
        print(f"Created stage assignment {assignment_id}: {args.stage_name}")
        return

    if args.command == "list-stage-assignments":
        for assignment in repository.list_stage_assignments(args.project_id):
            assignee = assignment.assignee_name or "-"
            print(f"{assignment.id}\t{assignment.stage_name}\t{assignee}\t{assignment.status}")
        return

    if args.command == "create-stage-history":
        ensure_project_writable(repository, args.project_id)
        history_id = repository.create_stage_history(
            args.project_id,
            args.stage_name,
            args.before_status,
            args.after_status,
            args.changed_by,
            args.change_note,
        )
        print(f"Created stage history {history_id}: {args.stage_name} {args.before_status} -> {args.after_status}")
        return

    if args.command == "list-stage-history":
        for history in repository.list_stage_history(args.project_id):
            print(
                f"{history.id}\t{history.stage_name}\t{history.before_status}\t"
                f"{history.after_status}\t{history.changed_by}"
            )
        return

    if args.command == "scan-source":
        ensure_project_writable(repository, args.project_id)
        scan_path = Path(args.scan_path)
        if not scan_path.exists():
            raise FileNotFoundError(scan_path)
        language, framework = detect_language_and_framework(scan_path)
        file_count = count_files(scan_path)
        scan_id = scan_repository.create_scan(
            args.project_id,
            str(scan_path),
            language,
            framework,
            file_count,
        )
        print(
            f"Created source scan {scan_id} for project {args.project_id}: "
            f"{language or 'unknown'} / {framework or 'unknown'} / {file_count} files"
        )
        return

    if args.command == "export-source-scan":
        scan_path = export_source_scan_summary(scan_repository, args.project_id, Path(args.output_path), args.format)
        print(f"Exported source scan summary: {scan_path}")
        return

    if args.command == "scan-code":
        ensure_project_writable(repository, args.project_id)
        finding_id = code_scan_repository.create_finding(
            args.project_id,
            args.source_scan_id,
            args.file_path,
            args.rule_name,
            args.severity,
            args.summary,
            args.detail,
            args.line_from,
            args.line_to,
            args.confidence,
        )
        print(
            f"Created source code finding {finding_id} for source scan {args.source_scan_id}: "
            f"{args.rule_name} / {args.severity}"
        )
        return

    if args.command == "export-code-scan":
        report_path = export_code_scan_report(code_scan_repository, args.project_id, Path(args.output_path), args.format)
        print(f"Exported code scan report: {report_path}")
        return

    if args.command == "scan-security":
        ensure_project_writable(repository, args.project_id)
        security_scan_id = security_scan_repository.create_scan(
            args.project_id,
            args.source_scan_id,
        )
        issue_id = security_issue_repository.create_issue(
            security_scan_id,
            args.category,
            args.title,
            args.description,
            args.file_path,
            args.line_from,
            args.line_to,
            args.risk_level,
            args.evidence,
            args.recommendation,
        )
        print(
            f"Created security scan {security_scan_id} and issue {issue_id} for source scan {args.source_scan_id}: "
            f"{args.category} / {args.risk_level}"
        )
        return

    if args.command == "export-security-report":
        report_path = export_security_report(security_issue_repository, args.project_id, Path(args.output_path))
        print(f"Exported security report: {report_path}")
        return

    if args.command == "export-security-csv":
        csv_path = export_security_csv(security_issue_repository, args.project_id, Path(args.output_path))
        print(f"Exported security CSV: {csv_path}")
        return

    if args.command == "create-wiki":
        ensure_project_writable(repository, args.project_id)
        page_id = wiki_repository.create_page(
            args.project_id,
            args.title,
            args.slug,
            args.content,
            args.tags,
            args.created_by,
        )
        print(f"Created wiki page {page_id}: {args.title}")
        return

    if args.command == "list-wiki":
        for page in wiki_repository.list_pages(args.project_id):
            print(f"{page.id}\t{page.title}\t{page.slug}\t{page.tags}")
        return

    if args.command == "list-wiki-versions":
        for version in wiki_repository.list_versions(args.wiki_page_id):
            print(f"{version.version_no}\t{version.created_by}\t{version.change_note}")
        return

    if args.command == "restore-wiki-version":
        page_project_id = wiki_repository.get_page_project_id(args.wiki_page_id)
        if page_project_id is None:
            raise ValueError(f"Wiki page not found: {args.wiki_page_id}")
        ensure_project_writable(repository, page_project_id)
        version_id = wiki_repository.restore_version(args.wiki_page_id, args.version_no, args.restored_by)
        print(f"Restored wiki page {args.wiki_page_id} to version {args.version_no} (new version record {version_id})")
        return

    if args.command == "add-attachment":
        ensure_project_writable(repository, args.project_id)
        attachment_id = wiki_repository.add_attachment(
            args.project_id,
            args.wiki_page_id,
            args.original_name,
            args.stored_name,
            args.file_path,
            args.mime_type,
            args.file_size,
            args.file_hash,
        )
        print(f"Added attachment {attachment_id}: {args.original_name}")
        return

    if args.command == "list-attachments":
        for attachment in wiki_repository.list_attachments(args.project_id, args.wiki_page_id):
            scope = f"wiki={attachment.wiki_page_id}" if attachment.wiki_page_id is not None else "project"
            print(f"{attachment.id}\t{attachment.original_name}\t{attachment.file_path}\t{scope}")
        return

    if args.command == "create-workspace":
        ensure_project_writable(repository, args.project_id)
        workspace_id = workspace_repository.create_workspace(
            args.project_id,
            args.workspace_name,
            args.workspace_type,
            not args.inactive,
        )
        print(f"Created workspace {workspace_id}: {args.workspace_name}")
        return

    if args.command == "list-workspaces":
        for workspace in workspace_repository.list_workspaces(args.project_id):
            state = "active" if workspace.is_active else "inactive"
            print(f"{workspace.id}\t{workspace.workspace_name}\t{workspace.workspace_type}\t{state}")
        return

    if args.command == "create-wbs":
        ensure_project_writable(repository, args.project_id)
        status = normalize_wbs_status(args.status)
        item_id = wbs_repository.create_item(
            args.project_id,
            args.title,
            args.description,
            args.parent_id,
            status,
            args.priority,
            args.linked_type,
            args.linked_id,
        )
        print(f"Created WBS item {item_id}: {args.title} [{status}]")
        return

    if args.command == "list-wbs":
        for item in wbs_repository.list_items(args.project_id):
            print(f"{item.id}\t{item.title}\t{item.status}\t{item.priority}")
        return

    if args.command == "export-wiki":
        wiki_path = export_wiki_bundle(wiki_repository, args.project_id, Path(args.output_path), args.format)
        print(f"Exported wiki bundle: {wiki_path}")
        return

    if args.command == "export-wbs":
        wbs_path = export_wbs_bundle(wbs_repository, args.project_id, Path(args.output_path), args.format)
        print(f"Exported WBS bundle: {wbs_path}")
        return

    if args.command == "create-db-model":
        ensure_project_writable(repository, args.project_id)
        model_id = db_model_repository.create_model(args.project_id, args.name, args.description)
        print(f"Created DB model {model_id}: {args.name}")
        return

    if args.command == "list-db-models":
        for model in db_model_repository.list_models(args.project_id):
            print(f"{model.id}\t{model.name}\t{model.description}")
        return

    if args.command == "create-db-table":
        table_project_id = db_model_repository.get_model_project_id(args.db_model_id)
        if table_project_id is None:
            raise ValueError(f"DB model not found: {args.db_model_id}")
        ensure_project_writable(repository, table_project_id)
        table_id = db_table_repository.create_table(
            args.db_model_id,
            args.name,
            args.description,
            args.primary_key,
        )
        print(f"Created DB table {table_id}: {args.name}")
        return

    if args.command == "list-db-tables":
        for table in db_table_repository.list_tables(args.db_model_id):
            print(f"{table.id}\t{table.name}\t{table.primary_key}")
        return

    if args.command == "create-db-column":
        table_project_id = db_table_repository.get_table_project_id(args.db_table_id)
        if table_project_id is None:
            raise ValueError(f"DB table not found: {args.db_table_id}")
        ensure_project_writable(repository, table_project_id)
        column_id = db_column_repository.create_column(
            args.db_table_id,
            args.name,
            args.data_type,
            args.nullable,
            args.default_value,
            args.unique,
            args.indexed,
            args.description,
        )
        print(f"Created DB column {column_id}: {args.name}")
        return

    if args.command == "list-db-columns":
        for column in db_column_repository.list_columns(args.db_table_id):
            nullability = "nullable" if column.nullable else "not null"
            print(f"{column.id}\t{column.name}\t{column.data_type}\t{nullability}")
        return

    if args.command == "create-db-relation":
        model_project_id = db_model_repository.get_model_project_id(args.db_model_id)
        if model_project_id is None:
            raise ValueError(f"DB model not found: {args.db_model_id}")
        ensure_project_writable(repository, model_project_id)
        relation_id = db_relation_repository.create_relation(
            args.db_model_id,
            args.from_table_id,
            args.to_table_id,
            args.relation_type,
            args.from_column,
            args.to_column,
            args.description,
        )
        print(f"Created DB relation {relation_id}: {args.from_table_id} -> {args.to_table_id}")
        return

    if args.command == "list-db-relations":
        for relation in db_relation_repository.list_relations(args.db_model_id):
            print(
                f"{relation.id}\t{relation.from_table_id}->{relation.to_table_id}\t"
                f"{relation.relation_type}\t{relation.from_column}->{relation.to_column}"
            )
        return

    if args.command == "export-db-design":
        design_path = export_db_design(
            db_model_repository,
            db_table_repository,
            db_column_repository,
            db_relation_repository,
            args.project_id,
            Path(args.output_path),
            args.format,
        )
        print(f"Exported DB design: {design_path}")
        return

    if args.command == "create-diagram":
        ensure_project_writable(repository, args.project_id)
        diagram_id = diagram_repository.create_diagram(
            args.project_id,
            args.name,
            args.payload_json,
            args.diagram_type,
        )
        print(f"Created diagram {diagram_id}: {args.name}")
        return

    if args.command == "list-diagrams":
        for diagram in diagram_repository.list_diagrams(args.project_id):
            print(f"{diagram.id}\t{diagram.diagram_type}\t{diagram.name}")
        return

    if args.command == "export-diagram":
        diagram_path = export_diagram_bundle(diagram_repository, args.project_id, Path(args.output_path), args.format)
        print(f"Exported diagram bundle: {diagram_path}")
        return

    if args.command == "create-api-group":
        ensure_project_writable(repository, args.project_id)
        group_id = api_group_repository.create_group(args.project_id, args.name, args.description)
        print(f"Created API group {group_id}: {args.name}")
        return

    if args.command == "list-api-groups":
        for group in api_group_repository.list_groups(args.project_id):
            print(f"{group.id}\t{group.name}\t{group.description}")
        return

    if args.command == "create-api-schema":
        ensure_project_writable(repository, args.project_id)
        schema_id = api_schema_repository.create_schema(
            args.project_id,
            args.name,
            args.schema_type,
            args.payload_json,
        )
        print(f"Created API schema {schema_id}: {args.name}")
        return

    if args.command == "list-api-schemas":
        for schema in api_schema_repository.list_schemas(args.project_id):
            print(f"{schema.id}\t{schema.name}\t{schema.schema_type}")
        return

    if args.command == "create-api-endpoint":
        api_group_project_id = api_group_repository.get_group_project_id(args.api_group_id)
        if api_group_project_id is None:
            raise ValueError(f"API group not found: {args.api_group_id}")
        ensure_project_writable(repository, api_group_project_id)
        endpoint_id = api_endpoint_repository.create_endpoint(
            args.api_group_id,
            args.method,
            args.path,
            args.summary,
            args.auth_required,
            args.request_schema_id,
            args.response_schema_id,
            args.status_code,
        )
        print(f"Created API endpoint {endpoint_id}: {args.method.upper()} {args.path}")
        return

    if args.command == "list-api-endpoints":
        for endpoint in api_endpoint_repository.list_endpoints(args.api_group_id):
            auth = "auth" if endpoint.auth_required else "open"
            print(f"{endpoint.id}\t{endpoint.method}\t{endpoint.path}\t{auth}\t{endpoint.status_code}")
        return

    if args.command == "export-api-spec":
        spec_path = export_api_spec(
            api_group_repository,
            api_schema_repository,
            api_endpoint_repository,
            args.project_id,
            Path(args.output_path),
            args.format,
        )
        print(f"Exported API spec: {spec_path}")
        return

    if args.command == "export-api-sync":
        sync_path = export_api_sync_report(
            api_group_repository,
            api_schema_repository,
            api_endpoint_repository,
            api_test_repository,
            args.project_id,
            Path(args.output_path),
            args.format,
        )
        print(f"Exported API sync report: {sync_path}")
        return

    if args.command == "export-api-test-report":
        test_path = export_api_test_report(api_test_repository, api_endpoint_repository, args.project_id, Path(args.output_path), args.format)
        print(f"Exported API test report: {test_path}")
        return

    if args.command == "create-sample-dataset":
        ensure_project_writable(repository, args.project_id)
        dataset_id = sample_dataset_repository.create_dataset(
            args.project_id,
            args.name,
            args.description,
            args.shared,
        )
        print(f"Created sample dataset {dataset_id}: {args.name}")
        return

    if args.command == "add-sample-item":
        dataset_project_id = sample_dataset_repository.get_dataset_project_id(args.sample_dataset_id)
        if dataset_project_id is None:
            raise ValueError(f"Sample dataset not found: {args.sample_dataset_id}")
        ensure_project_writable(repository, dataset_project_id)
        item_id = sample_dataset_repository.create_item(
            args.sample_dataset_id,
            args.item_key,
            args.item_value_json,
        )
        print(f"Added sample dataset item {item_id}: {args.item_key}")
        return

    if args.command == "list-sample-datasets":
        for dataset in sample_dataset_repository.list_datasets(args.project_id):
            shared = "shared" if dataset.is_shared else "private"
            print(f"{dataset.id}\t{dataset.name}\t{shared}\t{dataset.description}")
        return

    if args.command == "create-standard-word":
        ensure_project_writable(repository, args.project_id)
        entry_id = standard_word_repository.create_dictionary_entry(
            args.project_id,
            args.word,
            args.recommended_spelling,
            args.note,
            args.version_no,
            args.created_by,
        )
        print(f"Created standard word {entry_id}: {args.word}")
        return

    if args.command == "create-standard-word-check":
        ensure_project_writable(repository, args.project_id)
        check_id = standard_word_repository.create_check_result(
            args.project_id,
            args.vo_name,
            args.field_name,
            args.extracted_words,
            args.unmatched_words,
            args.match_status,
            args.recommended_spelling,
            args.note,
        )
        print(f"Created standard word check {check_id}: {args.vo_name}")
        return

    if args.command == "list-standard-words":
        for entry in standard_word_repository.list_dictionary_entries(args.project_id):
            print(f"{entry.id}\t{entry.word}\t{entry.recommended_spelling}\t{entry.note}\tv{entry.version_no}")
        return

    if args.command == "list-standard-word-checks":
        for check in standard_word_repository.list_check_results(args.project_id):
            print(f"{check.id}\t{check.vo_name}\t{check.unmatched_words}\t{check.match_status}\t{check.note}")
        return

    if args.command == "run-standard-word-check":
        created = run_standard_word_check(standard_word_repository, args.project_id, Path(args.scan_path))
        print(f"Created {created} standard word check results from {args.scan_path}")
        return

    if args.command == "export-standard-word-report":
        report_path = export_standard_word_report(standard_word_repository, args.project_id, Path(args.output_path))
        print(f"Exported standard word report: {report_path}")
        return

    if args.command == "export-standard-word-csv":
        csv_path = export_standard_word_csv(standard_word_repository, args.project_id, Path(args.output_path))
        print(f"Exported standard word CSV: {csv_path}")
        return

    if args.command == "create-auth-profile":
        ensure_project_writable(repository, args.project_id)
        profile_id = api_auth_profile_repository.create_profile(
            args.project_id,
            args.name,
            args.auth_type,
            args.config_json,
            args.default,
        )
        print(f"Created auth profile {profile_id}: {args.name}")
        return

    if args.command == "list-auth-profiles":
        for profile in api_auth_profile_repository.list_profiles(args.project_id):
            default_flag = "default" if profile.is_default else "profile"
            print(f"{profile.id}\t{profile.name}\t{profile.auth_type}\t{default_flag}")
        return

    if args.command == "create-api-test-case":
        ensure_project_writable(repository, args.project_id)
        case_id = api_test_repository.create_case(
            args.project_id,
            args.api_endpoint_id,
            args.request_json,
            args.expected_status_code,
            args.expected_response_json,
            args.auth_profile_id,
            args.sample_dataset_id,
        )
        print(f"Created API test case {case_id} for endpoint {args.api_endpoint_id}")
        return

    if args.command == "list-api-test-cases":
        for case in api_test_repository.list_cases(args.project_id):
            print(f"{case.id}\tendpoint={case.api_endpoint_id}\texpected={case.expected_status_code}")
        return

    if args.command == "add-api-test-result":
        case_project_id = api_test_repository.get_case_project_id(args.api_test_case_id)
        if case_project_id is None:
            raise ValueError(f"API test case not found: {args.api_test_case_id}")
        ensure_project_writable(repository, case_project_id)
        result_id = api_test_repository.create_result(
            args.api_test_case_id,
            args.request_snapshot_json,
            args.response_snapshot_json,
            args.status_code,
            args.result_status,
            args.message,
        )
        print(f"Added API test result {result_id} for case {args.api_test_case_id}")
        return

    if args.command == "list-api-test-results":
        for result in api_test_repository.list_results(args.api_test_case_id):
            print(f"{result.id}\t{result.status_code}\t{result.result_status}\t{result.message}")
        return

    if args.command == "create-access-log":
        ensure_project_writable(repository, args.project_id)
        log_id = access_log_repository.create_log(
            args.project_id,
            args.actor,
            args.action,
            args.target_type,
            args.target_id,
            args.ip_address,
        )
        print(f"Created access log {log_id}: {args.actor} {args.action}")
        return

    if args.command == "list-access-logs":
        for log in access_log_repository.list_logs(args.project_id):
            target = f"{log.target_type}:{log.target_id}" if log.target_id is not None else log.target_type
            print(f"{log.id}\t{log.actor}\t{log.action}\t{target}\t{log.ip_address}")
        return


def count_files(scan_path: Path) -> int:
    return sum(1 for path in scan_path.rglob("*") if path.is_file())


def detect_language_and_framework(scan_path: Path) -> tuple[str, str]:
    if (scan_path / "pyproject.toml").exists() or any(scan_path.rglob("*.py")):
        return "Python", "Unknown"
    if any(scan_path.rglob("*.java")):
        return "Java", "Unknown"
    if any(scan_path.rglob("*.cs")):
        return "C#", "Unknown"
    if (scan_path / "package.json").exists() or any(scan_path.rglob("*.ts")) or any(scan_path.rglob("*.tsx")):
        framework = "Node.js"
        package_json = scan_path / "package.json"
        if package_json.exists():
            try:
                package_data = json.loads(package_json.read_text(encoding="utf-8"))
                dependencies = {
                    **package_data.get("dependencies", {}),
                    **package_data.get("devDependencies", {}),
                }
                if "react" in dependencies:
                    framework = "React"
                elif "vue" in dependencies:
                    framework = "Vue"
                elif "next" in dependencies:
                    framework = "Next.js"
            except Exception:
                pass
        return "TypeScript/JavaScript", framework
    return "Unknown", "Unknown"


def normalize_wbs_status(status: str) -> str:
    normalized = status.strip().lower()
    mapping = {
        "대기": "pending",
        "진행": "in_progress",
        "검토": "review",
        "완료": "done",
        "보류": "blocked",
    }
    return mapping.get(normalized, normalized or "pending")


def extract_candidate_words(text: str) -> list[str]:
    words: list[str] = []
    current = []
    for char in text:
        if char.isalpha():
            current.append(char)
            continue
        if current:
            word = "".join(current)
            if len(word) >= 3:
                words.append(word)
            current = []
    if current:
        word = "".join(current)
        if len(word) >= 3:
            words.append(word)
    return words[:200]


def run_standard_word_check(
    standard_word_repository: StandardWordRepository,
    project_id: int,
    scan_path: Path,
) -> int:
    if not scan_path.exists():
        raise FileNotFoundError(scan_path)
    dictionary = standard_word_repository.list_dictionary_entries(project_id)
    dictionary_words = {
        entry.word.lower(): entry.recommended_spelling or entry.word
        for entry in dictionary
    }
    created = 0
    for file_path in scan_path.rglob("*"):
        if not file_path.is_file() or file_path.suffix.lower() not in {".py", ".md", ".txt", ".json", ".yaml", ".yml"}:
            continue
        for token in extract_candidate_words(file_path.read_text(encoding="utf-8", errors="ignore")):
            normalized = token.lower()
            match_status = "matched" if normalized in dictionary_words else "pending"
            unmatched_words = "" if match_status == "matched" else token
            recommended = dictionary_words.get(normalized, token.title())
            standard_word_repository.create_check_result(
                project_id,
                vo_name=file_path.stem,
                field_name=token,
                extracted_words=token,
                unmatched_words=unmatched_words,
                match_status=match_status,
                recommended_spelling=recommended,
                note="auto-scanned",
            )
            created += 1
    return created


def export_standard_word_report(standard_word_repository: StandardWordRepository, project_id: int, output_path: Path) -> Path:
    entries = standard_word_repository.list_dictionary_entries(project_id)
    checks = standard_word_repository.list_check_results(project_id)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"# Standard Word Report - Project {project_id}",
        "",
        "## Dictionary",
    ]
    for entry in entries:
        lines.append(f"- {entry.word} -> {entry.recommended_spelling or entry.word} (v{entry.version_no})")
    if not entries:
        lines.append("- No dictionary entries yet.")
    lines.extend(["", "## Check Results"])
    for check in checks:
        lines.append(f"- {check.vo_name}.{check.field_name}: {check.match_status} / {check.unmatched_words or '-'}")
    if not checks:
        lines.append("- No check results yet.")
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def export_standard_word_csv(standard_word_repository: StandardWordRepository, project_id: int, output_path: Path) -> Path:
    entries = standard_word_repository.list_dictionary_entries(project_id)
    checks = standard_word_repository.list_check_results(project_id)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["section", "id", "name", "value", "status", "note"])
        for entry in entries:
            writer.writerow(["dictionary", entry.id, entry.word, entry.recommended_spelling, f"v{entry.version_no}", entry.note])
        for check in checks:
            writer.writerow(["check", check.id, check.vo_name, check.unmatched_words, check.match_status, check.note])
    return output_path


def export_security_report(security_issue_repository: SecurityIssueRepository, project_id: int, output_path: Path) -> Path:
    issues = security_issue_repository.list_issues_for_project(project_id)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"# Security Candidate Report - Project {project_id}",
        "",
    ]
    if not issues:
        lines.append("- No security issues yet.")
    else:
        for issue in issues:
            lines.extend(
                [
                    f"## {issue.title}",
                    f"- Category: {issue.category}",
                    f"- Risk level: {issue.risk_level}",
                    f"- File: {issue.file_path}",
                    f"- Lines: {issue.line_from or '-'}-{issue.line_to or '-'}",
                    f"- Evidence: {issue.evidence}",
                    f"- Recommendation: {issue.recommendation}",
                    "",
                ]
            )
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def export_security_csv(security_issue_repository: SecurityIssueRepository, project_id: int, output_path: Path) -> Path:
    issues = security_issue_repository.list_issues_for_project(project_id)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["id", "title", "category", "risk_level", "file_path", "line_from", "line_to", "evidence", "recommendation"])
        for issue in issues:
            writer.writerow([
                issue.id,
                issue.title,
                issue.category,
                issue.risk_level,
                issue.file_path,
                issue.line_from or "",
                issue.line_to or "",
                issue.evidence,
                issue.recommendation,
            ])
    return output_path


def export_api_spec(
    api_group_repository: ApiGroupRepository,
    api_schema_repository: ApiSchemaRepository,
    api_endpoint_repository: ApiEndpointRepository,
    project_id: int,
    output_path: Path,
    output_format: str,
) -> Path:
    groups = api_group_repository.list_groups(project_id)
    schemas = api_schema_repository.list_schemas(project_id)
    schema_map = {schema.id: schema for schema in schemas}
    endpoints = []
    for group in groups:
        for endpoint in api_endpoint_repository.list_endpoints(group.id):
            endpoints.append({
                "group": group.name,
                "method": endpoint.method,
                "path": endpoint.path,
                "summary": endpoint.summary,
                "auth_required": endpoint.auth_required,
                "request_schema": schema_map.get(endpoint.request_schema_id).name if endpoint.request_schema_id in schema_map else "",
                "response_schema": schema_map.get(endpoint.response_schema_id).name if endpoint.response_schema_id in schema_map else "",
                "status_code": endpoint.status_code,
            })
    payload = {
        "project_id": project_id,
        "groups": [asdict(group) for group in groups],
        "schemas": [asdict(schema) for schema in schemas],
        "endpoints": endpoints,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return output_path
    if output_format == "yaml":
        output_path.write_text(to_yaml(payload), encoding="utf-8")
        return output_path
    lines = [
        f"# API Spec - Project {project_id}",
        "",
        "## Groups",
    ]
    for group in groups:
        lines.append(f"- {group.name}: {group.description}")
    lines.extend(["", "## Endpoints"])
    for endpoint in endpoints:
        lines.append(
            f"- {endpoint['method']} {endpoint['path']} ({endpoint['group']}) "
            f"{'auth' if endpoint['auth_required'] else 'open'} {endpoint['status_code']} - {endpoint['summary']}"
        )
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def export_api_sync_report(
    api_group_repository: ApiGroupRepository,
    api_schema_repository: ApiSchemaRepository,
    api_endpoint_repository: ApiEndpointRepository,
    api_test_repository: ApiTestRepository,
    project_id: int,
    output_path: Path,
    output_format: str,
) -> Path:
    groups = api_group_repository.list_groups(project_id)
    schemas = api_schema_repository.list_schemas(project_id)
    endpoints_by_group = {group.id: api_endpoint_repository.list_endpoints(group.id) for group in groups}
    test_cases = api_test_repository.list_cases(project_id)
    payload = {
        "project_id": project_id,
        "sync_mode_note": "Automatic vs manual flags are not stored in the current schema; this report summarizes the current API catalog.",
        "groups": [asdict(group) for group in groups],
        "schemas": [asdict(schema) for schema in schemas],
        "endpoints_by_group": {
            str(group_id): [asdict(endpoint) for endpoint in endpoints]
            for group_id, endpoints in endpoints_by_group.items()
        },
        "test_cases": [asdict(case) for case in test_cases],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return output_path
    lines = [
        f"# API Sync Report - Project {project_id}",
        "",
        "- Automatic/manual sync flags are not stored in the current schema.",
        "- This report summarizes the current API catalog and test coverage.",
        "",
        "## Groups",
    ]
    if not groups:
        lines.append("- No API groups yet.")
    else:
        for group in groups:
            lines.append(f"- {group.name}: {group.description}")
            for endpoint in endpoints_by_group.get(group.id, []):
                lines.append(
                    f"  - {endpoint.method} {endpoint.path} - {endpoint.summary} "
                    f"({'auth' if endpoint.auth_required else 'open'})"
                )
    lines.extend(["", "## Schemas"])
    if not schemas:
        lines.append("- No API schemas yet.")
    else:
        for schema in schemas:
            lines.append(f"- {schema.name} [{schema.schema_type}]")
    lines.extend(["", "## Test Cases"])
    if not test_cases:
        lines.append("- No API test cases yet.")
    else:
        for case in test_cases:
            lines.append(f"- Case #{case.id} -> endpoint {case.api_endpoint_id}, expected {case.expected_status_code}")
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def export_api_test_report(
    api_test_repository: ApiTestRepository,
    api_endpoint_repository: ApiEndpointRepository,
    project_id: int,
    output_path: Path,
    output_format: str,
) -> Path:
    cases = api_test_repository.list_cases(project_id)
    results_by_case = {case.id: api_test_repository.list_results(case.id) for case in cases}
    payload = {
        "project_id": project_id,
        "cases": [asdict(case) for case in cases],
        "results_by_case": {
            str(case_id): [asdict(result) for result in results]
            for case_id, results in results_by_case.items()
        },
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return output_path
    lines = [f"# API Test Report - Project {project_id}", ""]
    if not cases:
        lines.append("- No API test cases yet.")
    else:
        for case in cases:
            endpoint_label = f"endpoint {case.api_endpoint_id}"
            try:
                endpoint = None
                with get_connection(api_test_repository.db_path) as conn:
                    endpoint = conn.execute(
                        "SELECT method, path, summary FROM api_endpoint WHERE id = ?",
                        (case.api_endpoint_id,),
                    ).fetchone()
                if endpoint is not None:
                    endpoint_label = f"{endpoint['method']} {endpoint['path']} - {endpoint['summary']}"
            except Exception:
                pass
            lines.extend(
                [
                    f"## Case #{case.id}",
                    f"- Endpoint: {endpoint_label}",
                    f"- Expected status: {case.expected_status_code}",
                    f"- Request: {case.request_json}",
                    f"- Expected response: {case.expected_response_json}",
                ]
            )
            results = results_by_case.get(case.id, [])
            if not results:
                lines.append("- Result: no executions yet.")
            else:
                for result in results:
                    lines.append(
                        f"- Result #{result.id}: {result.status_code} / {result.result_status} / {result.message}"
                    )
            lines.append("")
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def export_db_design(
    db_model_repository: DbModelRepository,
    db_table_repository: DbTableRepository,
    db_column_repository: DbColumnRepository,
    db_relation_repository: DbRelationRepository,
    project_id: int,
    output_path: Path,
    output_format: str,
) -> Path:
    models = db_model_repository.list_models(project_id)
    tables_by_model = {model.id: db_table_repository.list_tables(model.id) for model in models}
    columns_by_table = {}
    for tables in tables_by_model.values():
        for table in tables:
            columns_by_table[table.id] = db_column_repository.list_columns(table.id)
    relations_by_model = {model.id: db_relation_repository.list_relations(model.id) for model in models}
    payload = {
        "project_id": project_id,
        "models": [asdict(model) for model in models],
        "tables": {
            str(model_id): [asdict(table) for table in tables]
            for model_id, tables in tables_by_model.items()
        },
        "columns": {
            str(table_id): [asdict(column) for column in columns]
            for table_id, columns in columns_by_table.items()
        },
        "relations": {
            str(model_id): [asdict(relation) for relation in relations]
            for model_id, relations in relations_by_model.items()
        },
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return output_path
    if output_format == "sql":
        lines = [f"-- DB Design - Project {project_id}"]
        for model in models:
            lines.append(f"-- Model: {model.name}")
            for table in tables_by_model.get(model.id, []):
                lines.append(f"CREATE TABLE {table.name} (")
                columns = columns_by_table.get(table.id, [])
                if not columns:
                    lines.append("  id INTEGER PRIMARY KEY")
                else:
                    column_lines = []
                    for column in columns:
                        nullability = "" if column.nullable else " NOT NULL"
                        default_part = f" DEFAULT {column.default_value}" if column.default_value else ""
                        column_lines.append(f"  {column.name} {column.data_type}{nullability}{default_part}")
                    lines.append(",\n".join(column_lines))
                lines.append(");")
                lines.append("")
        output_path.write_text("\n".join(lines), encoding="utf-8")
        return output_path
    lines = [f"# DB Design - Project {project_id}", ""]
    for model in models:
        lines.extend([f"## Model: {model.name}", model.description or "-"])
        for table in tables_by_model.get(model.id, []):
            lines.append(f"### Table: {table.name}")
            lines.append(f"- Primary key: {table.primary_key or '-'}")
            for column in columns_by_table.get(table.id, []):
                lines.append(f"  - {column.name} {column.data_type} {'nullable' if column.nullable else 'not null'}")
        for relation in relations_by_model.get(model.id, []):
            lines.append(
                f"- Relation: {relation.from_table_id}:{relation.from_column} -> "
                f"{relation.to_table_id}:{relation.to_column} ({relation.relation_type})"
            )
        lines.append("")
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def export_wiki_bundle(wiki_repository: WikiRepository, project_id: int, output_path: Path, output_format: str) -> Path:
    pages = wiki_repository.list_pages(project_id)
    versions = []
    for page in pages:
        versions.extend(wiki_repository.list_versions(page.id))
    payload = {
        "project_id": project_id,
        "pages": [asdict(page) for page in pages],
        "versions": [asdict(version) for version in versions],
        "attachments": [asdict(attachment) for attachment in wiki_repository.list_attachments(project_id)],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return output_path
    lines = [f"# Wiki Bundle - Project {project_id}", ""]
    for page in pages:
        lines.extend([f"## {page.title}", f"- Slug: {page.slug}", f"- Tags: {page.tags or '-'}"])
        page_versions = [version for version in versions if version.wiki_page_id == page.id]
        for version in page_versions:
            lines.append(f"  - v{version.version_no}: {version.change_note}")
    if not pages:
        lines.append("- No wiki pages yet.")
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def export_wbs_bundle(wbs_repository: WbsRepository, project_id: int, output_path: Path, output_format: str) -> Path:
    items = wbs_repository.list_items(project_id)
    payload = {
        "project_id": project_id,
        "items": [asdict(item) for item in items],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return output_path
    lines = [f"# WBS Bundle - Project {project_id}", ""]
    for item in items:
        lines.append(f"- {item.title} [{item.status}] / {item.priority}")
    if not items:
        lines.append("- No WBS items yet.")
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def export_source_scan_summary(
    source_scan_repository: SourceScanRepository,
    project_id: int,
    output_path: Path,
    output_format: str,
) -> Path:
    scans = source_scan_repository.list_scans(project_id)
    payload = {
        "project_id": project_id,
        "scans": [asdict(scan) for scan in scans],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return output_path
    lines = [f"# Source Scan Summary - Project {project_id}", ""]
    if not scans:
        lines.append("- No source scans yet.")
    else:
        for scan in scans:
            lines.append(f"- #{scan.id} {scan.language} / {scan.framework} / {scan.file_count} files")
            lines.append(f"  - Path: {scan.scan_path}")
            lines.append(f"  - Status: {scan.status}")
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def export_code_scan_report(
    code_scan_repository: SourceCodeScanRepository,
    project_id: int,
    output_path: Path,
    output_format: str,
) -> Path:
    with get_connection(code_scan_repository.db_path) as conn:
        rows = conn.execute(
            """
            SELECT id, project_id, source_scan_id, file_path, rule_name, severity,
                   summary, detail, line_from, line_to, confidence
            FROM source_code_scan
            WHERE project_id = ?
            ORDER BY id DESC
            """,
            (project_id,),
        ).fetchall()
    findings = [dict(row) for row in rows]
    payload = {"project_id": project_id, "findings": findings}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return output_path
    lines = [f"# Source Code Scan Report - Project {project_id}", ""]
    if not findings:
        lines.append("- No source code findings yet.")
    else:
        for finding in findings:
            lines.extend(
                [
                    f"## {finding['rule_name']} ({finding['severity']})",
                    f"- File: {finding['file_path']}",
                    f"- Summary: {finding['summary']}",
                    f"- Detail: {finding['detail']}",
                    f"- Lines: {finding['line_from'] or '-'}-{finding['line_to'] or '-'}",
                    f"- Confidence: {finding['confidence']}",
                    "",
                ]
            )
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def export_diagram_bundle(
    diagram_repository: DiagramRepository,
    project_id: int,
    output_path: Path,
    output_format: str,
) -> Path:
    diagrams = diagram_repository.list_diagrams(project_id)
    payload = {
        "project_id": project_id,
        "diagrams": [asdict(diagram) for diagram in diagrams],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "json":
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return output_path
    lines = [f"# ERD Bundle - Project {project_id}", ""]
    if not diagrams:
        lines.append("- No diagrams yet.")
    else:
        for diagram in diagrams:
            lines.extend(
                [
                    f"## {diagram.name}",
                    f"- Type: {diagram.diagram_type}",
                    f"- Payload: {diagram.payload_json}",
                    "",
                ]
            )
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def to_yaml(value, indent: int = 0) -> str:
    spacing = "  " * indent
    if isinstance(value, dict):
        lines = []
        for key, item in value.items():
            if isinstance(item, (dict, list)):
                lines.append(f"{spacing}{key}:")
                lines.append(to_yaml(item, indent + 1))
            else:
                lines.append(f"{spacing}{key}: {json.dumps(item, ensure_ascii=False)}")
        return "\n".join(lines)
    if isinstance(value, list):
        lines = []
        for item in value:
            if isinstance(item, (dict, list)):
                lines.append(f"{spacing}-")
                lines.append(to_yaml(item, indent + 1))
            else:
                lines.append(f"{spacing}- {json.dumps(item, ensure_ascii=False)}")
        return "\n".join(lines)
    return f"{spacing}{json.dumps(value, ensure_ascii=False)}"
