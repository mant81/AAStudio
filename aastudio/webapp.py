from __future__ import annotations

import html
import mimetypes
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .repository import (
    AccessLogRepository,
    ApiAuthProfileRepository,
    ApiEndpointRepository,
    ApiGroupRepository,
    ApiSchemaRepository,
    ApiTestRepository,
    ProjectWorkspaceRepository,
    DiagramRepository,
    DbModelRepository,
    DbRelationRepository,
    DbTableRepository,
    ProjectRepository,
    SampleDatasetRepository,
    StandardWordRepository,
    SecurityIssueRepository,
    SecurityScanRepository,
    SourceCodeScanRepository,
    SourceScanRepository,
    WikiRepository,
    WbsRepository,
)


def format_related_target(related_item_type: str, related_item_id: int | None) -> str:
    if not related_item_type and related_item_id is None:
        return "-"
    type_label = {
        "wbs": "WBS",
        "wiki": "Wiki",
        "db": "DB",
        "diagram": "Diagram",
        "api": "API",
        "sample": "Sample",
        "tests": "API Test",
        "security": "Security",
        "source": "Source Scan",
    }.get(related_item_type or "", related_item_type or "Related")
    if related_item_id is None:
        return type_label
    return f"{type_label} #{related_item_id}"


def format_related_output(related_item_type: str, related_item_id: int | None) -> str:
    target = format_related_target(related_item_type, related_item_id)
    if target == "-":
        return "-"
    return target


def find_endpoint(tab_data: dict, endpoint_id: int | None):
    if endpoint_id is None:
        return None
    for endpoint in tab_data.get("api_endpoints", []):
        if endpoint.id == endpoint_id:
            return endpoint
    return None


def build_navigation_items(overview, dashboard, projects, tab_data: dict) -> str:
    recent_projects = tab_data.get("recent_projects", [])
    project_rows = "".join(
        f"<li><a href='/?project_id={project.id}&tab={tab_data['tab']}'>{html.escape(project.name)}</a>"
        f"<span>{html.escape(project.current_stage or 'planning')}</span></li>"
        for project in recent_projects
    ) or "<li>No projects yet.</li>"
    return f"""
    <aside class="sidebar">
      <section class="sidebar-card">
        <h2>Project Switcher</h2>
        <form method="post" action="/projects" class="stack">
          <input name="name" placeholder="New project name" />
          <input name="root_path" placeholder="Root path" value="{html.escape(overview.project_name)}" />
          <input name="description" placeholder="Description" />
          <button type="submit">Create Project</button>
        </form>
        <form method="get" action="/" class="stack">
          <input name="q" placeholder="Search projects" value="{html.escape(tab_data.get('query', ''))}" />
          <input type="hidden" name="project_id" value="{overview.project_id}" />
          <button type="submit">Search</button>
        </form>
      </section>
      <section class="sidebar-card">
        <h2>Recent Projects</h2>
        <ul class="nav-list">{project_rows}</ul>
      </section>
      <section class="sidebar-card">
        <h2>Project Summary</h2>
        <div class="summary-grid">
          <div><strong>{overview.source_scans}</strong><span>Source</span></div>
          <div><strong>{overview.security_issues}</strong><span>Security</span></div>
          <div><strong>{overview.wiki_pages}</strong><span>Wiki</span></div>
          <div><strong>{overview.wbs_items}</strong><span>WBS</span></div>
        </div>
      </section>
    </aside>
    """


def build_property_panel(overview, dashboard, tab_data: dict) -> str:
    share = tab_data.get("project_share")
    first_assignment = (tab_data.get("stage_assignments") or [None])[0]
    first_issue = (tab_data.get("security_issues") or [None])[0]
    first_endpoint = (tab_data.get("api_endpoints") or [None])[0]
    lines = [
        ("Project", overview.project_name),
        ("Current stage", dashboard.current_stage),
        ("Share", "readonly" if share and share.is_readonly else "internal"),
        ("Latest source scan", dashboard.latest_source_scan_path or "-"),
        ("Latest security issue", dashboard.latest_security_issue_title or "-"),
        ("Latest API test", dashboard.latest_api_test_message or "-"),
    ]
    focus = ""
    if tab_data["tab"] == "overview" and first_assignment is not None:
        focus = f"<p><strong>{html.escape(first_assignment.stage_name)}</strong><br>{html.escape(first_assignment.assignee_name or '-')}"
        focus += f"<br>{html.escape(first_assignment.assignee_email or '-')}</p>"
    elif tab_data["tab"] == "security" and first_issue is not None:
        focus = f"<p><strong>{html.escape(first_issue.title)}</strong><br>{html.escape(first_issue.risk_level)}<br>{html.escape(first_issue.file_path)}</p>"
    elif tab_data["tab"] == "api" and first_endpoint is not None:
        focus = f"<p><strong>{html.escape(first_endpoint.method)} {html.escape(first_endpoint.path)}</strong><br>{html.escape(first_endpoint.summary)}</p>"
    else:
        focus = "<p>Select an item in the current tab to inspect it here.</p>"
    rows = "".join(f"<tr><th>{html.escape(label)}</th><td>{html.escape(value)}</td></tr>" for label, value in lines)
    return f"""
    <aside class="properties">
      <section class="sidebar-card">
        <h2>Selected Details</h2>
        <table>{rows}</table>
        {focus}
      </section>
      <section class="sidebar-card">
        <h2>Share Controls</h2>
        <form method="post" action="/share" class="stack">
          <input type="hidden" name="project_id" value="{overview.project_id}" />
          <label><input type="checkbox" name="readonly" {"checked" if share and share.is_readonly else ""} /> Readonly share</label>
          <input name="scope" value="{html.escape(share.share_scope if share else 'internal')}" />
          <input name="note" value="{html.escape(share.note if share else '')}" placeholder="Share note" />
          <button type="submit">Update Share</button>
        </form>
      </section>
    </aside>
    """


