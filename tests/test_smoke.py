from __future__ import annotations

import gc
import contextlib
import io
import json
import tempfile
import os
import sqlite3
import sys
import time
import threading
import urllib.request
import urllib.error
import urllib.parse
from unittest import mock
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import TestCase

from aastudio.db import initialize_database
from aastudio.repository import (
    ApiEndpointRepository,
    ApiGroupRepository,
    ApiAuthProfileRepository,
    ApiSchemaRepository,
    ApiTestRepository,
    AccessLogRepository,
    DbColumnRepository,
    DbModelRepository,
    DbRelationRepository,
    DbTableRepository,
    DiagramRepository,
    ProjectRepository,
    ProjectWorkspaceRepository,
    SampleDatasetRepository,
    StandardWordRepository,
    SecurityIssueRepository,
    SecurityScanRepository,
    SourceScanRepository,
    SourceCodeScanRepository,
    WikiRepository,
    WbsRepository,
)
from aastudio.cli import run_standard_word_check
from aastudio.cli import main as cli_main
from aastudio.cli import export_standard_word_csv, export_standard_word_report
from aastudio.cli import export_security_csv, export_security_report
from aastudio.cli import export_api_spec
from aastudio.cli import export_db_design
from aastudio.cli import export_wiki_bundle, export_wbs_bundle
from aastudio.cli import export_source_scan_summary
from aastudio.cli import export_code_scan_report
from aastudio.cli import export_api_sync_report
from aastudio.cli import export_api_test_report
from aastudio.cli import export_diagram_bundle
from aastudio.webapp import DashboardHandler, build_dashboard_html, build_final_artifact_markdown, save_final_artifact_markdown


