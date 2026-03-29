"""
Migration 001: Initialize database schema and migrate legacy data.

If existing Flask app had global scenarios, this migrates them into a
default "Legacy Simulations" project.
"""
import sqlite3
import uuid
import json
import os
from datetime import datetime


DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "..", "strategos.db"))
LEGACY_SCENARIOS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "webapp", "scenarios")
LEGACY_SEEDS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "webapp", "seeds")


def run_migration():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create tables
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            industry TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            archived INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS scenarios (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            simulation_type TEXT DEFAULT 'custom',
            sub_template TEXT,
            seed_file TEXT,
            config TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS simulation_runs (
            id TEXT PRIMARY KEY,
            scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'pending',
            nash_used INTEGER DEFAULT 0,
            nash_equilibrium_result TEXT,
            started_at TEXT,
            completed_at TEXT,
            output_summary TEXT,
            round_snapshots TEXT,
            mirofish_project_id TEXT,
            mirofish_simulation_id TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_scenarios_project ON scenarios(project_id);
        CREATE INDEX IF NOT EXISTS idx_runs_scenario ON simulation_runs(scenario_id);
    """)

    # Check for legacy scenarios to migrate
    legacy_scenarios = []
    if os.path.exists(LEGACY_SCENARIOS_DIR):
        for filename in os.listdir(LEGACY_SCENARIOS_DIR):
            if filename.endswith(".json"):
                filepath = os.path.join(LEGACY_SCENARIOS_DIR, filename)
                try:
                    with open(filepath, "r") as f:
                        scenarios = json.load(f)
                    if isinstance(scenarios, list):
                        for s in scenarios:
                            s["_source_file"] = filename
                            legacy_scenarios.append(s)
                except (json.JSONDecodeError, IOError):
                    continue

    if legacy_scenarios:
        # Create legacy project
        legacy_project_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO projects (id, name, description, industry) VALUES (?, ?, ?, ?)",
            (legacy_project_id, "Legacy Simulations",
             "Migrated from original MiroFish webapp", "General")
        )

        # Migrate each scenario
        for scenario in legacy_scenarios:
            scenario_id = str(uuid.uuid4())
            seed_content = None

            # Try to find matching seed file
            source = scenario.get("_source_file", "default.json")
            seed_name = source.replace(".json", "")
            for ext in [".md", ".txt"]:
                seed_path = os.path.join(LEGACY_SEEDS_DIR, seed_name + ext)
                if os.path.exists(seed_path):
                    with open(seed_path, "r") as f:
                        seed_content = f.read()
                    break

            cursor.execute(
                """INSERT INTO scenarios (id, project_id, name, description, simulation_type, seed_file, config)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (scenario_id, legacy_project_id,
                 scenario.get("name", "Unnamed Scenario"),
                 scenario.get("description", ""),
                 "custom",
                 seed_content,
                 json.dumps({"requirement": scenario.get("requirement", "")}))
            )

        print(f"Migrated {len(legacy_scenarios)} legacy scenarios into project '{legacy_project_id}'")

    conn.commit()
    conn.close()
    print("Migration 001 complete.")


if __name__ == "__main__":
    run_migration()