def build_dashboard_html(overview, dashboard, projects, tab_data) -> str:
    share = tab_data.get("project_share")
    recent_projects = tab_data.get("recent_projects", projects)
    project_options = "".join(
        f'<option value="{p.id}" {"selected" if p.id == overview.project_id else ""}>'
        f"{html.escape(p.name)}</option>"
        for p in projects
    )

    def row(label: str, value: str) -> str:
        return f"<tr><th>{html.escape(label)}</th><td>{html.escape(value)}</td></tr>"

    cards = [
        ("Source scans", overview.source_scans),
        ("Source code findings", overview.source_code_findings),
        ("Security scans", overview.security_scans),
        ("Security issues", overview.security_issues),
        ("Wiki pages", overview.wiki_pages),
        ("WBS items", overview.wbs_items),
        ("DB models", overview.db_models),
        ("DB relations", overview.db_relations),
        ("Diagrams", overview.diagrams),
        ("API groups", overview.api_groups),
        ("API endpoints", overview.api_endpoints),
        ("Sample datasets", overview.sample_datasets),
        ("API test cases", overview.api_test_cases),
        ("API test results", overview.api_test_results),
        ("Access logs", overview.access_logs),
        ("Attachments", overview.attachments),
        ("Workspaces", overview.workspaces),
    ]
    cards_html = "".join(
        f"<article class='card'><h3>{html.escape(title)}</h3><p>{value}</p></article>"
        for title, value in cards
    )
    tab_links = [
        ("overview", "Overview"),
        ("wiki", "Wiki"),
        ("wbs", "WBS"),
        ("db", "DB"),
        ("diagram", "Diagram"),
        ("api", "API"),
        ("sample", "Samples"),
        ("stdword", "Std Words"),
        ("security", "Security"),
        ("tests", "Tests"),
        ("logs", "Logs"),
        ("files", "Files"),
        ("workspaces", "Workspaces"),
    ]
    tab_nav = "".join(
        f'<a class="tab {"active" if tab_data["tab"] == key else ""}" href="/?project_id={overview.project_id}&tab={key}">{label}</a>'
        for key, label in tab_links
    )
    artifact_link = f"/artifact?project_id={overview.project_id}&tab={tab_data['tab']}"
    artifact_path = f"data/artifacts/aastudio-{overview.project_id}-{tab_data['tab']}.md"

    latest_source_scan = (
        f"#{dashboard.latest_source_scan_id} {dashboard.latest_source_scan_language or 'unknown'} "
        f"/ {dashboard.latest_source_scan_framework or 'unknown'} / {dashboard.latest_source_scan_path or '-'}"
        if dashboard.latest_source_scan_id is not None
        else "-"
    )
    latest_security_issue = (
        f"scan #{dashboard.latest_security_scan_id} / {dashboard.latest_security_issue_title or '-'} / "
        f"{dashboard.latest_security_issue_risk_level or '-'}"
        if dashboard.latest_security_scan_id is not None
        else "-"
    )
    latest_api_test = (
        f"case #{dashboard.latest_api_test_case_id} / {dashboard.latest_api_test_status_code or '-'} / "
        f"{dashboard.latest_api_test_result_status or '-'} / {dashboard.latest_api_test_message or '-'}"
        if dashboard.latest_api_test_case_id is not None
        else "-"
    )
    share_state = "readonly" if share and share.is_readonly else "internal"
    share_scope = share.share_scope if share else "internal"
    share_note = share.note if share else ""
    artifact_button = (
        f"<span class='tab' aria-disabled='true'>Final Artifact</span>"
        if share and share.is_readonly
        else f"<a class='tab' href='{artifact_link}'>Final Artifact</a>"
    )
    export_command_map = {
        "overview": f"python -m aastudio export-source-scan {overview.project_id} data/source-scan.md --format md",
        "wiki": f"python -m aastudio export-wiki {overview.project_id} data/wiki.md --format md",
        "wbs": f"python -m aastudio export-wbs {overview.project_id} data/wbs.md --format md",
        "db": f"python -m aastudio export-db-design {overview.project_id} data/db-design.md --format md",
        "diagram": f"python -m aastudio export-diagram {overview.project_id} data/erd.md --format md",
        "api": f"python -m aastudio export-api-spec {overview.project_id} data/api-spec.md --format md",
        "sample": f"python -m aastudio export-api-sync {overview.project_id} data/api-sync.md --format md",
        "stdword": f"python -m aastudio export-standard-word-report {overview.project_id} data/stdword.md",
        "security": f"python -m aastudio export-security-report {overview.project_id} data/security.md",
        "tests": f"python -m aastudio export-api-test-report {overview.project_id} data/api-tests.md --format md",
        "logs": f"python -m aastudio export-api-sync {overview.project_id} data/api-sync.md --format md",
        "files": f"python -m aastudio export-wiki {overview.project_id} data/wiki.md --format md",
        "workspaces": f"python -m aastudio export-wbs {overview.project_id} data/wbs.md --format md",
    }
    export_command = export_command_map.get(tab_data["tab"], f"python -m aastudio export-db-design {overview.project_id} data/db-design.md --format md")
    sidebar_html = build_navigation_items(overview, dashboard, recent_projects, tab_data)
    properties_html = build_property_panel(overview, dashboard, tab_data)

    wiki_rows = "".join(
        f"<tr><td>{p.id}</td><td>{html.escape(p.title)}</td><td>{html.escape(p.slug)}</td><td>{html.escape(p.tags)}</td></tr>"
        for p in tab_data.get("wiki_pages", [])
    ) or "<tr><td colspan='4'>No wiki pages yet.</td></tr>"
    wbs_rows = "".join(
        f"<tr><td>{i.id}</td><td>{html.escape(i.title)}</td><td>{html.escape(i.status)}</td><td>{html.escape(i.priority)}</td></tr>"
        for i in tab_data.get("wbs_items", [])
    ) or "<tr><td colspan='4'>No WBS items yet.</td></tr>"
    db_rows = "".join(
        f"<tr><td>{m.id}</td><td>{html.escape(m.name)}</td><td>{html.escape(m.description)}</td></tr>"
        for m in tab_data.get("db_models", [])
    ) or "<tr><td colspan='3'>No DB models yet.</td></tr>"
    diagram_rows = "".join(
        f"<tr><td>{d.id}</td><td>{html.escape(d.diagram_type)}</td><td>{html.escape(d.name)}</td></tr>"
        for d in tab_data.get("diagrams", [])
    ) or "<tr><td colspan='3'>No diagrams yet.</td></tr>"
    api_group_rows = "".join(
        f"<tr><td>{g.id}</td><td>{html.escape(g.name)}</td><td>{html.escape(g.description)}</td></tr>"
        for g in tab_data.get("api_groups", [])
    ) or "<tr><td colspan='3'>No API groups yet.</td></tr>"
    api_endpoint_rows = "".join(
        f"<tr><td>{e.id}</td><td>{html.escape(e.method)}</td><td>{html.escape(e.path)}</td><td>{html.escape(e.summary)}</td><td>{'auth' if e.auth_required else 'open'}</td></tr>"
        for e in tab_data.get("api_endpoints", [])
    ) or "<tr><td colspan='5'>No API endpoints yet.</td></tr>"
    sample_rows = "".join(
        f"<tr><td>{s.id}</td><td>{html.escape(s.name)}</td><td>{'shared' if s.is_shared else 'private'}</td><td>{html.escape(s.description)}</td></tr>"
        for s in tab_data.get("sample_datasets", [])
    ) or "<tr><td colspan='4'>No sample datasets yet.</td></tr>"
    attachment_rows = "".join(
        f"<tr><td>{a.id}</td><td>{html.escape(a.original_name)}</td><td>{html.escape(a.file_path)}</td><td>{html.escape(a.mime_type or '-')}</td></tr>"
        for a in tab_data.get("attachments", [])
    ) or "<tr><td colspan='4'>No attachments yet.</td></tr>"
    workspace_rows = "".join(
        f"<tr><td>{w.id}</td><td>{html.escape(w.workspace_name)}</td><td>{html.escape(w.workspace_type)}</td><td>{'active' if w.is_active else 'inactive'}</td></tr>"
        for w in tab_data.get("workspaces", [])
    ) or "<tr><td colspan='4'>No workspaces yet.</td></tr>"
    test_rows = "".join(
        f"<tr><td>{t.id}</td><td>{t.api_endpoint_id}</td><td>{t.expected_status_code}</td><td>{t.sample_dataset_id or '-'}</td></tr>"
        for t in tab_data.get("api_test_cases", [])
    ) or "<tr><td colspan='4'>No API test cases yet.</td></tr>"
    log_rows = "".join(
        f"<tr><td>{l.id}</td><td>{html.escape(l.actor)}</td><td>{html.escape(l.action)}</td><td>{html.escape(l.target_type)}</td><td>{l.target_id or '-'}</td><td>{html.escape(l.ip_address)}</td></tr>"
        for l in tab_data.get("access_logs", [])
    ) or "<tr><td colspan='6'>No access logs yet.</td></tr>"

    return f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AAStudio Dashboard</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #0f172a;
      --panel: #111827;
      --card: #1f2937;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --accent: #38bdf8;
      --border: #334155;
    }}
    body {{
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: linear-gradient(180deg, #020617 0%, #0f172a 40%, #111827 100%);
      color: var(--text);
    }}
    header {{
      padding: 28px 32px 16px;
      border-bottom: 1px solid var(--border);
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(8px);
      position: sticky;
      top: 0;
    }}
    h1 {{
      margin: 0 0 8px;
      font-size: 28px;
    }}
    .meta {{
      color: var(--muted);
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      align-items: center;
    }}
    main {{
      padding: 20px;
      display: grid;
      gap: 16px;
    }}
    .shell {{
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr) 280px;
      gap: 16px;
      align-items: start;
    }}
    .toolbar {{
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      padding: 16px;
      background: rgba(17, 24, 39, 0.7);
      border: 1px solid var(--border);
      border-radius: 16px;
    }}
    select, input, button {{
      background: #0b1220;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      font: inherit;
    }}
    button {{
      background: var(--accent);
      color: #082f49;
      cursor: pointer;
      font-weight: 700;
    }}
    .tabs {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }}
    .tab {{
      text-decoration: none;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--text);
      background: rgba(15, 23, 42, 0.7);
    }}
    .tab.active {{
      background: var(--accent);
      color: #082f49;
      font-weight: 700;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }}
    .card {{
      background: rgba(31, 41, 55, 0.88);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      min-height: 92px;
    }}
    .card h3 {{
      margin: 0 0 10px;
      font-size: 14px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }}
    .card p {{
      margin: 0;
      font-size: 28px;
      font-weight: 800;
    }}
    .panel {{
      background: rgba(17, 24, 39, 0.78);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
    }}
    th, td {{
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }}
    th {{
      width: 220px;
      color: var(--muted);
      font-weight: 600;
    }}
    .table-wrap {{
      overflow-x: auto;
    }}
    .grid-2 {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }}
    .sidebar, .properties {{
      display: grid;
      gap: 16px;
      position: sticky;
      top: 120px;
    }}
    .sidebar-card {{
      background: rgba(17, 24, 39, 0.82);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
    }}
    .nav-list {{
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 8px;
    }}
    .nav-list li {{
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }}
    .nav-list a {{ color: var(--text); text-decoration: none; }}
    .summary-grid {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }}
    .summary-grid div {{
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px;
    }}
    .summary-grid strong {{ display: block; font-size: 22px; }}
    .summary-grid span {{ color: var(--muted); font-size: 12px; }}
    .stack {{ display: grid; gap: 10px; }}
    .shell > section, .shell > aside {{ min-width: 0; }}
    code {{
      background: #0b1220;
      border: 1px solid var(--border);
      padding: 2px 6px;
      border-radius: 6px;
    }}
  </style>