class SmokeTests(TestCase):
    def test_core_persistence_flow(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)

            project_repo = ProjectRepository(db_path)
            scan_repo = SourceScanRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)
            sample_repo = SampleDatasetRepository(db_path)
            api_test_repo = ApiTestRepository(db_path)

            project_id = project_repo.create_project("demo", "D:/demo")
            scan_id = scan_repo.create_scan(project_id, "D:/demo", "Python", "Unknown", 3)
            group_id = group_repo.create_group(project_id, "User APIs")
            request_schema_id = schema_repo.create_schema(project_id, "UserRequest", "request", json.dumps({"type": "object"}))
            response_schema_id = schema_repo.create_schema(project_id, "UserResponse", "response", json.dumps({"type": "object"}))
            endpoint_id = endpoint_repo.create_endpoint(group_id, "POST", "/users", "Create user", True, request_schema_id, response_schema_id, 201)
            dataset_id = sample_repo.create_dataset(project_id, "User Samples", "Reusable data", True)
            sample_repo.create_item(dataset_id, "user", json.dumps({"id": 1, "name": "Demo"}))
            case_id = api_test_repo.create_case(
                project_id,
                endpoint_id,
                json.dumps({"name": "Demo"}),
                201,
                json.dumps({"id": 1}),
                sample_dataset_id=dataset_id,
            )
            api_test_repo.create_result(
                case_id,
                json.dumps({"name": "Demo"}),
                json.dumps({"id": 1}),
                201,
                "passed",
                "ok",
            )

            self.assertGreater(scan_id, 0)
            self.assertGreater(endpoint_id, 0)
            self.assertGreater(case_id, 0)
            self.assertEqual(len(project_repo.list_projects()), 1)
            self.assertEqual(len(scan_repo.list_scans(project_id)), 1)
            self.assertEqual(len(group_repo.list_groups(project_id)), 1)
            self.assertEqual(len(endpoint_repo.list_endpoints(group_id)), 1)
            self.assertEqual(len(sample_repo.list_datasets(project_id)), 1)
            self.assertEqual(len(api_test_repo.list_cases(project_id)), 1)
            self.assertEqual(len(api_test_repo.list_results(case_id)), 1)
        finally:
            del project_repo, scan_repo, group_repo, schema_repo, endpoint_repo, sample_repo, api_test_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_dashboard_html_contains_summary(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            api_repo = ApiTestRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)
            project_id = project_repo.create_project("demo", "D:/demo")
            group_id = group_repo.create_group(project_id, "API")
            request_schema_id = schema_repo.create_schema(project_id, "Req", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "Res", "response", "{}")
            endpoint_id = endpoint_repo.create_endpoint(group_id, "GET", "/demo", "Demo", False, request_schema_id, response_schema_id, 200)
            case_id = api_repo.create_case(project_id, endpoint_id, "{}", 200, "{}", None, None)
            api_repo.create_result(case_id, "{}", "{}", 200, "passed", "ok")
            overview = project_repo.get_overview_summary(project_id)
            dashboard = project_repo.get_dashboard_summary(project_id)

            class DummyProject:
                def __init__(self, pid: int, name: str) -> None:
                    self.id = pid
                    self.name = name

            html = build_dashboard_html(overview, dashboard, [DummyProject(project_id, "demo")], {
                "tab": "overview",
                "project_share": project_repo.get_project_share(project_id),
                "wiki_pages": [],
                "wbs_items": [],
                "db_models": [],
                "diagrams": [],
                "api_groups": [],
                "api_endpoints": endpoint_repo.list_endpoints(group_id),
                "sample_datasets": [],
                "api_test_cases": api_repo.list_cases(project_id),
                "api_test_results": api_repo.list_results(case_id),
                "access_logs": [],
                "attachments": [],
                "workspaces": [],
                "db_relations": [],
            })

            self.assertIn("AAStudio Dashboard", html)
            self.assertIn("demo", html)
            self.assertIn("Final Artifact", html)
            self.assertIn("Latest API test", html)
            self.assertIn("passed", html)
            self.assertIn("Final artifact path", html)
            self.assertIn("Final Artifact Preview", html)
            artifact = build_final_artifact_markdown(overview, dashboard, {
                "tab": "overview",
                "project_share": project_repo.get_project_share(project_id),
                "stage_assignments": [],
                "stage_history": [],
            })
            self.assertIn("# AAStudio Final Artifact - demo", artifact)
            self.assertIn("API test results", artifact)
            self.assertIn("Generated at:", artifact)
            self.assertIn("Saved path:", artifact)
            artifact_path = save_final_artifact_markdown(overview, dashboard, {
                "tab": "overview",
                "project_share": project_repo.get_project_share(project_id),
                "stage_assignments": [],
                "stage_history": [],
            })
            self.assertTrue(artifact_path.exists())
            self.assertIn("API test results", artifact_path.read_text(encoding="utf-8"))
            self.assertIn("Generated at:", artifact_path.read_text(encoding="utf-8"))
        finally:
            del project_repo, api_repo, group_repo, schema_repo, endpoint_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_dashboard_and_overview_cli_print_summary(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            scan_repo = SourceScanRepository(db_path)
            security_scan_repo = SecurityScanRepository(db_path)
            security_issue_repo = SecurityIssueRepository(db_path)
            api_repo = ApiTestRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)

            project_id = project_repo.create_project("summary", "D:/summary")
            project_repo.update_dashboard(project_id, "development", "Working through implementation")
            scan_id = scan_repo.create_scan(project_id, "D:/summary", "Python", "FastAPI", 3)
            security_id = security_scan_repo.create_scan(project_id, scan_id)
            security_issue_repo.create_issue(
                security_id,
                "input-validation",
                "Potential SQL injection",
                "Untrusted input reaches a query.",
                "app.py",
                10,
                12,
                "high",
                "user input is concatenated",
                "use parameterized queries",
            )
            group_id = group_repo.create_group(project_id, "API")
            request_schema_id = schema_repo.create_schema(project_id, "Req", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "Res", "response", "{}")
            endpoint_id = endpoint_repo.create_endpoint(group_id, "GET", "/summary", "Summary", False, request_schema_id, response_schema_id, 200)
            case_id = api_repo.create_case(project_id, endpoint_id, "{}", 200, "{}", None, None)
            api_repo.create_result(case_id, "{}", "{}", 200, "passed", "ok")

            dashboard_stdout = io.StringIO()
            overview_stdout = io.StringIO()

            sys.argv = ["aastudio", "show-dashboard", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(dashboard_stdout):
                cli_main()

            sys.argv = ["aastudio", "show-overview", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(overview_stdout):
                cli_main()

            dashboard_output = dashboard_stdout.getvalue()
            overview_output = overview_stdout.getvalue()
            self.assertIn("Project: summary", dashboard_output)
            self.assertIn("Stage: development", dashboard_output)
            self.assertIn("Latest source scan:", dashboard_output)
            self.assertIn("Latest security issue:", dashboard_output)
            self.assertIn("Latest API test:", dashboard_output)
            self.assertIn("Project: summary", overview_output)
            self.assertIn("Source scans:", overview_output)
            self.assertIn("Security issues:", overview_output)
            self.assertIn("API test cases:", overview_output)
        finally:
            sys.argv = old_argv
            del project_repo, scan_repo, security_scan_repo, security_issue_repo, api_repo, group_repo, schema_repo, endpoint_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_dashboard_shows_stage_assignments(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("stage-demo", "D:/stage-demo")
            project_repo.create_stage_assignment(
                project_id,
                "design",
                "Kim",
                "Lead",
                "010-1234-5678",
                "kim@example.com",
                "wiki",
                7,
                "open",
            )
            project_repo.create_stage_history(
                project_id,
                "design",
                "planning",
                "design",
                "Kim",
                "Started design work",
            )
            overview = project_repo.get_overview_summary(project_id)
            dashboard = project_repo.get_dashboard_summary(project_id)

            html = build_dashboard_html(overview, dashboard, [type("P", (), {"id": project_id, "name": "stage-demo"})()], {
                "tab": "overview",
                "project_share": project_repo.get_project_share(project_id),
                "wiki_pages": [],
                "wbs_items": [],
                "db_models": [],
                "diagrams": [],
                "api_groups": [],
                "api_endpoints": [],
                "sample_datasets": [],
                "api_test_cases": [],
                "api_test_results": [],
                "access_logs": [],
                "attachments": [],
                "workspaces": [],
                "db_relations": [],
                "stage_assignments": project_repo.list_stage_assignments(project_id),
                "stage_history": project_repo.list_stage_history(project_id),
            })

            self.assertIn("Stage Assignments", html)
            self.assertIn("Kim", html)
            self.assertIn("Wiki #7", html)
            self.assertIn("Related Work", html)
            self.assertIn("Stage History", html)
            self.assertIn("Started design work", html)

            artifact = build_final_artifact_markdown(overview, dashboard, {
                "tab": "overview",
                "project_share": project_repo.get_project_share(project_id),
                "stage_assignments": project_repo.list_stage_assignments(project_id),
                "stage_history": project_repo.list_stage_history(project_id),
            })
            self.assertIn("## Stage Assignments", artifact)
            self.assertIn("## Stage History", artifact)
            self.assertIn("Kim", artifact)
            self.assertIn("Related work: Wiki #7", artifact)
        finally:
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_final_artifact_is_disabled_for_readonly_projects(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_repo.create_project("readonly", "D:/readonly")
            project_repo.set_project_share(1, True, "external", "readonly demo")
            overview = project_repo.get_overview_summary(1)
            dashboard = project_repo.get_dashboard_summary(1)

            class DummyProject:
                def __init__(self, pid: int, name: str) -> None:
                    self.id = pid
                    self.name = name

            html = build_dashboard_html(overview, dashboard, [DummyProject(1, "readonly")], {
                "tab": "overview",
                "project_share": project_repo.get_project_share(1),
                "wiki_pages": [],
                "wbs_items": [],
                "db_models": [],
                "diagrams": [],
                "api_groups": [],
                "api_endpoints": [],
                "sample_datasets": [],
                "api_test_cases": [],
                "api_test_results": [],
                "access_logs": [],
                "attachments": [],
                "workspaces": [],
                "db_relations": [],
            })

            self.assertIn("aria-disabled='true'", html)
            self.assertNotIn("href='/artifact?project_id=1&tab=overview'", html)
        finally:
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_dashboard_refresh_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        server = None
        thread = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-refresh", "D:/readonly-refresh")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            DashboardHandler.repository = project_repo
            server = ThreadingHTTPServer(("127.0.0.1", 0), DashboardHandler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            data = urllib.parse.urlencode({"project_id": project_id, "stage": "design", "summary": "updated"}).encode("utf-8")
            request = urllib.request.Request(
                f"http://127.0.0.1:{server.server_address[1]}/refresh",
                data=data,
                method="POST",
            )
            with self.assertRaises(urllib.error.HTTPError) as cm:
                urllib.request.urlopen(request)
            self.assertEqual(cm.exception.code, 403)
        finally:
            if server is not None:
                server.shutdown()
                server.server_close()
            if thread is not None:
                thread.join(timeout=2)
            DashboardHandler.repository = None
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_dashboard_refresh_updates_summary(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        server = None
        thread = None
        project_repo = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("refresh", "D:/refresh")
            project_repo.update_dashboard(project_id, "planning", "before refresh")

            DashboardHandler.repository = project_repo
            server = ThreadingHTTPServer(("127.0.0.1", 0), DashboardHandler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()

            data = urllib.parse.urlencode({"project_id": project_id, "stage": "design", "summary": "after refresh"}).encode("utf-8")
            request = urllib.request.Request(
                f"http://127.0.0.1:{server.server_address[1]}/refresh",
                data=data,
                method="POST",
            )
            class NoRedirect(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[override]
                    return None

            opener = urllib.request.build_opener(NoRedirect)
            with self.assertRaises(urllib.error.HTTPError) as cm:
                opener.open(request)
            self.assertEqual(cm.exception.code, 303)
            self.assertIn("?project_id=", cm.exception.headers.get("Location", ""))

            dashboard = project_repo.get_dashboard_summary(project_id)
            self.assertEqual(dashboard.current_stage, "design")
            self.assertEqual(dashboard.summary, "after refresh")
        finally:
            if server is not None:
                server.shutdown()
                server.server_close()
            if thread is not None:
                thread.join(timeout=2)
            DashboardHandler.repository = None
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_cli_mutation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            dataset_repo = SampleDatasetRepository(db_path)
            project_id = project_repo.create_project("readonly-cli", "D:/readonly-cli")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")
            dataset_id = dataset_repo.create_dataset(project_id, "Samples", "demo")

            old_argv = sys.argv[:]
            sys.argv = [
                "aastudio",
                "add-sample-item",
                "--db",
                str(db_path),
                str(dataset_id),
                "user",
                '{"id": 1}',
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo, dataset_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_db_mutation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            model_repo = DbModelRepository(db_path)
            table_repo = DbTableRepository(db_path)
            project_id = project_repo.create_project("readonly-db", "D:/readonly-db")
            model_id = model_repo.create_model(project_id, "Core", "demo")
            table_id = table_repo.create_table(model_id, "users", "demo", "id")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-db-column",
                "--db",
                str(db_path),
                str(table_id),
                "name",
                "TEXT",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo, model_repo, table_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_db_model_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-db-model", "D:/readonly-db-model")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-db-model",
                "--db",
                str(db_path),
                str(project_id),
                "Core",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_db_table_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            model_repo = DbModelRepository(db_path)
            project_id = project_repo.create_project("readonly-db-table", "D:/readonly-db-table")
            model_id = model_repo.create_model(project_id, "Core", "demo")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-db-table",
                "--db",
                str(db_path),
                str(model_id),
                "users",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo, model_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_db_relation_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            model_repo = DbModelRepository(db_path)
            table_repo = DbTableRepository(db_path)
            project_id = project_repo.create_project("readonly-db-rel", "D:/readonly-db-rel")
            model_id = model_repo.create_model(project_id, "Core", "demo")
            users_table = table_repo.create_table(model_id, "users", "demo", "id")
            orders_table = table_repo.create_table(model_id, "orders", "demo", "id")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-db-relation",
                "--db",
                str(db_path),
                str(model_id),
                str(users_table),
                str(orders_table),
                "one-to-many",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo, model_repo, table_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_api_endpoint_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            project_id = project_repo.create_project("readonly-api", "D:/readonly-api")
            group_id = group_repo.create_group(project_id, "Users")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-api-endpoint",
                "--db",
                str(db_path),
                str(group_id),
                "GET",
                "/users",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo, group_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_stage_assignment_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-stage", "D:/readonly-stage")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-stage-assignment",
                "--db",
                str(db_path),
                str(project_id),
                "design",
                "--assignee-name",
                "Kim",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_stage_history_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-stage-history", "D:/readonly-stage-history")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-stage-history",
                "--db",
                str(db_path),
                str(project_id),
                "design",
                "planning",
                "design",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_workspace_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-workspace", "D:/readonly-workspace")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-workspace",
                "--db",
                str(db_path),
                str(project_id),
                "Main",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_sample_dataset_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-sample", "D:/readonly-sample")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-sample-dataset",
                "--db",
                str(db_path),
                str(project_id),
                "Samples",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_auth_profile_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-auth", "D:/readonly-auth")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-auth-profile",
                "--db",
                str(db_path),
                str(project_id),
                "default",
                "basic",
                "{}",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_standard_word_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-std", "D:/readonly-std")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-standard-word",
                "--db",
                str(db_path),
                str(project_id),
                "customer",
                "--recommended-spelling",
                "Customer",
                "--note",
                "canonical noun",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_standard_word_check_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-std-check", "D:/readonly-std-check")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-standard-word-check",
                "--db",
                str(db_path),
                str(project_id),
                "CustomerVO",
                "--field-name",
                "customerName",
                "--extracted-words",
                "customer",
                "--unmatched-words",
                "customer",
                "--match-status",
                "review",
                "--recommended-spelling",
                "Customer",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_api_test_case_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            project_id = project_repo.create_project("readonly-api-test", "D:/readonly-api-test")
            group_id = group_repo.create_group(project_id, "Users")
            request_schema_id = schema_repo.create_schema(project_id, "Req", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "Res", "response", "{}")
            endpoint_repo = ApiEndpointRepository(db_path)
            endpoint_id = endpoint_repo.create_endpoint(group_id, "GET", "/users", "List users", False, request_schema_id, response_schema_id, 200)
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-api-test-case",
                "--db",
                str(db_path),
                str(project_id),
                str(endpoint_id),
                "{}",
                "200",
                "{}",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo, group_repo, schema_repo, endpoint_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_api_schema_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-api-schema", "D:/readonly-api-schema")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-api-schema",
                "--db",
                str(db_path),
                str(project_id),
                "Req",
                "request",
                "{}",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_api_group_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-api-group", "D:/readonly-api-group")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-api-group",
                "--db",
                str(db_path),
                str(project_id),
                "Users",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_diagram_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-diagram", "D:/readonly-diagram")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-diagram",
                "--db",
                str(db_path),
                str(project_id),
                "Main ERD",
                "{\"nodes\":[]}",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_api_test_result_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            test_repo = ApiTestRepository(db_path)
            project_id = project_repo.create_project("readonly-api-result", "D:/readonly-api-result")
            group_id = group_repo.create_group(project_id, "Users")
            request_schema_id = schema_repo.create_schema(project_id, "Req", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "Res", "response", "{}")
            endpoint_repo = ApiEndpointRepository(db_path)
            endpoint_id = endpoint_repo.create_endpoint(group_id, "GET", "/users", "List users", False, request_schema_id, response_schema_id, 200)
            case_id = test_repo.create_case(project_id, endpoint_id, "{}", 200, "{}", None, None)
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "add-api-test-result",
                "--db",
                str(db_path),
                str(case_id),
                "{}",
                "{}",
                "200",
                "passed",
                "ok",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo, group_repo, schema_repo, test_repo, endpoint_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_auth_profile_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-auth", "D:/readonly-auth")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-auth-profile",
                "--db",
                str(db_path),
                str(project_id),
                "default",
                "basic",
                "{}",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_access_log_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-log", "D:/readonly-log")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-access-log",
                "--db",
                str(db_path),
                str(project_id),
                "tester",
                "open",
                "project",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_scan_source_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        temp_dir = Path(tempfile.mkdtemp())
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-scan-source", str(temp_dir))
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "scan-source",
                "--db",
                str(db_path),
                str(project_id),
                str(temp_dir),
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            temp_dir.rmdir()

    def test_readonly_scan_code_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            scan_repo = SourceScanRepository(db_path)
            project_id = project_repo.create_project("readonly-scan-code", "D:/readonly-scan-code")
            scan_id = scan_repo.create_scan(project_id, "D:/readonly-scan-code", "Python", "Unknown", 1)
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "scan-code",
                "--db",
                str(db_path),
                str(project_id),
                str(scan_id),
                "app.py",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo, scan_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_scan_security_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            scan_repo = SourceScanRepository(db_path)
            project_id = project_repo.create_project("readonly-scan-security", "D:/readonly-scan-security")
            scan_id = scan_repo.create_scan(project_id, "D:/readonly-scan-security", "Python", "Unknown", 1)
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "scan-security",
                "--db",
                str(db_path),
                str(project_id),
                str(scan_id),
                "app.py",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo, scan_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_wbs_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-wbs", "D:/readonly-wbs")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-wbs",
                "--db",
                str(db_path),
                str(project_id),
                "Draft docs",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_project_lifecycle_helpers(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)

            alpha_id = project_repo.create_project("alpha", "D:/alpha", "Alpha project")
            beta_id = project_repo.create_project("beta", "D:/beta", "Beta project")
            project_repo.update_dashboard(alpha_id, "implementation", "Alpha summary")
            copy_id = project_repo.copy_project(alpha_id, "alpha-copy", "D:/alpha-copy")

            self.assertGreater(copy_id, 0)
            self.assertEqual(project_repo.get_dashboard_summary(copy_id).current_stage, "implementation")
            self.assertEqual(project_repo.get_dashboard_summary(copy_id).summary, "Alpha summary")

            search_names = [project.name for project in project_repo.search_projects("alpha")]
            self.assertEqual(search_names, ["alpha-copy", "alpha"])

            recent_ids = [project.id for project in project_repo.get_recent_projects(limit=2)]
            self.assertEqual(recent_ids, [copy_id, beta_id])

            project_repo.delete_project(beta_id)
            remaining_ids = [project.id for project in project_repo.list_projects()]
            self.assertNotIn(beta_id, remaining_ids)
            self.assertIn(alpha_id, remaining_ids)
        finally:
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_project_cli_lifecycle_roundtrip(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        project_repo = None
        try:
            initialize_database(db_path)

            sys.argv = [
                "aastudio",
                "create-project",
                "--db",
                str(db_path),
                "alpha",
                "D:/alpha",
                "--description",
                "Alpha project",
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "copy-project",
                "--db",
                str(db_path),
                "1",
                "alpha-copy",
                "--root-path",
                "D:/alpha-copy",
            ]
            cli_main()

            project_repo = ProjectRepository(db_path)
            self.assertEqual(len(project_repo.list_projects()), 2)

            sys.argv = [
                "aastudio",
                "delete-project",
                "--db",
                str(db_path),
                "2",
            ]
            cli_main()

            self.assertEqual(len(project_repo.list_projects()), 1)
            self.assertEqual(project_repo.list_projects()[0].name, "alpha")
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_api_cli_lifecycle_roundtrip(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)

            project_id = project_repo.create_project("api-demo", "D:/api-demo")

            sys.argv = [
                "aastudio",
                "create-api-group",
                "--db",
                str(db_path),
                str(project_id),
                "Public APIs",
                "--description",
                "Client-facing endpoints",
            ]
            cli_main()

            group_id = group_repo.list_groups(project_id)[0].id

            sys.argv = [
                "aastudio",
                "create-api-schema",
                "--db",
                str(db_path),
                str(project_id),
                "UserRequest",
                "request",
                "{\"type\":\"object\"}",
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "create-api-schema",
                "--db",
                str(db_path),
                str(project_id),
                "UserResponse",
                "response",
                "{\"type\":\"object\"}",
            ]
            cli_main()

            schemas = schema_repo.list_schemas(project_id)
            request_schema_id = next(schema.id for schema in schemas if schema.name == "UserRequest")
            response_schema_id = next(schema.id for schema in schemas if schema.name == "UserResponse")

            sys.argv = [
                "aastudio",
                "create-api-endpoint",
                "--db",
                str(db_path),
                str(group_id),
                "POST",
                "/users",
                "--summary",
                "Create user",
                "--auth-required",
                "--request-schema-id",
                str(request_schema_id),
                "--response-schema-id",
                str(response_schema_id),
                "--status-code",
                "201",
            ]
            cli_main()

            endpoint = endpoint_repo.list_endpoints(group_id)[0]
            self.assertEqual(endpoint.method, "POST")
            self.assertEqual(endpoint.path, "/users")
            self.assertTrue(endpoint.auth_required)
            self.assertEqual(endpoint.status_code, 201)
            self.assertEqual(endpoint.request_schema_id, request_schema_id)
            self.assertEqual(endpoint.response_schema_id, response_schema_id)
            self.assertEqual(group_repo.list_groups(project_id)[0].name, "Public APIs")
        finally:
            sys.argv = old_argv
            del project_repo, group_repo, schema_repo, endpoint_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_api_spec_export_cli_writes_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)

            project_id = project_repo.create_project("api-export", str(temp_dir))
            group_id = group_repo.create_group(project_id, "Users", "user endpoints")
            request_schema_id = schema_repo.create_schema(project_id, "UserRequest", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "UserResponse", "response", "{}")
            endpoint_repo.create_endpoint(
                group_id,
                "GET",
                "/users",
                "List users",
                True,
                request_schema_id,
                response_schema_id,
                200,
            )

            json_path = temp_dir / "api.json"
            yaml_path = temp_dir / "api.yaml"
            md_path = temp_dir / "api.md"

            for output_path, output_format in ((json_path, "json"), (yaml_path, "yaml"), (md_path, "md")):
                sys.argv = [
                    "aastudio",
                    "export-api-spec",
                    "--db",
                    str(db_path),
                    str(project_id),
                    str(output_path),
                    "--format",
                    output_format,
                ]
                cli_main()

            self.assertTrue(json_path.exists())
            self.assertTrue(yaml_path.exists())
            self.assertTrue(md_path.exists())
            self.assertIn("Users", json_path.read_text(encoding="utf-8"))
            self.assertIn("request_schema", yaml_path.read_text(encoding="utf-8"))
            self.assertIn("List users", md_path.read_text(encoding="utf-8"))
        finally:
            sys.argv = old_argv
            del project_repo, group_repo, schema_repo, endpoint_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_api_sync_and_test_report_cli_writes_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)
            test_repo = ApiTestRepository(db_path)

            project_id = project_repo.create_project("api-report", str(temp_dir))
            group_id = group_repo.create_group(project_id, "Users", "user endpoints")
            request_schema_id = schema_repo.create_schema(project_id, "UserRequest", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "UserResponse", "response", "{}")
            endpoint_id = endpoint_repo.create_endpoint(
                group_id,
                "POST",
                "/users",
                "Create user",
                True,
                request_schema_id,
                response_schema_id,
                201,
            )
            case_id = test_repo.create_case(
                project_id,
                endpoint_id,
                "{\"name\":\"demo\"}",
                201,
                "{\"id\":1}",
                None,
                None,
            )
            test_repo.create_result(case_id, "{\"name\":\"demo\"}", "{\"id\":1}", 201, "passed", "ok")

            sync_md = temp_dir / "api-sync.md"
            sync_json = temp_dir / "api-sync.json"
            tests_md = temp_dir / "api-tests.md"
            tests_json = temp_dir / "api-tests.json"

            for output_path, output_format in (
                (sync_md, "md"),
                (sync_json, "json"),
                (tests_md, "md"),
                (tests_json, "json"),
            ):
                if "sync" in output_path.name:
                    command = "export-api-sync"
                else:
                    command = "export-api-test-report"
                sys.argv = [
                    "aastudio",
                    command,
                    "--db",
                    str(db_path),
                    str(project_id),
                    str(output_path),
                    "--format",
                    output_format,
                ]
                cli_main()

            self.assertTrue(sync_md.exists())
            self.assertTrue(sync_json.exists())
            self.assertTrue(tests_md.exists())
            self.assertTrue(tests_json.exists())
            self.assertIn("API Sync Report", sync_md.read_text(encoding="utf-8"))
            self.assertIn("test_cases", sync_json.read_text(encoding="utf-8"))
            self.assertIn("API Test Report", tests_md.read_text(encoding="utf-8"))
            self.assertIn("cases", tests_json.read_text(encoding="utf-8"))
        finally:
            sys.argv = old_argv
            del project_repo, group_repo, schema_repo, endpoint_repo, test_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_workspace_and_attachment_records(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)
            workspace_repo = ProjectWorkspaceRepository(db_path)

            project_id = project_repo.create_project("docs", "D:/docs")
            page_id = wiki_repo.create_page(project_id, "Guide", "guide", "content")
            workspace_id = workspace_repo.create_workspace(project_id, "Main", "analysis")
            attachment_id = wiki_repo.add_attachment(
                project_id,
                page_id,
                "guide.pdf",
                "guide-stored.pdf",
                "D:/docs/guide-stored.pdf",
                "application/pdf",
                2048,
                "hash-1",
            )

            self.assertGreater(workspace_id, 0)
            self.assertGreater(attachment_id, 0)
            self.assertEqual(len(workspace_repo.list_workspaces(project_id)), 1)
            self.assertEqual(len(wiki_repo.list_attachments(project_id, page_id)), 1)
            self.assertEqual(wiki_repo.list_attachments(project_id, page_id)[0].original_name, "guide.pdf")
        finally:
            del project_repo, wiki_repo, workspace_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_wiki_restore_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)
            project_id = project_repo.create_project("readonly-wiki", "D:/readonly-wiki")
            page_id = wiki_repo.create_page(project_id, "Guide", "guide", "v1")
            wiki_repo.create_page(project_id, "Other", "other", "content")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "restore-wiki-version",
                "--db",
                str(db_path),
                str(page_id),
                "1",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo, wiki_repo
            gc.collect()
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_wiki_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-wiki-create", "D:/readonly-wiki-create")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "create-wiki",
                "--db",
                str(db_path),
                str(project_id),
                "Guide",
                "guide",
                "content",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_readonly_attachment_creation_is_rejected(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("readonly-attachment-create", "D:/readonly-attachment-create")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")

            sys.argv = [
                "aastudio",
                "add-attachment",
                "--db",
                str(db_path),
                str(project_id),
                "guide.txt",
                "guide-stored.txt",
                "D:/guide-stored.txt",
            ]
            with self.assertRaises(PermissionError):
                cli_main()
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_attachment_download_route_serves_file_bytes(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_fd, temp_raw = tempfile.mkstemp(suffix=".txt")
        os.close(temp_fd)
        temp_file = Path(temp_raw)
        server = None
        thread = None
        project_repo = None
        wiki_repo = None
        try:
            temp_file.write_text("download me", encoding="utf-8")
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)
            project_id = project_repo.create_project("download", "D:/download")
            page_id = wiki_repo.create_page(project_id, "Guide", "guide", "content")
            attachment_id = wiki_repo.add_attachment(
                project_id,
                page_id,
                "guide.txt",
                "guide-stored.txt",
                str(temp_file),
                "text/plain",
                temp_file.stat().st_size,
                "hash-1",
            )

            DashboardHandler.repository = project_repo
            server = ThreadingHTTPServer(("127.0.0.1", 0), DashboardHandler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            url = f"http://127.0.0.1:{server.server_address[1]}/download-attachment?project_id={project_id}&attachment_id={attachment_id}"
            with urllib.request.urlopen(url) as response:
                body = response.read()
                self.assertEqual(response.status, 200)
                self.assertEqual(response.headers.get_content_type(), "text/plain")
                self.assertEqual(response.headers.get_filename(), "guide.txt")
                self.assertEqual(body.decode("utf-8"), "download me")
        finally:
            if server is not None:
                server.shutdown()
                server.server_close()
            if thread is not None:
                thread.join(timeout=2)
            DashboardHandler.repository = None
            del project_repo, wiki_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            temp_file.unlink(missing_ok=True)

    def test_dashboard_root_route_serves_html(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        server = None
        thread = None
        project_repo = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("dashboard-root", "D:/dashboard-root")
            project_repo.update_dashboard(project_id, "design", "Root route summary")

            DashboardHandler.repository = project_repo
            server = ThreadingHTTPServer(("127.0.0.1", 0), DashboardHandler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()

            url = f"http://127.0.0.1:{server.server_address[1]}/?project_id={project_id}&tab=overview"
            with urllib.request.urlopen(url) as response:
                body = response.read().decode("utf-8")
                self.assertEqual(response.status, 200)
                self.assertEqual(response.headers.get_content_type(), "text/html")
                self.assertIn("AAStudio Dashboard", body)
                self.assertIn("Root route summary", body)
                self.assertIn("design", body)
        finally:
            if server is not None:
                server.shutdown()
                server.server_close()
            if thread is not None:
                thread.join(timeout=2)
            DashboardHandler.repository = None
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_wiki_version_restore(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)

            project_id = project_repo.create_project("wiki", "D:/wiki")
            page_id = wiki_repo.create_page(project_id, "Guide", "guide", "v1", created_by="author")
            wiki_repo.create_page(project_id, "Other", "other", "content")
            with sqlite3.connect(db_path) as conn:
                conn.row_factory = sqlite3.Row
                conn.execute("UPDATE wiki_page SET content = ? WHERE id = ?", ("v2", page_id))
                conn.execute(
                    "INSERT INTO wiki_page_version (wiki_page_id, version_no, content_snapshot, change_note, created_by) VALUES (?, 2, ?, ?, ?)",
                    (page_id, "v2", "Second version", "editor"),
                )
            version_count_before = len(wiki_repo.list_versions(page_id))
            restore_id = wiki_repo.restore_version(page_id, 1, restored_by="reviewer")
            versions = wiki_repo.list_versions(page_id)
            with sqlite3.connect(db_path) as conn:
                conn.row_factory = sqlite3.Row
                restored_content = conn.execute("SELECT content FROM wiki_page WHERE id = ?", (page_id,)).fetchone()["content"]
            overview = project_repo.get_overview_summary(project_id)
            dashboard = project_repo.get_dashboard_summary(project_id)

            class DummyProject:
                def __init__(self, pid: int, name: str) -> None:
                    self.id = pid
                    self.name = name

            wiki_html = build_dashboard_html(
                overview,
                dashboard,
                [DummyProject(project_id, "wiki")],
                {
                    "tab": "wiki",
                    "project_share": project_repo.get_project_share(project_id),
                    "wiki_pages": wiki_repo.list_pages(project_id),
                    "wiki_versions": versions,
                    "wbs_items": [],
                    "db_models": [],
                    "db_relations": [],
                    "diagrams": [],
                    "api_groups": [],
                    "api_endpoints": [],
                    "sample_datasets": [],
                    "api_test_cases": [],
                    "api_test_results": [],
                    "access_logs": [],
                    "attachments": [],
                    "workspaces": [],
                },
            )

            self.assertGreater(restore_id, 0)
            self.assertEqual(version_count_before + 1, len(versions))
            self.assertEqual(versions[0].change_note, "Restored from version 1")
            self.assertEqual(restored_content, "v1")
            self.assertIn("Restored from version 1", wiki_html)
        finally:
            del project_repo, wiki_repo
            gc.collect()
            for _ in range(5):
                try:
                    db_path.unlink(missing_ok=True)
                    break
                except PermissionError:
                    gc.collect()
                    time.sleep(0.05)

    def test_project_export_import_roundtrip(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)
            workspace_repo = ProjectWorkspaceRepository(db_path)
            scan_repo = SourceScanRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)
            sample_repo = SampleDatasetRepository(db_path)
            api_test_repo = ApiTestRepository(db_path)

            source_project_id = project_repo.create_project("source", "D:/source", "Source project")
            project_repo.update_dashboard(source_project_id, "design", "Bundle summary")
            page_id = wiki_repo.create_page(source_project_id, "Guide", "guide", "content")
            workspace_repo.create_workspace(source_project_id, "Main", "analysis")
            scan_id = scan_repo.create_scan(source_project_id, "D:/source", "Python", "Unknown", 5)
            group_id = group_repo.create_group(source_project_id, "APIs")
            request_schema_id = schema_repo.create_schema(source_project_id, "Req", "request", json.dumps({"type": "object"}))
            response_schema_id = schema_repo.create_schema(source_project_id, "Res", "response", json.dumps({"type": "object"}))
            endpoint_id = endpoint_repo.create_endpoint(group_id, "GET", "/items", "List items", False, request_schema_id, response_schema_id, 200)
            dataset_id = sample_repo.create_dataset(source_project_id, "Samples", "Desc", False)
            case_id = api_test_repo.create_case(source_project_id, endpoint_id, "{}", 200, "{}", sample_dataset_id=dataset_id)
            api_test_repo.create_result(case_id, "{}", "{}", 200, "passed", "ok")
            wiki_repo.add_attachment(source_project_id, page_id, "guide.md", "guide-1.md", "D:/source/guide-1.md")

            bundle = project_repo.export_project_bundle(source_project_id)
            clone_id = project_repo.import_project_bundle(bundle, "clone", "D:/clone")

            self.assertGreater(clone_id, 0)
            self.assertEqual(project_repo.get_dashboard_summary(clone_id).summary, "Bundle summary")
            self.assertEqual(len(wiki_repo.list_pages(clone_id)), 1)
            self.assertEqual(len(workspace_repo.list_workspaces(clone_id)), 1)
            self.assertEqual(len(scan_repo.list_scans(clone_id)), 1)
            self.assertEqual(len(group_repo.list_groups(clone_id)), 1)
            self.assertEqual(len(sample_repo.list_datasets(clone_id)), 1)
            self.assertEqual(len(api_test_repo.list_cases(clone_id)), 1)
            self.assertEqual(len(wiki_repo.list_attachments(clone_id)), 1)
        finally:
            del project_repo, wiki_repo, workspace_repo, scan_repo, group_repo, schema_repo, endpoint_repo, sample_repo, api_test_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_project_export_cli_writes_bundle(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        temp_dir = Path(tempfile.mkdtemp())
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)
            project_id = project_repo.create_project("source", "D:/source", "Source project")
            project_repo.update_dashboard(project_id, "design", "Bundle summary")
            wiki_repo.create_page(project_id, "Guide", "guide", "content")
            bundle_path = temp_dir / "bundle.json"

            sys.argv = [
                "aastudio",
                "export-project",
                "--db",
                str(db_path),
                str(project_id),
                str(bundle_path),
            ]
            cli_main()

            self.assertTrue(bundle_path.exists())
            payload = json.loads(bundle_path.read_text(encoding="utf-8"))
            self.assertEqual(payload["project_dashboard"]["summary"], "Bundle summary")
            self.assertEqual(len(payload["wiki_page"]), 1)
        finally:
            sys.argv = old_argv
            del project_repo, wiki_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_project_import_cli_roundtrip(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("source", "D:/source", "Source project")
            project_repo.update_dashboard(project_id, "design", "Bundle summary")
            bundle = project_repo.export_project_bundle(project_id)

            temp_dir = Path(tempfile.mkdtemp())
            bundle_path = temp_dir / "bundle.json"
            bundle_path.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")

            sys.argv = [
                "aastudio",
                "import-project",
                "--db",
                str(db_path),
                str(bundle_path),
                "clone",
                "D:/clone",
            ]
            cli_main()

            projects = project_repo.list_projects()
            self.assertEqual(len(projects), 2)
            self.assertEqual(project_repo.get_dashboard_summary(2).summary, "Bundle summary")
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_project_share_state(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)

            project_id = project_repo.create_project("share-demo", "D:/share-demo")
            project_repo.set_project_share(project_id, True, "external", "readonly demo")
            share = project_repo.get_project_share(project_id)

            self.assertTrue(share.is_readonly)
            self.assertEqual(share.share_scope, "external")
            self.assertEqual(share.note, "readonly demo")
            self.assertTrue(project_repo.list_projects()[0].is_readonly)
            overview = project_repo.get_overview_summary(project_id)
            dashboard = project_repo.get_dashboard_summary(project_id)
            class DummyProject:
                def __init__(self, pid: int, name: str) -> None:
                    self.id = pid
                    self.name = name

            html = build_dashboard_html(overview, dashboard, [DummyProject(1, "readonly")], {
                "tab": "overview",
                "project_share": share,
                "wiki_pages": [],
                "wbs_items": [],
                "db_models": [],
                "diagrams": [],
                "api_groups": [],
                "api_endpoints": [],
                "sample_datasets": [],
                "api_test_cases": [],
                "api_test_results": [],
                "access_logs": [],
                "attachments": [],
                "workspaces": [],
                "db_relations": [],
            })
            self.assertIn("aria-disabled='true'", html)
            self.assertIn("Final artifact path", html)
        finally:
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_list_projects_and_share_cli_print_expected_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_a = project_repo.create_project("alpha", "D:/alpha")
            project_b = project_repo.create_project("beta", "D:/beta")
            project_repo.set_project_share(project_b, True, "external", "readonly beta")

            list_stdout = io.StringIO()
            share_stdout = io.StringIO()

            sys.argv = ["aastudio", "list-projects", "--db", str(db_path)]
            with contextlib.redirect_stdout(list_stdout):
                cli_main()

            sys.argv = ["aastudio", "show-project-share", "--db", str(db_path), str(project_b)]
            with contextlib.redirect_stdout(share_stdout):
                cli_main()

            list_output = list_stdout.getvalue()
            share_output = share_stdout.getvalue()
            self.assertIn(f"{project_a}\talpha\tplanning\tinternal\tD:/alpha", list_output)
            self.assertIn(f"{project_b}\tbeta\tplanning\treadonly\tD:/beta", list_output)
            self.assertIn(f"Project {project_b}: readonly / external / readonly beta", share_output)
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_init_db_cli_creates_database(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            if db_path.exists():
                db_path.unlink()
            sys.argv = ["aastudio", "init-db", "--db", str(db_path)]
            cli_main()
            self.assertTrue(db_path.exists())
            project_repo = ProjectRepository(db_path)
            self.assertEqual(project_repo.list_projects(), [])
        finally:
            sys.argv = old_argv
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_search_and_recent_projects_cli_print_expected_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            first_id = project_repo.create_project("alpha", "D:/alpha")
            second_id = project_repo.create_project("beta", "D:/beta")
            project_repo.update_dashboard(second_id, "design", "recent project")

            search_stdout = io.StringIO()
            recent_stdout = io.StringIO()

            sys.argv = ["aastudio", "search-projects", "--db", str(db_path), "alp"]
            with contextlib.redirect_stdout(search_stdout):
                cli_main()

            sys.argv = ["aastudio", "recent-projects", "--db", str(db_path), "--limit", "2"]
            with contextlib.redirect_stdout(recent_stdout):
                cli_main()

            search_output = search_stdout.getvalue()
            recent_output = recent_stdout.getvalue()
            self.assertIn(f"{first_id}\talpha\tplanning\tinternal\tD:/alpha", search_output)
            self.assertNotIn("beta", search_output)
            self.assertIn(f"{second_id}\tbeta\tdesign\tinternal\tD:/beta", recent_output)
            self.assertIn(f"{first_id}\talpha\tplanning\tinternal\tD:/alpha", recent_output)
        finally:
            sys.argv = old_argv
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_misc_create_cli_persists_expected_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            workspace_repo = ProjectWorkspaceRepository(db_path)
            sample_repo = SampleDatasetRepository(db_path)
            auth_repo = ApiAuthProfileRepository(db_path)
            stdword_repo = StandardWordRepository(db_path)
            access_repo = AccessLogRepository(db_path)

            project_id = project_repo.create_project("misc-create", "D:/misc-create")

            sys.argv = [
                "aastudio",
                "create-stage-assignment",
                "--db",
                str(db_path),
                str(project_id),
                "design",
                "--assignee-name",
                "Kim",
                "--status",
                "open",
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "create-stage-history",
                "--db",
                str(db_path),
                str(project_id),
                "design",
                "planning",
                "design",
                "--changed-by",
                "Kim",
                "--change-note",
                "started",
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "create-workspace",
                "--db",
                str(db_path),
                str(project_id),
                "Main",
                "--workspace-type",
                "analysis",
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "create-sample-dataset",
                "--db",
                str(db_path),
                str(project_id),
                "Samples",
                "--description",
                "Reusable data",
                "--shared",
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "create-auth-profile",
                "--db",
                str(db_path),
                str(project_id),
                "Default",
                "bearer",
                '{"token":"abc"}',
                "--default",
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "create-standard-word",
                "--db",
                str(db_path),
                str(project_id),
                "customer",
                "--recommended-spelling",
                "Customer",
                "--note",
                "canonical",
                "--version-no",
                "1",
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "create-standard-word-check",
                "--db",
                str(db_path),
                str(project_id),
                "CustomerVO",
                "--field-name",
                "customerName",
                "--extracted-words",
                "customer",
                "--unmatched-words",
                "customer",
                "--match-status",
                "review",
                "--recommended-spelling",
                "Customer",
                "--note",
                "needs review",
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "create-access-log",
                "--db",
                str(db_path),
                str(project_id),
                "tester",
                "view",
                "project",
                "--target-id",
                "1",
                "--ip-address",
                "127.0.0.1",
            ]
            cli_main()

            self.assertEqual(len(workspace_repo.list_workspaces(project_id)), 1)
            self.assertEqual(len(sample_repo.list_datasets(project_id)), 1)
            self.assertEqual(len(auth_repo.list_profiles(project_id)), 1)
            self.assertEqual(len(stdword_repo.list_dictionary_entries(project_id)), 1)
            self.assertEqual(len(stdword_repo.list_check_results(project_id)), 1)
            self.assertEqual(len(access_repo.list_logs(project_id)), 1)
            self.assertEqual(len(project_repo.list_stage_assignments(project_id)), 1)
            self.assertEqual(len(project_repo.list_stage_history(project_id)), 1)
        finally:
            sys.argv = old_argv
            del project_repo, workspace_repo, sample_repo, auth_repo, stdword_repo, access_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_sample_item_and_api_test_result_cli_persist_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            sample_repo = SampleDatasetRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)
            test_repo = ApiTestRepository(db_path)

            project_id = project_repo.create_project("ingest", "D:/ingest")
            dataset_id = sample_repo.create_dataset(project_id, "Samples", "demo", True)
            group_id = group_repo.create_group(project_id, "Users")
            request_schema_id = schema_repo.create_schema(project_id, "Req", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "Res", "response", "{}")
            endpoint_id = endpoint_repo.create_endpoint(group_id, "POST", "/users", "Create user", True, request_schema_id, response_schema_id, 201)
            case_id = test_repo.create_case(project_id, endpoint_id, "{}", 201, "{}", None, dataset_id)

            sys.argv = [
                "aastudio",
                "add-sample-item",
                "--db",
                str(db_path),
                str(dataset_id),
                "user",
                '{"id": 1}',
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "add-api-test-result",
                "--db",
                str(db_path),
                str(case_id),
                "{}",
                "{}",
                "201",
                "passed",
                "ok",
            ]
            cli_main()

            self.assertEqual(len(sample_repo.list_datasets(project_id)), 1)
            self.assertEqual(len(test_repo.list_results(case_id)), 1)
            self.assertEqual(test_repo.list_results(case_id)[0].result_status, "passed")
        finally:
            sys.argv = old_argv
            del project_repo, sample_repo, group_repo, schema_repo, endpoint_repo, test_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_serve_dashboard_cli_dispatches_helper(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            with mock.patch("aastudio.cli.serve_dashboard") as serve_dashboard_mock:
                sys.argv = [
                    "aastudio",
                    "serve-dashboard",
                    "--db",
                    str(db_path),
                    "--host",
                    "0.0.0.0",
                    "--port",
                    "8123",
                ]
                cli_main()

            serve_dashboard_mock.assert_called_once()
            call_args = serve_dashboard_mock.call_args.args
            self.assertEqual(call_args[0], db_path)
            self.assertEqual(call_args[1], "0.0.0.0")
            self.assertEqual(call_args[2], 8123)
        finally:
            sys.argv = old_argv
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_serve_dashboard_helper_builds_server(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            project_id = project_repo.create_project("serve", "D:/serve")

            created = {}

            class FakeServer:
                def __init__(self, address, handler):
                    created["address"] = address
                    created["handler"] = handler
                    self.server_address = address
                    self.closed = False

                def serve_forever(self):
                    created["served"] = True
                    raise KeyboardInterrupt()

                def server_close(self):
                    self.closed = True

            with mock.patch("aastudio.webapp.ThreadingHTTPServer", FakeServer):
                buffer = io.StringIO()
                with contextlib.redirect_stdout(buffer):
                    from aastudio.webapp import serve_dashboard as run_serve_dashboard
                    run_serve_dashboard(db_path, "127.0.0.1", 8999)

            self.assertEqual(created["address"], ("127.0.0.1", 8999))
            self.assertTrue(created["served"])
            self.assertEqual(created["handler"].repository.db_path, db_path)
            self.assertIn("Serving AAStudio dashboard on http://127.0.0.1:8999/?project_id=1", buffer.getvalue())
            self.assertEqual(project_id, 1)
        finally:
            DashboardHandler.repository = None
            del project_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_serve_dashboard_helper_closes_server_on_interrupt(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)

            flags = {}

            class FakeServer:
                def __init__(self, address, handler):
                    self.server_address = address

                def serve_forever(self):
                    flags["served"] = True
                    raise KeyboardInterrupt()

                def server_close(self):
                    flags["closed"] = True

            with mock.patch("aastudio.webapp.ThreadingHTTPServer", FakeServer):
                from aastudio.webapp import serve_dashboard as run_serve_dashboard
                run_serve_dashboard(db_path, "127.0.0.1", 8998)

            self.assertTrue(flags["served"])
            self.assertTrue(flags["closed"])
        finally:
            DashboardHandler.repository = None
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_api_list_cli_print_expected_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)

            project_id = project_repo.create_project("api-list", "D:/api-list")
            group_id = group_repo.create_group(project_id, "Users", "user endpoints")
            request_schema_id = schema_repo.create_schema(project_id, "UserRequest", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "UserResponse", "response", "{}")
            endpoint_repo.create_endpoint(group_id, "GET", "/users", "List users", True, request_schema_id, response_schema_id, 200)

            groups_stdout = io.StringIO()
            schemas_stdout = io.StringIO()
            endpoints_stdout = io.StringIO()

            sys.argv = ["aastudio", "list-api-groups", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(groups_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-api-schemas", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(schemas_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-api-endpoints", "--db", str(db_path), str(group_id)]
            with contextlib.redirect_stdout(endpoints_stdout):
                cli_main()

            self.assertIn("1\tUsers\tuser endpoints", groups_stdout.getvalue())
            self.assertIn("1\tUserRequest\trequest", schemas_stdout.getvalue())
            self.assertIn("2\tUserResponse\tresponse", schemas_stdout.getvalue())
            self.assertIn("1\tGET\t/users\tauth\t200", endpoints_stdout.getvalue())
        finally:
            sys.argv = old_argv
            del project_repo, group_repo, schema_repo, endpoint_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_misc_list_cli_print_expected_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            sample_repo = SampleDatasetRepository(db_path)
            stdword_repo = StandardWordRepository(db_path)
            access_repo = AccessLogRepository(db_path)

            project_id = project_repo.create_project("misc-list", "D:/misc-list")
            project_repo.create_stage_assignment(project_id, "design", "Kim", "Lead", "010-1111-2222", "kim@example.com", "wiki", 1, "open")
            project_repo.create_stage_history(project_id, "design", "planning", "design", "Kim", "started")
            dataset_id = sample_repo.create_dataset(project_id, "Samples", "Reusable data", True)
            sample_repo.create_item(dataset_id, "user", '{"id": 1}')
            stdword_repo.create_dictionary_entry(project_id, "customer", "Customer", "canonical", 1, "tester")
            stdword_repo.create_check_result(project_id, "CustomerVO", "customerName", "customer", "customer", "review", "Customer", "needs review")
            access_repo.create_log(project_id, "tester", "view", "project", 1, "127.0.0.1")

            stage_assign_stdout = io.StringIO()
            stage_history_stdout = io.StringIO()
            sample_stdout = io.StringIO()
            stdword_stdout = io.StringIO()
            stdcheck_stdout = io.StringIO()
            access_stdout = io.StringIO()

            sys.argv = ["aastudio", "list-stage-assignments", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(stage_assign_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-stage-history", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(stage_history_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-sample-datasets", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(sample_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-standard-words", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(stdword_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-standard-word-checks", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(stdcheck_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-access-logs", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(access_stdout):
                cli_main()

            self.assertIn("design\tKim\topen", stage_assign_stdout.getvalue())
            self.assertIn("design\tplanning\tdesign\tKim", stage_history_stdout.getvalue())
            self.assertIn("1\tSamples\tshared\tReusable data", sample_stdout.getvalue())
            self.assertIn("1\tcustomer\tCustomer\tcanonical\tv1", stdword_stdout.getvalue())
            self.assertIn("1\tCustomerVO\tcustomer\treview\tneeds review", stdcheck_stdout.getvalue())
            self.assertIn("1\ttester\tview\tproject:1\t127.0.0.1", access_stdout.getvalue())
        finally:
            sys.argv = old_argv
            del project_repo, sample_repo, stdword_repo, access_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_auth_profile_and_api_test_list_cli_print_expected_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            auth_repo = ApiAuthProfileRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)
            test_repo = ApiTestRepository(db_path)

            project_id = project_repo.create_project("auth-list", "D:/auth-list")
            profile_id = auth_repo.create_profile(project_id, "Default", "bearer", '{"token":"abc"}', True)
            group_id = group_repo.create_group(project_id, "Users")
            request_schema_id = schema_repo.create_schema(project_id, "UserRequest", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "UserResponse", "response", "{}")
            endpoint_id = endpoint_repo.create_endpoint(group_id, "POST", "/users", "Create user", True, request_schema_id, response_schema_id, 201)
            case_id = test_repo.create_case(project_id, endpoint_id, "{}", 201, "{}", profile_id, None)
            test_repo.create_result(case_id, "{}", "{}", 201, "passed", "ok")

            auth_stdout = io.StringIO()
            cases_stdout = io.StringIO()
            results_stdout = io.StringIO()

            sys.argv = ["aastudio", "list-auth-profiles", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(auth_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-api-test-cases", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(cases_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-api-test-results", "--db", str(db_path), str(case_id)]
            with contextlib.redirect_stdout(results_stdout):
                cli_main()

            self.assertIn("1\tDefault\tbearer\tdefault", auth_stdout.getvalue())
            self.assertIn("1\tendpoint=1\texpected=201", cases_stdout.getvalue())
            self.assertIn("1\t201\tpassed\tok", results_stdout.getvalue())
        finally:
            sys.argv = old_argv
            del project_repo, auth_repo, group_repo, schema_repo, endpoint_repo, test_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_attachment_and_workspace_list_cli_print_expected_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)
            workspace_repo = ProjectWorkspaceRepository(db_path)

            project_id = project_repo.create_project("files-list", "D:/files-list")
            page_id = wiki_repo.create_page(project_id, "Guide", "guide", "content")
            wiki_repo.add_attachment(project_id, page_id, "guide.txt", "guide-stored.txt", "D:/files/guide-stored.txt")
            workspace_repo.create_workspace(project_id, "Main", "analysis")

            attach_stdout = io.StringIO()
            workspace_stdout = io.StringIO()

            sys.argv = [
                "aastudio",
                "list-attachments",
                "--db",
                str(db_path),
                str(project_id),
                "--wiki-page-id",
                str(page_id),
            ]
            with contextlib.redirect_stdout(attach_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-workspaces", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(workspace_stdout):
                cli_main()

            self.assertIn("guide.txt\tD:/files/guide-stored.txt\twiki=", attach_stdout.getvalue())
            self.assertIn("1\tMain\tanalysis\tactive", workspace_stdout.getvalue())
        finally:
            sys.argv = old_argv
            del project_repo, wiki_repo, workspace_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_list_wiki_versions_cli_print_expected_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)

            project_id = project_repo.create_project("wiki-versions", "D:/wiki-versions")
            page_id = wiki_repo.create_page(project_id, "Guide", "guide", "v1", created_by="author")
            conn = sqlite3.connect(db_path)
            try:
                conn.row_factory = sqlite3.Row
                conn.execute("UPDATE wiki_page SET content = ? WHERE id = ?", ("v2", page_id))
                conn.execute(
                    "INSERT INTO wiki_page_version (wiki_page_id, version_no, content_snapshot, change_note, created_by) VALUES (?, 2, ?, ?, ?)",
                    (page_id, "v2", "Second version", "editor"),
                )
                conn.commit()
            finally:
                conn.close()

            versions_stdout = io.StringIO()
            sys.argv = ["aastudio", "list-wiki-versions", "--db", str(db_path), str(page_id)]
            with contextlib.redirect_stdout(versions_stdout):
                cli_main()

            self.assertIn("2\teditor\tSecond version", versions_stdout.getvalue())
            self.assertIn("1\tauthor\t", versions_stdout.getvalue())
        finally:
            sys.argv = old_argv
            del project_repo, wiki_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_db_and_diagram_list_cli_print_expected_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            model_repo = DbModelRepository(db_path)
            table_repo = DbTableRepository(db_path)
            column_repo = DbColumnRepository(db_path)
            relation_repo = DbRelationRepository(db_path)
            diagram_repo = DiagramRepository(db_path)

            project_id = project_repo.create_project("db-list", "D:/db-list")
            model_id = model_repo.create_model(project_id, "Core", "main model")
            users_table = table_repo.create_table(model_id, "users", "users table", "id")
            orders_table = table_repo.create_table(model_id, "orders", "orders table", "id")
            column_repo.create_column(users_table, "id", "INTEGER", False, "", True, True, "user id")
            relation_repo.create_relation(model_id, users_table, orders_table, "one-to-many", "id", "user_id", "ownership")
            diagram_repo.create_diagram(project_id, "Main ERD", '{"nodes":[]}', "erd")

            models_stdout = io.StringIO()
            tables_stdout = io.StringIO()
            columns_stdout = io.StringIO()
            relations_stdout = io.StringIO()
            diagrams_stdout = io.StringIO()

            sys.argv = ["aastudio", "list-db-models", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(models_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-db-tables", "--db", str(db_path), str(model_id)]
            with contextlib.redirect_stdout(tables_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-db-columns", "--db", str(db_path), str(users_table)]
            with contextlib.redirect_stdout(columns_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-db-relations", "--db", str(db_path), str(model_id)]
            with contextlib.redirect_stdout(relations_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-diagrams", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(diagrams_stdout):
                cli_main()

            self.assertIn("1\tCore\tmain model", models_stdout.getvalue())
            self.assertIn("1\tusers\tid", tables_stdout.getvalue())
            self.assertIn("1\tid\tINTEGER\tnot null", columns_stdout.getvalue())
            self.assertIn("1\t1->2\tone-to-many\tid->user_id", relations_stdout.getvalue())
            self.assertIn("1\terd\tMain ERD", diagrams_stdout.getvalue())
        finally:
            sys.argv = old_argv
            del project_repo, model_repo, table_repo, column_repo, relation_repo, diagram_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_wiki_and_wbs_list_cli_print_expected_rows(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)
            wbs_repo = WbsRepository(db_path)

            project_id = project_repo.create_project("docs-list", "D:/docs-list")
            page_id = wiki_repo.create_page(project_id, "Guide", "guide", "content", tags="docs", created_by="tester")
            wiki_repo.create_page(project_id, "Notes", "notes", "more content", created_by="tester")
            wbs_repo.create_item(project_id, "Draft docs", "write docs", None, "pending", "high", "wiki", page_id)

            wiki_stdout = io.StringIO()
            wbs_stdout = io.StringIO()

            sys.argv = ["aastudio", "list-wiki", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(wiki_stdout):
                cli_main()

            sys.argv = ["aastudio", "list-wbs", "--db", str(db_path), str(project_id)]
            with contextlib.redirect_stdout(wbs_stdout):
                cli_main()

            self.assertIn("1\tGuide\tguide\tdocs", wiki_stdout.getvalue())
            self.assertIn("2\tNotes\tnotes\t", wiki_stdout.getvalue())
            self.assertIn("1\tDraft docs\tpending\thigh", wbs_stdout.getvalue())
        finally:
            sys.argv = old_argv
            del project_repo, wiki_repo, wbs_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_dashboard_shows_files_and_workspaces(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)
            workspace_repo = ProjectWorkspaceRepository(db_path)

            project_id = project_repo.create_project("dash", "D:/dash")
            page_id = wiki_repo.create_page(project_id, "Guide", "guide", "content")
            wiki_repo.add_attachment(project_id, page_id, "guide.pdf", "guide.pdf", "D:/dash/guide.pdf")
            workspace_repo.create_workspace(project_id, "Main", "analysis")

            overview = project_repo.get_overview_summary(project_id)
            dashboard = project_repo.get_dashboard_summary(project_id)

            class DummyProject:
                def __init__(self, pid: int, name: str) -> None:
                    self.id = pid
                    self.name = name

            files_html = build_dashboard_html(
                overview,
                dashboard,
                [DummyProject(project_id, "dash")],
                {
                    "tab": "files",
                    "project_share": project_repo.get_project_share(project_id),
                    "wiki_pages": wiki_repo.list_pages(project_id),
                    "wbs_items": [],
                    "db_models": [],
                    "diagrams": [],
                    "api_groups": [],
                    "api_endpoints": [],
                    "sample_datasets": [],
                    "api_test_cases": [],
                    "api_test_results": [],
                    "access_logs": [],
                    "attachments": wiki_repo.list_attachments(project_id),
                    "workspaces": workspace_repo.list_workspaces(project_id),
                },
            )
            workspaces_html = build_dashboard_html(
                overview,
                dashboard,
                [DummyProject(project_id, "dash")],
                {
                    "tab": "workspaces",
                    "project_share": project_repo.get_project_share(project_id),
                    "wiki_pages": wiki_repo.list_pages(project_id),
                    "wbs_items": [],
                    "db_models": [],
                    "diagrams": [],
                    "api_groups": [],
                    "api_endpoints": [],
                    "sample_datasets": [],
                    "api_test_cases": [],
                    "api_test_results": [],
                    "access_logs": [],
                    "attachments": wiki_repo.list_attachments(project_id),
                    "workspaces": workspace_repo.list_workspaces(project_id),
                },
            )

            self.assertIn("Attachments", files_html)
            self.assertIn("guide.pdf", files_html)
            self.assertIn("Workspaces", workspaces_html)
            self.assertIn("Main", workspaces_html)
            self.assertIn("Final Artifact Preview", files_html)
        finally:
            del project_repo, wiki_repo, workspace_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_db_relations(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            model_repo = None
            table_repo = None
            relation_repo = None
            model_repo = DbModelRepository(db_path)
            table_repo = DbTableRepository(db_path)
            relation_repo = DbRelationRepository(db_path)

            project_id = project_repo.create_project("db", "D:/db")
            model_id = model_repo.create_model(project_id, "Core")
            users_table = table_repo.create_table(model_id, "users")
            orders_table = table_repo.create_table(model_id, "orders")
            relation_id = relation_repo.create_relation(model_id, users_table, orders_table, "one-to-many", "id", "user_id", "users own orders")

            self.assertGreater(relation_id, 0)
            self.assertEqual(len(relation_repo.list_relations(model_id)), 1)
            self.assertEqual(relation_repo.list_relations(model_id)[0].relation_type, "one-to-many")

            overview = project_repo.get_overview_summary(project_id)
            dashboard = project_repo.get_dashboard_summary(project_id)

            class DummyProject:
                def __init__(self, pid: int, name: str) -> None:
                    self.id = pid
                    self.name = name

            html = build_dashboard_html(
                overview,
                dashboard,
                [DummyProject(project_id, "db")],
                {
                    "tab": "db",
                    "project_share": project_repo.get_project_share(project_id),
                    "wiki_pages": [],
                    "wbs_items": [],
                    "db_models": model_repo.list_models(project_id),
                    "db_relations": relation_repo.list_relations(model_id),
                    "diagrams": [],
                    "api_groups": [],
                    "api_endpoints": [],
                    "sample_datasets": [],
                    "api_test_cases": [],
                    "api_test_results": [],
                    "access_logs": [],
                    "attachments": [],
                    "workspaces": [],
                },
            )

            self.assertIn("DB relations", html)
            self.assertIn("one-to-many", html)
            self.assertEqual(overview.db_relations, 1)
        finally:
            del project_repo, model_repo, table_repo, relation_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_standard_word_dictionary_tab_and_cli_data(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            stdword_repo = StandardWordRepository(db_path)

            project_id = project_repo.create_project("std", "D:/std")
            stdword_repo.create_dictionary_entry(project_id, "customer", "Customer", "canonical noun", 2, "tester")
            stdword_repo.create_check_result(project_id, "CustomerVO", "customerName", "customer name", "customer", "review", "Customer", "needs review")

            overview = project_repo.get_overview_summary(project_id)
            dashboard = project_repo.get_dashboard_summary(project_id)

            class DummyProject:
                def __init__(self, pid: int, name: str) -> None:
                    self.id = pid
                    self.name = name

            html = build_dashboard_html(
                overview,
                dashboard,
                [DummyProject(project_id, "std")],
                {
                    "tab": "stdword",
                    "project_share": project_repo.get_project_share(project_id),
                    "wiki_pages": [],
                    "wbs_items": [],
                    "db_models": [],
                    "db_relations": [],
                    "diagrams": [],
                    "api_groups": [],
                    "api_endpoints": [],
                    "sample_datasets": [],
                    "standard_words": stdword_repo.list_dictionary_entries(project_id),
                    "standard_word_checks": stdword_repo.list_check_results(project_id),
                    "api_test_cases": [],
                    "api_test_results": [],
                    "access_logs": [],
                    "attachments": [],
                    "workspaces": [],
                },
            )

            self.assertIn("Std Words", html)
            self.assertIn("customer", html)
            self.assertIn("CustomerVO", html)
            self.assertEqual(overview.standard_words, 1)
            self.assertEqual(overview.standard_word_checks, 1)
        finally:
            del project_repo, stdword_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_standard_word_check_cli_scans_source_tree(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        source_dir = Path(tempfile.mkdtemp())
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            stdword_repo = StandardWordRepository(db_path)

            project_id = project_repo.create_project("scan", str(source_dir))
            stdword_repo.create_dictionary_entry(project_id, "customer", "Customer", "canonical noun", 1, "tester")
            source_file = source_dir / "sample.py"
            source_file.write_text("class CustomerVO:\n    customer_name = 'x'\n", encoding="utf-8")

            created = run_standard_word_check(stdword_repo, project_id, source_dir)
            checks = stdword_repo.list_check_results(project_id)
            self.assertGreaterEqual(created, 1)
            self.assertGreaterEqual(len(checks), 1)
            self.assertTrue(any(check.vo_name == "sample" for check in checks))
        finally:
            del project_repo, stdword_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(source_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            source_dir.rmdir()

    def test_standard_word_exports_create_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            stdword_repo = StandardWordRepository(db_path)
            project_id = project_repo.create_project("export", str(temp_dir))
            stdword_repo.create_dictionary_entry(project_id, "customer", "Customer", "canonical noun", 1, "tester")
            stdword_repo.create_check_result(project_id, "CustomerVO", "customerName", "customer", "customer", "review", "Customer", "needs review")

            report_path = export_standard_word_report(stdword_repo, project_id, temp_dir / "report.md")
            csv_path = export_standard_word_csv(stdword_repo, project_id, temp_dir / "report.csv")

            self.assertTrue(report_path.exists())
            self.assertTrue(csv_path.exists())
            self.assertIn("Standard Word Report", report_path.read_text(encoding="utf-8"))
            self.assertIn("dictionary", csv_path.read_text(encoding="utf-8"))
        finally:
            del project_repo, stdword_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_standard_word_cli_workflow_writes_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        source_dir = Path(tempfile.mkdtemp())
        temp_dir = Path(tempfile.mkdtemp())
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            stdword_repo = StandardWordRepository(db_path)

            project_id = project_repo.create_project("std-cli", str(source_dir))
            stdword_repo.create_dictionary_entry(project_id, "customer", "Customer", "canonical noun", 1, "tester")
            source_file = source_dir / "sample.py"
            source_file.write_text("class CustomerVO:\n    customer_name = 'x'\n", encoding="utf-8")

            sys.argv = [
                "aastudio",
                "run-standard-word-check",
                "--db",
                str(db_path),
                str(project_id),
                str(source_dir),
            ]
            cli_main()

            report_path = temp_dir / "report.md"
            csv_path = temp_dir / "report.csv"

            sys.argv = [
                "aastudio",
                "export-standard-word-report",
                "--db",
                str(db_path),
                str(project_id),
                str(report_path),
            ]
            cli_main()

            sys.argv = [
                "aastudio",
                "export-standard-word-csv",
                "--db",
                str(db_path),
                str(project_id),
                str(csv_path),
            ]
            cli_main()

            self.assertGreaterEqual(len(stdword_repo.list_check_results(project_id)), 1)
            self.assertTrue(report_path.exists())
            self.assertTrue(csv_path.exists())
            self.assertIn("Standard Word Report", report_path.read_text(encoding="utf-8"))
            self.assertIn("dictionary", csv_path.read_text(encoding="utf-8"))
        finally:
            sys.argv = old_argv
            del project_repo, stdword_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(source_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            source_dir.rmdir()
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_security_exports_create_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        project_repo = None
        source_repo = None
        security_scan_repo = None
        security_issue_repo = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            source_repo = SourceScanRepository(db_path)
            security_scan_repo = SecurityScanRepository(db_path)
            security_issue_repo = SecurityIssueRepository(db_path)

            project_id = project_repo.create_project("security", str(temp_dir))
            scan_id = source_repo.create_scan(project_id, str(temp_dir), "Python", "Unknown", 1)
            security_id = security_scan_repo.create_scan(project_id, scan_id)
            security_issue_repo.create_issue(
                security_id,
                "input-validation",
                "Potential SQL injection",
                "Untrusted input reaches a query.",
                "app.py",
                10,
                12,
                "high",
                "user input is concatenated",
                "use parameterized queries",
            )

            report_path = export_security_report(security_issue_repo, project_id, temp_dir / "security.md")
            csv_path = export_security_csv(security_issue_repo, project_id, temp_dir / "security.csv")

            overview = project_repo.get_overview_summary(project_id)
            dashboard = project_repo.get_dashboard_summary(project_id)

            class DummyProject:
                def __init__(self, pid: int, name: str) -> None:
                    self.id = pid
                    self.name = name

            html = build_dashboard_html(
                overview,
                dashboard,
                [DummyProject(project_id, "security")],
                {
                    "tab": "security",
                    "project_share": project_repo.get_project_share(project_id),
                    "wiki_pages": [],
                    "wbs_items": [],
                    "db_models": [],
                    "db_relations": [],
                    "diagrams": [],
                    "api_groups": [],
                    "api_endpoints": [],
                    "sample_datasets": [],
                    "standard_words": [],
                    "standard_word_checks": [],
                    "security_issues": security_issue_repo.list_issues_for_project(project_id),
                    "api_test_cases": [],
                    "api_test_results": [],
                    "access_logs": [],
                    "attachments": [],
                    "workspaces": [],
                },
            )

            self.assertTrue(report_path.exists())
            self.assertTrue(csv_path.exists())
            self.assertIn("Security Candidate Report", report_path.read_text(encoding="utf-8"))
            self.assertIn("Potential SQL injection", csv_path.read_text(encoding="utf-8"))
            self.assertIn("Security", html)
            self.assertIn("Potential SQL injection", html)
        finally:
            del project_repo, source_repo, security_scan_repo, security_issue_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_security_export_cli_writes_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        old_argv = sys.argv[:]
        project_repo = None
        source_repo = None
        security_scan_repo = None
        security_issue_repo = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            source_repo = SourceScanRepository(db_path)
            security_scan_repo = SecurityScanRepository(db_path)
            security_issue_repo = SecurityIssueRepository(db_path)

            project_id = project_repo.create_project("security-cli", str(temp_dir))
            scan_id = source_repo.create_scan(project_id, str(temp_dir), "Python", "Unknown", 1)
            security_id = security_scan_repo.create_scan(project_id, scan_id)
            security_issue_repo.create_issue(
                security_id,
                "input-validation",
                "Potential SQL injection",
                "Untrusted input reaches a query.",
                "app.py",
                10,
                12,
                "high",
                "user input is concatenated",
                "use parameterized queries",
            )

            for output_name, command, expected_text in (
                ("security.md", "export-security-report", "Security Candidate Report"),
                ("security.csv", "export-security-csv", "Potential SQL injection"),
            ):
                output_path = temp_dir / output_name
                sys.argv = [
                    "aastudio",
                    command,
                    "--db",
                    str(db_path),
                    str(project_id),
                    str(output_path),
                ]
                cli_main()
                self.assertTrue(output_path.exists())
                self.assertIn(expected_text, output_path.read_text(encoding="utf-8"))
        finally:
            sys.argv = old_argv
            del project_repo, source_repo, security_scan_repo, security_issue_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_api_spec_exports_create_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)

            project_id = project_repo.create_project("api", str(temp_dir))
            group_id = group_repo.create_group(project_id, "Users", "user endpoints")
            request_schema_id = schema_repo.create_schema(project_id, "UserRequest", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "UserResponse", "response", "{}")
            endpoint_repo.create_endpoint(group_id, "GET", "/users", "List users", True, request_schema_id, response_schema_id, 200)

            json_path = export_api_spec(group_repo, schema_repo, endpoint_repo, project_id, temp_dir / "api.json", "json")
            yaml_path = export_api_spec(group_repo, schema_repo, endpoint_repo, project_id, temp_dir / "api.yaml", "yaml")
            md_path = export_api_spec(group_repo, schema_repo, endpoint_repo, project_id, temp_dir / "api.md", "md")

            self.assertTrue(json_path.exists())
            self.assertTrue(yaml_path.exists())
            self.assertTrue(md_path.exists())
            self.assertIn("Users", json_path.read_text(encoding="utf-8"))
            self.assertIn("request_schema", yaml_path.read_text(encoding="utf-8"))
            self.assertIn("List users", md_path.read_text(encoding="utf-8"))
        finally:
            del project_repo, group_repo, schema_repo, endpoint_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_api_sync_exports_create_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)
            test_repo = ApiTestRepository(db_path)

            project_id = project_repo.create_project("api-sync", str(temp_dir))
            group_id = group_repo.create_group(project_id, "Users", "user endpoints")
            request_schema_id = schema_repo.create_schema(project_id, "UserRequest", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "UserResponse", "response", "{}")
            endpoint_id = endpoint_repo.create_endpoint(group_id, "POST", "/users", "Create user", True, request_schema_id, response_schema_id, 201)
            test_repo.create_case(project_id, endpoint_id, "{}", 201, "{}", None, None)

            md_path = export_api_sync_report(group_repo, schema_repo, endpoint_repo, test_repo, project_id, temp_dir / "api-sync.md", "md")
            json_path = export_api_sync_report(group_repo, schema_repo, endpoint_repo, test_repo, project_id, temp_dir / "api-sync.json", "json")

            self.assertTrue(md_path.exists())
            self.assertTrue(json_path.exists())
            self.assertIn("API Sync Report", md_path.read_text(encoding="utf-8"))
            self.assertIn("sync_mode_note", json_path.read_text(encoding="utf-8"))
        finally:
            del project_repo, group_repo, schema_repo, endpoint_repo, test_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_api_test_report_exports_create_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)
            test_repo = ApiTestRepository(db_path)

            project_id = project_repo.create_project("api-tests", str(temp_dir))
            group_id = group_repo.create_group(project_id, "Users", "user endpoints")
            request_schema_id = schema_repo.create_schema(project_id, "UserRequest", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "UserResponse", "response", "{}")
            endpoint_id = endpoint_repo.create_endpoint(group_id, "POST", "/users", "Create user", True, request_schema_id, response_schema_id, 201)
            case_id = test_repo.create_case(project_id, endpoint_id, "{\"name\":\"demo\"}", 201, "{\"id\":1}", None, None)
            test_repo.create_result(case_id, "{\"name\":\"demo\"}", "{\"id\":1}", 201, "passed", "ok")

            md_path = export_api_test_report(test_repo, endpoint_repo, project_id, temp_dir / "api-tests.md", "md")
            json_path = export_api_test_report(test_repo, endpoint_repo, project_id, temp_dir / "api-tests.json", "json")

            self.assertTrue(md_path.exists())
            self.assertTrue(json_path.exists())
            self.assertIn("API Test Report", md_path.read_text(encoding="utf-8"))
            self.assertIn("cases", json_path.read_text(encoding="utf-8"))
        finally:
            del project_repo, group_repo, schema_repo, endpoint_repo, test_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_api_test_screen_shows_case_and_result_details(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            group_repo = ApiGroupRepository(db_path)
            schema_repo = ApiSchemaRepository(db_path)
            endpoint_repo = ApiEndpointRepository(db_path)
            test_repo = ApiTestRepository(db_path)

            project_id = project_repo.create_project("api-screen", "D:/api-screen")
            group_id = group_repo.create_group(project_id, "Users")
            request_schema_id = schema_repo.create_schema(project_id, "UserRequest", "request", "{}")
            response_schema_id = schema_repo.create_schema(project_id, "UserResponse", "response", "{}")
            endpoint_id = endpoint_repo.create_endpoint(
                group_id,
                "POST",
                "/users",
                "Create user",
                True,
                request_schema_id,
                response_schema_id,
                201,
            )
            case_id = test_repo.create_case(
                project_id,
                endpoint_id,
                '{"name":"Demo"}',
                201,
                '{"id":1}',
                sample_dataset_id=None,
                auth_profile_id=None,
            )
            test_repo.create_result(case_id, '{"name":"Demo"}', '{"id":1}', 201, "passed", "created")

            overview = project_repo.get_overview_summary(project_id)
            dashboard = project_repo.get_dashboard_summary(project_id)

            class DummyProject:
                def __init__(self, pid: int, name: str) -> None:
                    self.id = pid
                    self.name = name

            html = build_dashboard_html(
                overview,
                dashboard,
                [DummyProject(project_id, "api-screen")],
                {
                    "tab": "tests",
                    "project_share": project_repo.get_project_share(project_id),
                    "wiki_pages": [],
                    "wbs_items": [],
                    "db_models": [],
                    "db_relations": [],
                    "diagrams": [],
                    "api_groups": group_repo.list_groups(project_id),
                    "api_endpoints": endpoint_repo.list_endpoints(group_id),
                    "sample_datasets": [],
                    "standard_words": [],
                    "standard_word_checks": [],
                    "security_issues": [],
                    "api_test_cases": test_repo.list_cases(project_id),
                    "api_test_results": test_repo.list_results(case_id),
                    "access_logs": [],
                    "attachments": [],
                    "workspaces": [],
                    "stage_assignments": [],
                    "stage_history": [],
                },
            )

            self.assertIn("Cases", html)
            self.assertIn("Latest Results", html)
            self.assertIn("/users", html)
            self.assertIn("Create user", html)
            self.assertIn("passed", html)
            self.assertIn("created", html)
        finally:
            del project_repo, group_repo, schema_repo, endpoint_repo, test_repo
            gc.collect()
            db_path.unlink(missing_ok=True)

    def test_diagram_exports_create_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        project_repo = None
        diagram_repo = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            diagram_repo = DiagramRepository(db_path)
            project_id = project_repo.create_project("demo", "D:/demo")
            diagram_repo.create_diagram(project_id, "Main ERD", json.dumps({"nodes": [], "relations": []}), "erd")

            md_path = export_diagram_bundle(diagram_repo, project_id, temp_dir / "erd.md", "md")
            json_path = export_diagram_bundle(diagram_repo, project_id, temp_dir / "erd.json", "json")

            self.assertTrue(md_path.exists())
            self.assertTrue(json_path.exists())
            self.assertIn("ERD Bundle", md_path.read_text(encoding="utf-8"))
            self.assertIn('"diagrams"', json_path.read_text(encoding="utf-8"))
        finally:
            del project_repo, diagram_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_diagram_export_cli_writes_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            diagram_repo = DiagramRepository(db_path)
            project_id = project_repo.create_project("diagram-cli", str(temp_dir))
            diagram_repo.create_diagram(project_id, "Main ERD", json.dumps({"nodes": [], "relations": []}), "erd")

            for output_name, output_format, expected_text in (
                ("erd.md", "md", "ERD Bundle"),
                ("erd.json", "json", "\"diagrams\""),
            ):
                output_path = temp_dir / output_name
                sys.argv = [
                    "aastudio",
                    "export-diagram",
                    "--db",
                    str(db_path),
                    str(project_id),
                    str(output_path),
                    "--format",
                    output_format,
                ]
                cli_main()
                self.assertTrue(output_path.exists())
                self.assertIn(expected_text, output_path.read_text(encoding="utf-8"))
        finally:
            sys.argv = old_argv
            del project_repo, diagram_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_db_design_exports_create_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        project_repo = None
        model_repo = None
        table_repo = None
        column_repo = None
        relation_repo = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            model_repo = DbModelRepository(db_path)
            table_repo = DbTableRepository(db_path)
            column_repo = DbColumnRepository(db_path)
            relation_repo = DbRelationRepository(db_path)

            project_id = project_repo.create_project("db", str(temp_dir))
            model_id = model_repo.create_model(project_id, "Core", "main model")
            users_table = table_repo.create_table(model_id, "users", "users table", "id")
            orders_table = table_repo.create_table(model_id, "orders", "orders table", "id")
            column_repo.create_column(users_table, "id", "INTEGER", False, "", True, True, "user id")
            column_repo.create_column(users_table, "name", "TEXT", False, "", False, False, "user name")
            relation_repo.create_relation(model_id, users_table, orders_table, "one-to-many", "id", "user_id", "ownership")

            md_path = export_db_design(model_repo, table_repo, column_repo, relation_repo, project_id, temp_dir / "db.md", "md")
            json_path = export_db_design(model_repo, table_repo, column_repo, relation_repo, project_id, temp_dir / "db.json", "json")
            sql_path = export_db_design(model_repo, table_repo, column_repo, relation_repo, project_id, temp_dir / "db.sql", "sql")

            self.assertTrue(md_path.exists())
            self.assertTrue(json_path.exists())
            self.assertTrue(sql_path.exists())
            self.assertIn("DB Design", md_path.read_text(encoding="utf-8"))
            self.assertIn("models", json_path.read_text(encoding="utf-8"))
            self.assertIn("CREATE TABLE", sql_path.read_text(encoding="utf-8"))
        finally:
            del project_repo, model_repo, table_repo, column_repo, relation_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_db_design_export_cli_writes_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            model_repo = DbModelRepository(db_path)
            table_repo = DbTableRepository(db_path)
            column_repo = DbColumnRepository(db_path)
            relation_repo = DbRelationRepository(db_path)

            project_id = project_repo.create_project("db-cli", str(temp_dir))
            model_id = model_repo.create_model(project_id, "Core", "main model")
            users_table = table_repo.create_table(model_id, "users", "users table", "id")
            orders_table = table_repo.create_table(model_id, "orders", "orders table", "id")
            column_repo.create_column(users_table, "id", "INTEGER", False, "", True, True, "user id")
            column_repo.create_column(users_table, "name", "TEXT", False, "", False, False, "user name")
            relation_repo.create_relation(model_id, users_table, orders_table, "one-to-many", "id", "user_id", "ownership")

            for output_name, output_format, expected_text in (
                ("db.md", "md", "DB Design"),
                ("db.json", "json", "models"),
                ("db.sql", "sql", "CREATE TABLE"),
            ):
                output_path = temp_dir / output_name
                sys.argv = [
                    "aastudio",
                    "export-db-design",
                    "--db",
                    str(db_path),
                    str(project_id),
                    str(output_path),
                    "--format",
                    output_format,
                ]
                cli_main()
                self.assertTrue(output_path.exists())
                self.assertIn(expected_text, output_path.read_text(encoding="utf-8"))
        finally:
            sys.argv = old_argv
            del project_repo, model_repo, table_repo, column_repo, relation_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_wiki_and_wbs_exports_create_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        project_repo = None
        wiki_repo = None
        wbs_repo = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)
            wbs_repo = WbsRepository(db_path)

            project_id = project_repo.create_project("docs", str(temp_dir))
            page_id = wiki_repo.create_page(project_id, "Guide", "guide", "content", tags="docs", created_by="tester")
            wiki_repo.create_page(project_id, "Notes", "notes", "more content", created_by="tester")
            wiki_repo.add_attachment(project_id, page_id, "guide.pdf", "guide.pdf", "D:/docs/guide.pdf")
            wbs_repo.create_item(project_id, "Draft docs", "write docs", None, "pending", "high", "wiki", page_id)

            wiki_md = export_wiki_bundle(wiki_repo, project_id, temp_dir / "wiki.md", "md")
            wiki_json = export_wiki_bundle(wiki_repo, project_id, temp_dir / "wiki.json", "json")
            wbs_md = export_wbs_bundle(wbs_repo, project_id, temp_dir / "wbs.md", "md")
            wbs_json = export_wbs_bundle(wbs_repo, project_id, temp_dir / "wbs.json", "json")

            self.assertTrue(wiki_md.exists())
            self.assertTrue(wiki_json.exists())
            self.assertTrue(wbs_md.exists())
            self.assertTrue(wbs_json.exists())
            self.assertIn("Wiki Bundle", wiki_md.read_text(encoding="utf-8"))
            self.assertIn("attachments", wiki_json.read_text(encoding="utf-8"))
            self.assertIn("WBS Bundle", wbs_md.read_text(encoding="utf-8"))
            self.assertIn("Draft docs", wbs_json.read_text(encoding="utf-8"))
        finally:
            del project_repo, wiki_repo, wbs_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_wiki_and_wbs_export_cli_writes_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        old_argv = sys.argv[:]
        project_repo = None
        wiki_repo = None
        wbs_repo = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            wiki_repo = WikiRepository(db_path)
            wbs_repo = WbsRepository(db_path)

            project_id = project_repo.create_project("docs-cli", str(temp_dir))
            page_id = wiki_repo.create_page(project_id, "Guide", "guide", "content", tags="docs", created_by="tester")
            wiki_repo.create_page(project_id, "Notes", "notes", "more content", created_by="tester")
            wiki_repo.add_attachment(project_id, page_id, "guide.pdf", "guide.pdf", "D:/docs/guide.pdf")
            wbs_repo.create_item(project_id, "Draft docs", "write docs", None, "pending", "high", "wiki", page_id)

            wiki_md = temp_dir / "wiki.md"
            wiki_json = temp_dir / "wiki.json"
            wbs_md = temp_dir / "wbs.md"
            wbs_json = temp_dir / "wbs.json"

            for command, output_path, output_format in (
                ("export-wiki", wiki_md, "md"),
                ("export-wiki", wiki_json, "json"),
                ("export-wbs", wbs_md, "md"),
                ("export-wbs", wbs_json, "json"),
            ):
                sys.argv = [
                    "aastudio",
                    command,
                    "--db",
                    str(db_path),
                    str(project_id),
                    str(output_path),
                    "--format",
                    output_format,
                ]
                cli_main()

            self.assertTrue(wiki_md.exists())
            self.assertTrue(wiki_json.exists())
            self.assertTrue(wbs_md.exists())
            self.assertTrue(wbs_json.exists())
            self.assertIn("Wiki Bundle", wiki_md.read_text(encoding="utf-8"))
            self.assertIn("attachments", wiki_json.read_text(encoding="utf-8"))
            self.assertIn("WBS Bundle", wbs_md.read_text(encoding="utf-8"))
            self.assertIn("Draft docs", wbs_json.read_text(encoding="utf-8"))
        finally:
            sys.argv = old_argv
            del project_repo, wiki_repo, wbs_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_source_scan_summary_exports_create_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            source_repo = SourceScanRepository(db_path)

            project_id = project_repo.create_project("source", str(temp_dir))
            source_repo.create_scan(project_id, "D:/source", "Python", "Unknown", 5)

            md_path = export_source_scan_summary(source_repo, project_id, temp_dir / "source.md", "md")
            json_path = export_source_scan_summary(source_repo, project_id, temp_dir / "source.json", "json")

            self.assertTrue(md_path.exists())
            self.assertTrue(json_path.exists())
            self.assertIn("Source Scan Summary", md_path.read_text(encoding="utf-8"))
            self.assertIn("scans", json_path.read_text(encoding="utf-8"))
        finally:
            del project_repo, source_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_source_scan_summary_export_cli_writes_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        old_argv = sys.argv[:]
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            source_repo = SourceScanRepository(db_path)

            project_id = project_repo.create_project("source-cli", str(temp_dir))
            source_repo.create_scan(project_id, "D:/source", "Python", "Unknown", 5)

            for output_name, output_format, expected_text in (
                ("source.md", "md", "Source Scan Summary"),
                ("source.json", "json", "scans"),
            ):
                output_path = temp_dir / output_name
                sys.argv = [
                    "aastudio",
                    "export-source-scan",
                    "--db",
                    str(db_path),
                    str(project_id),
                    str(output_path),
                    "--format",
                    output_format,
                ]
                cli_main()
                self.assertTrue(output_path.exists())
                self.assertIn(expected_text, output_path.read_text(encoding="utf-8"))
        finally:
            sys.argv = old_argv
            del project_repo, source_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_source_code_scan_report_exports_create_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        project_repo = None
        source_repo = None
        code_repo = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            source_repo = SourceScanRepository(db_path)
            code_repo = SourceCodeScanRepository(db_path)

            project_id = project_repo.create_project("code", str(temp_dir))
            scan_id = source_repo.create_scan(project_id, "D:/code", "Python", "Unknown", 2)
            code_repo.create_finding(
                project_id,
                scan_id,
                "app.py",
                "todo-comment",
                "minor",
                "Potential review item found.",
                "A simple rule-based finding was recorded.",
                10,
                12,
                0.8,
            )

            md_path = export_code_scan_report(code_repo, project_id, temp_dir / "code.md", "md")
            json_path = export_code_scan_report(code_repo, project_id, temp_dir / "code.json", "json")

            self.assertTrue(md_path.exists())
            self.assertTrue(json_path.exists())
            self.assertIn("Source Code Scan Report", md_path.read_text(encoding="utf-8"))
            self.assertIn("findings", json_path.read_text(encoding="utf-8"))
        finally:
            del project_repo, source_repo, code_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()

    def test_source_code_scan_report_export_cli_writes_files(self) -> None:
        fd, raw_path = tempfile.mkstemp(suffix=".sqlite3")
        os.close(fd)
        db_path = Path(raw_path)
        temp_dir = Path(tempfile.mkdtemp())
        old_argv = sys.argv[:]
        project_repo = None
        source_repo = None
        code_repo = None
        try:
            initialize_database(db_path)
            project_repo = ProjectRepository(db_path)
            source_repo = SourceScanRepository(db_path)
            code_repo = SourceCodeScanRepository(db_path)

            project_id = project_repo.create_project("code-cli", str(temp_dir))
            scan_id = source_repo.create_scan(project_id, "D:/code", "Python", "Unknown", 2)
            code_repo.create_finding(
                project_id,
                scan_id,
                "app.py",
                "todo-comment",
                "minor",
                "Potential review item found.",
                "A simple rule-based finding was recorded.",
                10,
                12,
                0.8,
            )

            for output_name, output_format, expected_text in (
                ("code.md", "md", "Source Code Scan Report"),
                ("code.json", "json", "findings"),
            ):
                output_path = temp_dir / output_name
                sys.argv = [
                    "aastudio",
                    "export-code-scan",
                    "--db",
                    str(db_path),
                    str(project_id),
                    str(output_path),
                    "--format",
                    output_format,
                ]
                cli_main()
                self.assertTrue(output_path.exists())
                self.assertIn(expected_text, output_path.read_text(encoding="utf-8"))
        finally:
            sys.argv = old_argv
            del project_repo, source_repo, code_repo
            gc.collect()
            db_path.unlink(missing_ok=True)
            for path in sorted(temp_dir.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink(missing_ok=True)
                elif path.is_dir():
                    path.rmdir()
            temp_dir.rmdir()
