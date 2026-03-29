"""
Strategos Strategy Simulator — Async SQLite database layer using aiosqlite.
"""

import os
import aiosqlite
from typing import Any, Optional

DATABASE_PATH = os.environ.get("DATABASE_URL", "sqlite:///./strategos.db")
# Strip the sqlite:/// prefix to get the file path
if DATABASE_PATH.startswith("sqlite:///"):
    DATABASE_PATH = DATABASE_PATH.replace("sqlite:///", "", 1)

# Resolve relative to backend dir
if not os.path.isabs(DATABASE_PATH):
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), DATABASE_PATH)

_CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    industry TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    archived INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    simulation_type TEXT DEFAULT '',
    sub_template TEXT DEFAULT '',
    seed_file TEXT DEFAULT '{}',
    config TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS simulation_runs (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    nash_used INTEGER DEFAULT 0,
    nash_equilibrium_result TEXT DEFAULT '',
    started_at TEXT,
    completed_at TEXT,
    output_summary TEXT DEFAULT '',
    round_snapshots TEXT DEFAULT '[]',
    mirofish_project_id TEXT DEFAULT '',
    mirofish_simulation_id TEXT DEFAULT '',
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
);
"""


async def get_db() -> aiosqlite.Connection:
    """Get an aiosqlite connection with row_factory enabled."""
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """Create all tables if they don't exist."""
    db = await get_db()
    try:
        await db.executescript(_CREATE_TABLES_SQL)
        await db.commit()
    finally:
        await db.close()


async def execute(sql: str, params: tuple = ()) -> Any:
    """Execute a write query (INSERT, UPDATE, DELETE)."""
    db = await get_db()
    try:
        cursor = await db.execute(sql, params)
        await db.commit()
        return cursor
    finally:
        await db.close()


async def fetchone(sql: str, params: tuple = ()) -> Optional[dict]:
    """Fetch a single row as a dict."""
    db = await get_db()
    try:
        cursor = await db.execute(sql, params)
        row = await cursor.fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        await db.close()


async def fetchall(sql: str, params: tuple = ()) -> list[dict]:
    """Fetch all rows as a list of dicts."""
    db = await get_db()
    try:
        cursor = await db.execute(sql, params)
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()