</head>
<body>
  <header>
    <h1>AAStudio Dashboard</h1>
    <div class="meta">
      <span>Project: <strong>{html.escape(overview.project_name)}</strong></span>
      <span>Stage: <strong>{html.escape(overview.current_stage)}</strong></span>
      <span>Share: <strong>{html.escape(share_state)}</strong></span>
      <span>Current summary: <strong>{html.escape(dashboard.summary or "-")}</strong></span>
    </div>
  </header>
  <main>
    <section class="toolbar">
      <form method="get" action="/">
        <label for="project">Project</label>
        <select id="project" name="project_id">{project_options}</select>
        <button type="submit">Open</button>
      </form>
      <form method="post" action="/refresh">
        <input type="hidden" name="project_id" value="{overview.project_id}" />
        <input name="stage" placeholder="stage" value="{html.escape(dashboard.current_stage)}" />
        <input name="summary" placeholder="summary" value="{html.escape(dashboard.summary)}" />
        <button type="submit">Update Dashboard</button>
      </form>
      {artifact_button}
    </section>
    <div class="shell">
      {sidebar_html}
      <section class="content">
        <nav class="tabs">{tab_nav}</nav>
        <section class="grid">{cards_html}</section>
        <section class="grid-2">
          <section class="panel">
            <h2>Dashboard Details</h2>
            <table>
              {row("Latest source scan", latest_source_scan)}
              {row("Latest security issue", latest_security_issue)}
              {row("Latest API test", latest_api_test)}
              {row("Project root", overview.project_name)}
              {row("Final artifact path", artifact_path)}
              {row("Share scope", share_scope)}
              {row("Share note", share_note or "-")}
            </table>
          </section>
          <section class="panel">
            <h2>Action Links</h2>
            <div>{html.escape(tab_data["tab"].title())}</div>
            <p><code>{html.escape(export_command)}</code></p>
          </section>
        </section>
        <section class="panel">
          <h2>Current Tab</h2>
          {build_tab_section(tab_data)}
        </section>
        <section class="panel">
          <h2>Overview JSON</h2>
          <pre>{html.escape(json.dumps(asdict(overview), ensure_ascii=False, indent=2))}</pre>
        </section>
        <section class="panel">
          <h2>Final Artifact Preview</h2>
          <pre>{html.escape(build_final_artifact_markdown(overview, dashboard, tab_data)[:1800])}</pre>
        </section>
      </section>
      {properties_html}
    </div>
  </main>
