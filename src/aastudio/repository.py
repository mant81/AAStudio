from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import sqlite3

from .db import get_connection, initialize_database


@dataclass(slots=True)
class ProjectSummary:
    id: int
    name: str
    description: str
    root_path: str
    current_stage: str | None


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
                SELECT p.id, p.name, p.description, p.root_path, d.current_stage
                FROM project p
                LEFT JOIN project_dashboard d ON d.project_id = p.id
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
                )
                for row in rows
            ]

