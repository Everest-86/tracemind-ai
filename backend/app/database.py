from __future__ import annotations

import json
import os
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

from .schemas import AnalysisListItem, GenerateRequest, RequirementAnalysis, RequirementOutputBundle

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "data" / "tracemind.db"


def _resolve_db_path() -> Path:
    env_value = os.getenv("TRACEMIND_DB_PATH")
    if not env_value:
        return DEFAULT_DB_PATH

    candidate = Path(env_value).expanduser()
    if not candidate.is_absolute():
        candidate = BASE_DIR / candidate
    return candidate


DB_PATH = _resolve_db_path()


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name TEXT,
                domain_context TEXT,
                requirement_text TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


def _row_to_analysis(row: sqlite3.Row) -> RequirementAnalysis:
    payload = json.loads(row["payload_json"])
    return RequirementAnalysis.model_validate(
        {
            "id": row["id"],
            "created_at": row["created_at"],
            "product_name": row["product_name"],
            "domain_context": row["domain_context"],
            "requirement_text": row["requirement_text"],
            "outputs": payload,
        }
    )


def save_analysis(request: GenerateRequest, outputs: RequirementOutputBundle) -> RequirementAnalysis:
    created_at = datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO analyses (
                product_name,
                domain_context,
                requirement_text,
                payload_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                request.product_name,
                request.domain_context,
                request.requirement_text.strip(),
                json.dumps(outputs.model_dump(mode="json")),
                created_at,
            ),
        )
        analysis_id = cursor.lastrowid
        connection.commit()

    return get_analysis(analysis_id)


def get_analysis(analysis_id: int) -> RequirementAnalysis | None:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, product_name, domain_context, requirement_text, payload_json, created_at
            FROM analyses
            WHERE id = ?
            """,
            (analysis_id,),
        ).fetchone()

    if row is None:
        return None

    return _row_to_analysis(row)


def list_analyses(limit: int = 8) -> list[AnalysisListItem]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, product_name, requirement_text, payload_json, created_at
            FROM analyses
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    items: list[AnalysisListItem] = []
    for row in rows:
        payload = json.loads(row["payload_json"])
        requirement_text = row["requirement_text"].strip()
        excerpt = requirement_text[:114].rstrip()
        if len(requirement_text) > 114:
            excerpt = f"{excerpt}..."

        items.append(
            AnalysisListItem(
                id=row["id"],
                created_at=row["created_at"],
                product_name=row["product_name"],
                requirement_excerpt=excerpt,
                requirement_reference=payload["requirement_reference"],
            )
        )

    return items
