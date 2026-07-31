from __future__ import annotations

import argparse
from pathlib import Path

from .db import initialize_database
from .repository import ProjectRepository


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="aastudio", description="AAStudio local workspace scaffold")
    parser.add_argument(
        "--db",
        default="data/aastudio.sqlite3",
        help="Path to the SQLite database file.",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser("init-db", help="Create the SQLite schema.")

    create_parser = subparsers.add_parser("create-project", help="Create a project record.")
    create_parser.add_argument("name")
    create_parser.add_argument("root_path")
    create_parser.add_argument("--description", default="")

    subparsers.add_parser("list-projects", help="List projects.")

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

    if args.command == "create-project":
        project_id = repository.create_project(args.name, args.root_path, args.description)
        print(f"Created project {project_id}: {args.name}")
        return

    if args.command == "list-projects":
        projects = repository.list_projects()
        for project in projects:
            stage = project.current_stage or "planning"
            print(f"{project.id}\t{project.name}\t{stage}\t{project.root_path}")
        return