</body>
</html>"""


def build_tab_section(tab_data: dict) -> str:
    tab = tab_data["tab"]
    if tab == "wiki":
        return f"""
        <form method="post" action="/create-wiki" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="title" placeholder="Page title" />
          <input name="slug" placeholder="slug" />
          <input name="tags" placeholder="tags" />
          <textarea name="content" rows="4" placeholder="page content"></textarea>
          <button type="submit">Create Wiki Page</button>
        </form>
        <div class="grid-2">
          <section class="panel">
            <h3>Pages</h3>
            <div class="table-wrap"><table>
              <thead><tr><th>ID</th><th>Title</th><th>Slug</th><th>Tags</th></tr></thead>
              <tbody>{''.join(f'<tr><td>{p.id}</td><td>{html.escape(p.title)}</td><td>{html.escape(p.slug)}</td><td>{html.escape(p.tags)}</td></tr>' for p in tab_data['wiki_pages']) or '<tr><td colspan="4">No wiki pages yet.</td></tr>'}</tbody>
            </table></div>
          </section>
          <section class="panel">
            <h3>Versions</h3>
            <div class="table-wrap"><table>
              <thead><tr><th>Version</th><th>By</th><th>Note</th></tr></thead>
              <tbody>{''.join(f'<tr><td>{v.version_no}</td><td>{html.escape(v.created_by)}</td><td>{html.escape(v.change_note)}</td></tr>' for v in tab_data.get("wiki_versions", [])) or '<tr><td colspan="3">No wiki versions yet.</td></tr>'}</tbody>
            </table></div>
          </section>
        </div>
        """
    if tab == "wbs":
        return f"""
        <form method="post" action="/create-wbs" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="title" placeholder="WBS title" />
          <input name="description" placeholder="description" />
          <input name="status" placeholder="status" value="pending" />
          <input name="priority" placeholder="priority" value="normal" />
          <button type="submit">Create WBS Item</button>
        </form>
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Priority</th></tr></thead>
          <tbody>{''.join(f'<tr><td>{i.id}</td><td>{html.escape(i.title)}</td><td>{html.escape(i.status)}</td><td>{html.escape(i.priority)}</td></tr>' for i in tab_data['wbs_items']) or '<tr><td colspan="4">No WBS items yet.</td></tr>'}</tbody>
        </table></div>
        """
    if tab == "db":
        return f"""
        <form method="post" action="/create-db-model" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="name" placeholder="Model name" />
          <input name="description" placeholder="description" />
          <button type="submit">Create DB Model</button>
        </form>
        <form method="post" action="/create-db-table" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="db_model_id" placeholder="Model ID" />
          <input name="name" placeholder="Table name" />
          <input name="primary_key" placeholder="primary key" />
          <input name="description" placeholder="description" />
          <button type="submit">Create DB Table</button>
        </form>
        <form method="post" action="/create-db-column" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="db_table_id" placeholder="Table ID" />
          <input name="name" placeholder="Column name" />
          <input name="data_type" placeholder="data type" />
          <input name="default_value" placeholder="default value" />
          <button type="submit">Create DB Column</button>
        </form>
        <form method="post" action="/create-db-relation" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="db_model_id" placeholder="Model ID" />
          <input name="from_table_id" placeholder="From table ID" />
          <input name="to_table_id" placeholder="To table ID" />
          <input name="relation_type" placeholder="relation type" />
          <input name="from_column" placeholder="from column" />
          <input name="to_column" placeholder="to column" />
          <button type="submit">Create DB Relation</button>
        </form>
        <div class="grid-2">
          <section class="panel">
            <h3>Models</h3>
            <div class="table-wrap"><table>
              <thead><tr><th>ID</th><th>Name</th><th>Description</th></tr></thead>
              <tbody>{''.join(f'<tr><td>{m.id}</td><td>{html.escape(m.name)}</td><td>{html.escape(m.description)}</td></tr>' for m in tab_data['db_models']) or '<tr><td colspan="3">No DB models yet.</td></tr>'}</tbody>
            </table></div>
          </section>
          <section class="panel">
            <h3>Relations</h3>
            <div class="table-wrap"><table>
              <thead><tr><th>ID</th><th>From</th><th>To</th><th>Type</th></tr></thead>
              <tbody>{''.join(f'<tr><td>{r.id}</td><td>{r.from_table_id}:{html.escape(r.from_column)}</td><td>{r.to_table_id}:{html.escape(r.to_column)}</td><td>{html.escape(r.relation_type)}</td></tr>' for r in tab_data['db_relations']) or '<tr><td colspan="4">No DB relations yet.</td></tr>'}</tbody>
            </table></div>
          </section>
        </div>
        """
    if tab == "diagram":
        return f"""
        <form method="post" action="/create-diagram" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="name" placeholder="Diagram name" />
          <input name="diagram_type" placeholder="diagram type" value="erd" />
          <textarea name="payload_json" rows="4" placeholder='{{"nodes":[]}}'></textarea>
          <button type="submit">Create Diagram</button>
        </form>
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Type</th><th>Name</th></tr></thead>
          <tbody>{''.join(f'<tr><td>{d.id}</td><td>{html.escape(d.diagram_type)}</td><td>{html.escape(d.name)}</td></tr>' for d in tab_data['diagrams']) or '<tr><td colspan="3">No diagrams yet.</td></tr>'}</tbody>
        </table></div>
        """
    if tab == "api":
        return f"""
        <form method="post" action="/create-api-group" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="name" placeholder="API group name" />
          <input name="description" placeholder="description" />
          <button type="submit">Create API Group</button>
        </form>
        <form method="post" action="/create-api-endpoint" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="api_group_id" placeholder="Group ID" />
          <input name="method" placeholder="method" value="GET" />
          <input name="path" placeholder="/path" />
          <input name="summary" placeholder="summary" />
          <input name="status_code" placeholder="status code" value="200" />
          <button type="submit">Create API Endpoint</button>
        </form>
        <div class="grid-2">
          <section class="panel">
            <h3>Groups</h3>
            <div class="table-wrap"><table><tbody>{''.join(f'<tr><td>{g.id}</td><td>{html.escape(g.name)}</td></tr>' for g in tab_data['api_groups']) or '<tr><td colspan="2">No API groups yet.</td></tr>'}</tbody></table></div>
          </section>
          <section class="panel">
            <h3>Endpoints</h3>
            <div class="table-wrap"><table><tbody>{''.join(f'<tr><td>{e.method}</td><td>{html.escape(e.path)}</td><td>{html.escape(e.summary)}</td></tr>' for e in tab_data['api_endpoints']) or '<tr><td colspan="3">No API endpoints yet.</td></tr>'}</tbody></table></div>
          </section>
        </div>
        """
    if tab == "sample":
        return f"""
        <form method="post" action="/create-sample-dataset" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="name" placeholder="Dataset name" />
          <input name="description" placeholder="description" />
          <label><input type="checkbox" name="shared" /> shared</label>
          <button type="submit">Create Sample Dataset</button>
        </form>
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Name</th><th>Scope</th><th>Description</th></tr></thead>
          <tbody>{''.join(f'<tr><td>{s.id}</td><td>{html.escape(s.name)}</td><td>{"shared" if s.is_shared else "private"}</td><td>{html.escape(s.description)}</td></tr>' for s in tab_data['sample_datasets']) or '<tr><td colspan="4">No sample datasets yet.</td></tr>'}</tbody>
        </table></div>
        """
    if tab == "files":
        return f"""
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Original Name</th><th>Path</th><th>MIME</th><th>Download</th></tr></thead>
          <tbody>{''.join(f'<tr><td>{a.id}</td><td>{html.escape(a.original_name)}</td><td>{html.escape(a.file_path)}</td><td>{html.escape(a.mime_type or "-")}</td><td><a href="/download-attachment?project_id={tab_data.get("project_id", 0)}&attachment_id={a.id}">Download</a></td></tr>' for a in tab_data['attachments']) or '<tr><td colspan="5">No attachments yet.</td></tr>'}</tbody>
        </table></div>
        """
    if tab == "workspaces":
        return f"""
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Status</th></tr></thead>
          <tbody>{''.join(f'<tr><td>{w.id}</td><td>{html.escape(w.workspace_name)}</td><td>{html.escape(w.workspace_type)}</td><td>{"active" if w.is_active else "inactive"}</td></tr>' for w in tab_data['workspaces']) or '<tr><td colspan="4">No workspaces yet.</td></tr>'}</tbody>
        </table></div>
        """
    if tab == "overview":
        return f"""
        <div class="grid-2">
          <section class="panel">
            <h3>Stage Assignments</h3>
            <div class="table-wrap"><table>
              <thead><tr><th>ID</th><th>Stage</th><th>Assignee</th><th>Title</th><th>Related Work</th><th>Related Output</th><th>Status</th></tr></thead>
              <tbody>{''.join(
                f'<tr><td>{a.id}</td><td>{html.escape(a.stage_name)}</td><td>{html.escape(a.assignee_name or "-")}</td><td>{html.escape(a.assignee_title or "-")}</td><td>{html.escape(format_related_target(a.related_item_type, a.related_item_id))}</td><td>{html.escape(format_related_output(a.related_item_type, a.related_item_id))}</td><td>{html.escape(a.status)}</td></tr>'
                for a in tab_data.get('stage_assignments', [])
              ) or '<tr><td colspan="7">No stage assignments yet.</td></tr>'}</tbody>
            </table></div>
          </section>
          <section class="panel">
            <h3>Stage History</h3>
            <div class="table-wrap"><table>
              <thead><tr><th>ID</th><th>Stage</th><th>Before</th><th>After</th><th>By</th><th>Note</th></tr></thead>
              <tbody>{''.join(
                f'<tr><td>{h.id}</td><td>{html.escape(h.stage_name)}</td><td>{html.escape(h.before_status)}</td><td>{html.escape(h.after_status)}</td><td>{html.escape(h.changed_by)}</td><td>{html.escape(h.change_note)}</td></tr>'
                for h in tab_data.get('stage_history', [])
              ) or '<tr><td colspan="6">No stage history yet.</td></tr>'}</tbody>
            </table></div>
          </section>
        </div>
        """
    if tab == "tests":
        endpoint_map = {endpoint.id: endpoint for endpoint in tab_data.get("api_endpoints", [])}
        return f"""
        <form method="post" action="/create-api-auth-profile" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="name" placeholder="Auth profile name" />
          <input name="auth_type" placeholder="auth type" />
          <textarea name="config_json" rows="3" placeholder='{{"token":"..."}}'></textarea>
          <label><input type="checkbox" name="default" /> default</label>
          <button type="submit">Create Auth Profile</button>
        </form>
        <form method="post" action="/create-api-test-case" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="api_endpoint_id" placeholder="Endpoint ID" />
          <input name="auth_profile_id" placeholder="Auth profile ID" />
          <input name="sample_dataset_id" placeholder="Sample dataset ID" />
          <input name="expected_status_code" placeholder="expected status" value="200" />
          <textarea name="request_json" rows="3" placeholder='{{}}'></textarea>
          <textarea name="expected_response_json" rows="3" placeholder='{{}}'></textarea>
          <button type="submit">Create API Test Case</button>
        </form>
        <div class="grid-2">
          <section class="panel">
            <h3>Cases</h3>
            <div class="table-wrap"><table>
              <thead><tr><th>ID</th><th>Endpoint</th><th>Auth Profile</th><th>Expected</th><th>Sample</th></tr></thead>
              <tbody>{''.join(
                f'<tr><td>{t.id}</td><td>{html.escape(f"{endpoint_map[t.api_endpoint_id].method} {endpoint_map[t.api_endpoint_id].path} - {endpoint_map[t.api_endpoint_id].summary}") if t.api_endpoint_id in endpoint_map else str(t.api_endpoint_id)}</td><td>{t.auth_profile_id or "-"}</td><td>{t.expected_status_code}</td><td>{t.sample_dataset_id or "-"}</td></tr>'
                for t in tab_data['api_test_cases']
              ) or '<tr><td colspan="5">No API test cases yet.</td></tr>'}</tbody></table></div>
          </section>
          <section class="panel">
            <h3>Latest Results</h3>
            <div class="table-wrap"><table>
              <thead><tr><th>ID</th><th>Status</th><th>Result</th><th>Message</th><th>Executed</th></tr></thead>
              <tbody>{''.join(
                f'<tr><td>{r.id}</td><td>{r.status_code}</td><td>{html.escape(r.result_status)}</td><td>{html.escape(r.message)}</td><td>{html.escape(r.executed_at)}</td></tr>'
                for r in tab_data['api_test_results']
              ) or '<tr><td colspan="5">No API test results yet.</td></tr>'}</tbody></table></div>
          </section>
        </div>
        """
    if tab == "stdword":
        return f"""
        <form method="post" action="/create-standard-word" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="word" placeholder="word" />
          <input name="recommended_spelling" placeholder="recommended spelling" />
          <input name="note" placeholder="note" />
          <button type="submit">Create Standard Word</button>
        </form>
        <form method="post" action="/create-standard-word-check" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="vo_name" placeholder="VO name" />
          <input name="field_name" placeholder="field name" />
          <input name="extracted_words" placeholder="extracted words" />
          <input name="unmatched_words" placeholder="unmatched words" />
          <input name="match_status" placeholder="match status" />
          <button type="submit">Create Standard Word Check</button>
        </form>
        <div class="grid-2">
          <section class="panel">
            <h3>Dictionary</h3>
            <div class="table-wrap"><table><tbody>{''.join(f'<tr><td>{d.id}</td><td>{html.escape(d.word)}</td><td>{html.escape(d.recommended_spelling)}</td><td>{html.escape(d.note)}</td></tr>' for d in tab_data['standard_words']) or '<tr><td colspan="4">No standard words yet.</td></tr>'}</tbody></table></div>
          </section>
          <section class="panel">
            <h3>Check Results</h3>
            <div class="table-wrap"><table><tbody>{''.join(f'<tr><td>{c.id}</td><td>{html.escape(c.vo_name)}</td><td>{html.escape(c.unmatched_words)}</td><td>{html.escape(c.match_status)}</td></tr>' for c in tab_data['standard_word_checks']) or '<tr><td colspan="4">No check results yet.</td></tr>'}</tbody></table></div>
          </section>
        </div>
        """
    if tab == "security":
        return f"""
        <form method="post" action="/scan-security" class="stack">
          <input type="hidden" name="project_id" value="{tab_data.get('project_id', 0)}" />
          <input name="source_scan_id" placeholder="Source scan ID" />
          <input name="file_path" placeholder="file path" />
          <input name="category" placeholder="category" value="input-validation" />
          <input name="title" placeholder="issue title" />
          <input name="risk_level" placeholder="risk level" value="medium" />
          <button type="submit">Run Security Scan</button>
        </form>
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Risk</th><th>File</th><th>Evidence</th></tr></thead>
          <tbody>{''.join(f'<tr><td>{i.id}</td><td>{html.escape(i.title)}</td><td>{html.escape(i.category)}</td><td>{html.escape(i.risk_level)}</td><td>{html.escape(i.file_path)}</td><td>{html.escape(i.evidence)}</td></tr>' for i in tab_data['security_issues']) or '<tr><td colspan="6">No security issues yet.</td></tr>'}</tbody>
        </table></div>
        """
    if tab == "logs":
        return f"""
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Actor</th><th>Action</th><th>Target</th><th>Target ID</th><th>IP</th></tr></thead>
          <tbody>{''.join(f'<tr><td>{l.id}</td><td>{html.escape(l.actor)}</td><td>{html.escape(l.action)}</td><td>{html.escape(l.target_type)}</td><td>{l.target_id or "-"}</td><td>{html.escape(l.ip_address)}</td></tr>' for l in tab_data['access_logs']) or '<tr><td colspan="6">No access logs yet.</td></tr>'}</tbody>
        </table></div>
        """
    return "<p>Use the tabs above to inspect project artifacts.</p>"


def build_final_artifact_markdown(overview, dashboard, tab_data: dict) -> str:
    tab = tab_data["tab"]
    artifact_path = f"data/artifacts/aastudio-{overview.project_id}-{tab}.md"
    generated_at = datetime.now().isoformat(timespec="seconds")
    lines = [
        f"# AAStudio Final Artifact - {overview.project_name}",
        "",
        f"- Project ID: {overview.project_id}",
        f"- Stage: {overview.current_stage}",
        f"- Share: {'readonly' if tab_data.get('project_share') and tab_data['project_share'].is_readonly else 'internal'}",
        f"- Tab: {tab}",
        f"- Generated at: {generated_at}",
        f"- Saved path: {artifact_path}",
        "",
    ]
    if tab == "overview":
        lines.extend(
            [
                "## Overview",
                f"- Source scans: {overview.source_scans}",
                f"- Source code findings: {overview.source_code_findings}",
                f"- Security scans: {overview.security_scans}",
                f"- Security issues: {overview.security_issues}",
                f"- Wiki pages: {overview.wiki_pages}",
                f"- WBS items: {overview.wbs_items}",
                f"- DB models: {overview.db_models}",
                f"- DB relations: {overview.db_relations}",
                f"- API groups: {overview.api_groups}",
                f"- API endpoints: {overview.api_endpoints}",
                f"- API test cases: {overview.api_test_cases}",
                f"- API test results: {overview.api_test_results}",
                f"- Attachments: {overview.attachments}",
                f"- Workspaces: {overview.workspaces}",
            ]
        )
        if tab_data.get("stage_assignments"):
            lines.extend(["", "## Stage Assignments"])
            for assignment in tab_data["stage_assignments"]:
                lines.extend(
                    [
                        f"- {assignment.stage_name}: {assignment.assignee_name or '-'}"
                        f" ({assignment.assignee_title or '-'}, {assignment.status})",
                        f"  - Related work: {format_related_target(assignment.related_item_type, assignment.related_item_id)}",
                        f"  - Related output: {format_related_output(assignment.related_item_type, assignment.related_item_id)}",
                        f"  - Phone: {assignment.assignee_phone or '-'}",
                        f"  - Email: {assignment.assignee_email or '-'}",
                    ]
                )
        if tab_data.get("stage_history"):
            lines.extend(["", "## Stage History"])
            for history in tab_data["stage_history"]:
                lines.append(
                    f"- {history.stage_name}: {history.before_status} -> {history.after_status} by {history.changed_by or '-'}"
                )
    elif tab == "wiki":
        lines.append("## Wiki Pages")
        for page in tab_data.get("wiki_pages", []):
            lines.append(f"- {page.title} (`{page.slug}`)")
        lines.append("")
        lines.append("## Versions")
        for version in tab_data.get("wiki_versions", []):
            lines.append(f"- v{version.version_no}: {version.change_note}")
    elif tab == "wbs":
        lines.append("## WBS Items")
        for item in tab_data.get("wbs_items", []):
            lines.append(f"- {item.title} [{item.status}]")
    elif tab == "db":
        lines.append("## DB Models")
        for model in tab_data.get("db_models", []):
            lines.append(f"- {model.name}")
        lines.append("")
        lines.append("## Relations")
        for relation in tab_data.get("db_relations", []):
            lines.append(f"- {relation.from_table_id}:{relation.from_column} -> {relation.to_table_id}:{relation.to_column} ({relation.relation_type})")
    elif tab == "api":
        lines.append("## API Groups")
        for group in tab_data.get("api_groups", []):
            lines.append(f"- {group.name}")
        lines.append("")
        lines.append("## Endpoints")
        for endpoint in tab_data.get("api_endpoints", []):
            lines.append(f"- {endpoint.method.upper()} {endpoint.path} - {endpoint.summary}")
    elif tab == "sample":
        lines.append("## Sample Datasets")
        for dataset in tab_data.get("sample_datasets", []):
            lines.append(f"- {dataset.name} ({'shared' if dataset.is_shared else 'private'})")
    elif tab == "tests":
        lines.append("## API Test Cases")
        for case in tab_data.get("api_test_cases", []):
            lines.append(f"- Case #{case.id} -> endpoint {case.api_endpoint_id}, expected {case.expected_status_code}")
        lines.append("")
        lines.append("## Latest Results")
        for result in tab_data.get("api_test_results", []):
            lines.append(f"- Result #{result.id} -> {result.status_code}, {result.result_status}: {result.message}")
    elif tab == "files":
        lines.append("## Attachments")
        for attachment in tab_data.get("attachments", []):
            lines.append(f"- {attachment.original_name} -> {attachment.file_path}")
    elif tab == "workspaces":
        lines.append("## Workspaces")
        for workspace in tab_data.get("workspaces", []):
            lines.append(f"- {workspace.workspace_name} ({workspace.workspace_type})")
    elif tab == "logs":
        lines.append("## Access Logs")
        for log in tab_data.get("access_logs", []):
            lines.append(f"- {log.actor} {log.action} {log.target_type}")
    elif tab == "stdword":
        lines.append("## Standard Words")
        for word in tab_data.get("standard_words", []):
            lines.append(f"- {word.word} -> {word.recommended_spelling or word.word}")
        lines.append("")
        lines.append("## Check Results")
        for check in tab_data.get("standard_word_checks", []):
            lines.append(f"- {check.vo_name}: {check.match_status} ({check.unmatched_words})")
    elif tab == "security":
        lines.append("## Security Issues")
        for issue in tab_data.get("security_issues", []):
            lines.append(f"- {issue.title} [{issue.risk_level}] {issue.file_path}")
    else:
        lines.append("No detailed export is defined for this tab yet.")
    lines.extend(["", "## Dashboard Summary", f"- {dashboard.summary or '-'}"])
    return "\n".join(lines)


def save_final_artifact_markdown(overview, dashboard, tab_data: dict, base_dir: Path | None = None) -> Path:
    root_dir = base_dir or Path("data") / "artifacts"
    root_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = root_dir / f"aastudio-{overview.project_id}-{tab_data['tab']}.md"
    artifact_path.write_text(build_final_artifact_markdown(overview, dashboard, tab_data), encoding="utf-8")
    return artifact_path


class DashboardHandler(BaseHTTPRequestHandler):
    repository: ProjectRepository | None = None

    def do_GET(self) -> None:  # noqa: N802
        assert self.repository is not None
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        project_id = self._resolve_project_id(query)
        if parsed.path == "/artifact":
            tab = query.get("tab", ["overview"])[0]
            overview = self.repository.get_overview_summary(project_id)
            dashboard = self.repository.get_dashboard_summary(project_id)
            tab_data = self._load_tab_data(project_id, tab)
            artifact_path = save_final_artifact_markdown(overview, dashboard, tab_data)
            body = artifact_path.read_text(encoding="utf-8").encode("utf-8")
            filename = artifact_path.name
            self.send_response(200)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if parsed.path == "/download-attachment":
            attachment_id = int(query.get("attachment_id", ["0"])[0])
            attachment = WikiRepository(self.repository.db_path).get_attachment(project_id, attachment_id)
            if attachment is None:
                self.send_error(404)
                return
            file_path = Path(attachment.file_path)
            if not file_path.exists() or not file_path.is_file():
                self.send_error(404)
                return
            body = file_path.read_bytes()
            content_type = attachment.mime_type or mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Disposition", f'attachment; filename="{attachment.original_name}"')
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if parsed.path != "/":
            self.send_error(404)
            return
        tab = query.get("tab", ["overview"])[0]
        search_query = query.get("q", [""])[0].strip()
        overview = self.repository.get_overview_summary(project_id)
        dashboard = self.repository.get_dashboard_summary(project_id)
        projects = self.repository.search_projects(search_query) if search_query else self.repository.list_projects()
        tab_data = self._load_tab_data(project_id, tab)
        tab_data["query"] = search_query
        tab_data["recent_projects"] = self.repository.get_recent_projects(8)
        body = build_dashboard_html(overview, dashboard, projects, tab_data).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:  # noqa: N802
        assert self.repository is not None
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        data = parse_qs(self.rfile.read(length).decode("utf-8"))
        if parsed.path == "/create-wiki":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            wiki_repo = WikiRepository(self.repository.db_path)
            title = data.get("title", [""])[0].strip()
            slug = data.get("slug", [""])[0].strip()
            content = data.get("content", [""])[0]
            tags = data.get("tags", [""])[0]
            if not title or not slug:
                self.send_error(400, "Wiki title and slug are required")
                return
            wiki_repo.create_page(project_id, title, slug, content, tags=tags, created_by="web")
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=wiki")
            self.end_headers()
            return
        if parsed.path == "/create-wbs":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            wbs_repo = WbsRepository(self.repository.db_path)
            item_id = wbs_repo.create_item(
                project_id,
                data.get("title", [""])[0].strip(),
                data.get("description", [""])[0],
                None,
                data.get("status", ["pending"])[0],
                data.get("priority", ["normal"])[0],
                "",
                None,
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=wbs")
            self.end_headers()
            return
        if parsed.path == "/create-db-model":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            db_repo = DbModelRepository(self.repository.db_path)
            db_repo.create_model(project_id, data.get("name", [""])[0].strip(), data.get("description", [""])[0])
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=db")
            self.end_headers()
            return
        if parsed.path == "/create-db-table":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            model_id = int(data.get("db_model_id", ["0"])[0] or 0)
            table_repo = DbTableRepository(self.repository.db_path)
            table_repo.create_table(
                model_id,
                data.get("name", [""])[0].strip(),
                data.get("description", [""])[0],
                data.get("primary_key", [""])[0],
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=db")
            self.end_headers()
            return
        if parsed.path == "/create-db-column":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            table_id = int(data.get("db_table_id", ["0"])[0] or 0)
            column_repo = DbColumnRepository(self.repository.db_path)
            column_repo.create_column(
                table_id,
                data.get("name", [""])[0].strip(),
                data.get("data_type", [""])[0].strip(),
                "nullable" in data,
                data.get("default_value", [""])[0],
                False,
                False,
                "",
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=db")
            self.end_headers()
            return
        if parsed.path == "/create-db-relation":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            model_id = int(data.get("db_model_id", ["0"])[0] or 0)
            relation_repo = DbRelationRepository(self.repository.db_path)
            relation_repo.create_relation(
                model_id,
                int(data.get("from_table_id", ["0"])[0] or 0),
                int(data.get("to_table_id", ["0"])[0] or 0),
                data.get("relation_type", [""])[0].strip(),
                data.get("from_column", [""])[0],
                data.get("to_column", [""])[0],
                "",
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=db")
            self.end_headers()
            return
        if parsed.path == "/create-diagram":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            DiagramRepository(self.repository.db_path).create_diagram(
                project_id,
                data.get("name", [""])[0].strip(),
                data.get("payload_json", ["{}"])[0],
                data.get("diagram_type", ["erd"])[0],
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=diagram")
            self.end_headers()
            return
        if parsed.path == "/create-api-group":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            ApiGroupRepository(self.repository.db_path).create_group(project_id, data.get("name", [""])[0].strip(), data.get("description", [""])[0])
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=api")
            self.end_headers()
            return
        if parsed.path == "/create-api-endpoint":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            ApiEndpointRepository(self.repository.db_path).create_endpoint(
                int(data.get("api_group_id", ["0"])[0] or 0),
                data.get("method", ["GET"])[0],
                data.get("path", [""])[0],
                data.get("summary", [""])[0],
                False,
                None,
                None,
                int(data.get("status_code", ["200"])[0] or 200),
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=api")
            self.end_headers()
            return
        if parsed.path == "/scan-source":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            scan_path = Path(data.get("scan_path", [""])[0].strip())
            if not scan_path.exists():
                self.send_error(400, "Scan path does not exist")
                return
            SourceScanRepository(self.repository.db_path).create_scan(project_id, str(scan_path), "unknown", "unknown", 0)
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=overview")
            self.end_headers()
            return
        if parsed.path == "/create-sample-dataset":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            SampleDatasetRepository(self.repository.db_path).create_dataset(
                project_id,
                data.get("name", [""])[0].strip(),
                data.get("description", [""])[0],
                "shared" in data,
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=sample")
            self.end_headers()
            return
        if parsed.path == "/create-api-auth-profile":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            ApiAuthProfileRepository(self.repository.db_path).create_profile(
                project_id,
                data.get("name", [""])[0].strip(),
                data.get("auth_type", [""])[0],
                data.get("config_json", ["{}"])[0],
                "default" in data,
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=tests")
            self.end_headers()
            return
        if parsed.path == "/create-api-test-case":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            ApiTestRepository(self.repository.db_path).create_case(
                project_id,
                int(data.get("api_endpoint_id", ["0"])[0] or 0),
                data.get("request_json", ["{}"])[0],
                int(data.get("expected_status_code", ["200"])[0] or 200),
                data.get("expected_response_json", ["{}"])[0],
                int(data.get("auth_profile_id", ["0"])[0] or 0) or None,
                int(data.get("sample_dataset_id", ["0"])[0] or 0) or None,
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=tests")
            self.end_headers()
            return
        if parsed.path == "/create-standard-word":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            StandardWordRepository(self.repository.db_path).create_dictionary_entry(
                project_id,
                data.get("word", [""])[0].strip(),
                data.get("recommended_spelling", [""])[0],
                data.get("note", [""])[0],
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=stdword")
            self.end_headers()
            return
        if parsed.path == "/create-standard-word-check":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            StandardWordRepository(self.repository.db_path).create_check_result(
                project_id,
                data.get("vo_name", [""])[0].strip(),
                data.get("field_name", [""])[0],
                data.get("extracted_words", [""])[0],
                data.get("unmatched_words", [""])[0],
                data.get("match_status", ["pending"])[0],
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=stdword")
            self.end_headers()
            return
        if parsed.path == "/scan-security":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            source_scan_id = int(data.get("source_scan_id", ["0"])[0] or 0)
            security_scan_id = SecurityScanRepository(self.repository.db_path).create_scan(project_id, source_scan_id)
            SecurityIssueRepository(self.repository.db_path).create_issue(
                security_scan_id,
                data.get("category", ["input-validation"])[0],
                data.get("title", [""])[0],
                "",
                data.get("file_path", [""])[0],
                None,
                None,
                data.get("risk_level", ["medium"])[0],
                "",
                "",
            )
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}&tab=security")
            self.end_headers()
            return
        if parsed.path == "/refresh":
            project_id = self._resolve_project_id(data)
            if self.repository.get_project_share(project_id).is_readonly:
                self.send_error(403, "Readonly projects cannot be updated")
                return
            stage = data.get("stage", [""])[0] or None
            summary = data.get("summary", [""])[0] or None
            self.repository.update_dashboard(project_id, stage, summary)
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}")
            self.end_headers()
            return
        if parsed.path == "/projects":
            name = data.get("name", [""])[0].strip()
            root_path = data.get("root_path", [""])[0].strip()
            description = data.get("description", [""])[0].strip()
            if not name or not root_path:
                self.send_error(400, "Project name and root path are required")
                return
            project_id = self.repository.create_project(name, root_path, description)
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}")
            self.end_headers()
            return
        if parsed.path == "/share":
            project_id = self._resolve_project_id(data)
            readonly = "readonly" in data
            scope = data.get("scope", ["external"])[0]
            note = data.get("note", [""])[0]
            self.repository.set_project_share(project_id, readonly, scope, note)
            self.send_response(303)
            self.send_header("Location", f"/?project_id={project_id}")
            self.end_headers()
            return
        self.send_error(404)

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return

    @staticmethod
    def _resolve_project_id(values: dict[str, list[str]]) -> int:
        raw = values.get("project_id", ["1"])[0]
        return int(raw)

    def _load_tab_data(self, project_id: int, tab: str) -> dict:
        assert self.repository is not None
        repository = self.repository
        tab = tab if tab in {"overview", "wiki", "wbs", "db", "diagram", "api", "sample", "stdword", "security", "tests", "logs", "files", "workspaces"} else "overview"
        test_repo = ApiTestRepository(repository.db_path)
        wiki_repo = WikiRepository(repository.db_path)
        stdword_repo = StandardWordRepository(repository.db_path)
        security_issue_repo = SecurityIssueRepository(repository.db_path)
        stage_repo = repository
        wiki_pages = wiki_repo.list_pages(project_id)
        return {
            "project_id": project_id,
            "tab": tab,
            "project_share": repository.get_project_share(project_id),
            "recent_projects": repository.get_recent_projects(8),
            "wiki_pages": wiki_pages,
            "wiki_versions": wiki_repo.list_versions(wiki_pages[0].id) if wiki_pages else [],
            "wbs_items": WbsRepository(repository.db_path).list_items(project_id),
            "db_models": DbModelRepository(repository.db_path).list_models(project_id),
            "db_relations": DbRelationRepository(repository.db_path).list_relations(project_id),
            "diagrams": DiagramRepository(repository.db_path).list_diagrams(project_id),
            "api_groups": ApiGroupRepository(repository.db_path).list_groups(project_id),
            "api_endpoints": [
                endpoint
                for group in ApiGroupRepository(repository.db_path).list_groups(project_id)
                for endpoint in ApiEndpointRepository(repository.db_path).list_endpoints(group.id)
            ],
            "sample_datasets": SampleDatasetRepository(repository.db_path).list_datasets(project_id),
            "standard_words": stdword_repo.list_dictionary_entries(project_id),
            "standard_word_checks": stdword_repo.list_check_results(project_id),
            "security_issues": security_issue_repo.list_issues_for_project(project_id),
            "api_test_cases": test_repo.list_cases(project_id),
            "api_test_results": test_repo.list_results(test_repo.list_cases(project_id)[0].id) if test_repo.list_cases(project_id) else [],
            "access_logs": AccessLogRepository(repository.db_path).list_logs(project_id),
            "attachments": WikiRepository(repository.db_path).list_attachments(project_id),
            "workspaces": ProjectWorkspaceRepository(repository.db_path).list_workspaces(project_id),
            "stage_assignments": stage_repo.list_stage_assignments(project_id),
            "stage_history": stage_repo.list_stage_history(project_id),
        }


def serve_dashboard(db_path, host: str, port: int) -> None:
    from .repository import ProjectRepository

    repository = ProjectRepository(db_path)
    DashboardHandler.repository = repository
    server = ThreadingHTTPServer((host, port), DashboardHandler)
    print(f"Serving AAStudio dashboard on http://{host}:{port}/?project_id=1")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
