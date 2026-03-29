"""
Scenarios CRUD router — scoped to a parent project.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import database as db

router = APIRouter(prefix="/api/projects/{project_id}/scenarios", tags=["scenarios"])


class ScenarioCreate(BaseModel):
    name: str
    description: str = ""
    simulation_type: str = "corporate_strategy"
    sub_template: str = ""
    seed_file: Optional[dict] = None
    config: Optional[dict] = None


class ScenarioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    simulation_type: Optional[str] = None
    sub_template: Optional[str] = None
    seed_file: Optional[dict] = None
    config: Optional[dict] = None


async def _ensure_project(project_id: str):
    """Validate that the parent project exists."""
    project = await db.fetchone("SELECT id FROM projects WHERE id = ?", (project_id,))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")


@router.get("")
async def list_scenarios(project_id: str):
    """List all scenarios for a project."""
    await _ensure_project(project_id)

    scenarios = await db.fetchall(
        """
        SELECT s.*,
               (SELECT COUNT(*) FROM simulation_runs r WHERE r.scenario_id = s.id) AS run_count
        FROM scenarios s
        WHERE s.project_id = ?
        ORDER BY s.created_at DESC
        """,
        (project_id,),
    )
    return {"success": True, "data": scenarios}


@router.post("")
async def create_scenario(project_id: str, body: ScenarioCreate):
    """Create a new scenario under a project."""
    await _ensure_project(project_id)

    scenario_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    seed_json = json.dumps(body.seed_file) if body.seed_file else "{}"
    config_json = json.dumps(body.config) if body.config else "{}"

    await db.execute(
        """
        INSERT INTO scenarios
            (id, project_id, name, description, simulation_type, sub_template,
             seed_file, config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            scenario_id, project_id, body.name, body.description,
            body.simulation_type, body.sub_template,
            seed_json, config_json, now, now,
        ),
    )

    # Update project updated_at
    await db.execute(
        "UPDATE projects SET updated_at = ? WHERE id = ?", (now, project_id)
    )

    scenario = await db.fetchone("SELECT * FROM scenarios WHERE id = ?", (scenario_id,))
    return {"success": True, "data": scenario}


@router.get("/{scenario_id}")
async def get_scenario(project_id: str, scenario_id: str):
    """Get a single scenario with its runs."""
    await _ensure_project(project_id)

    scenario = await db.fetchone(
        "SELECT * FROM scenarios WHERE id = ? AND project_id = ?",
        (scenario_id, project_id),
    )
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    runs = await db.fetchall(
        "SELECT * FROM simulation_runs WHERE scenario_id = ? ORDER BY started_at DESC",
        (scenario_id,),
    )

    result = dict(scenario)
    result["runs"] = runs
    return {"success": True, "data": result}


@router.put("/{scenario_id}")
async def update_scenario(project_id: str, scenario_id: str, body: ScenarioUpdate):
    """Update a scenario."""
    await _ensure_project(project_id)

    scenario = await db.fetchone(
        "SELECT * FROM scenarios WHERE id = ? AND project_id = ?",
        (scenario_id, project_id),
    )
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    updates = []
    params = []

    if body.name is not None:
        updates.append("name = ?")
        params.append(body.name)
    if body.description is not None:
        updates.append("description = ?")
        params.append(body.description)
    if body.simulation_type is not None:
        updates.append("simulation_type = ?")
        params.append(body.simulation_type)
    if body.sub_template is not None:
        updates.append("sub_template = ?")
        params.append(body.sub_template)
    if body.seed_file is not None:
        updates.append("seed_file = ?")
        params.append(json.dumps(body.seed_file))
    if body.config is not None:
        updates.append("config = ?")
        params.append(json.dumps(body.config))

    if updates:
        now = datetime.now(timezone.utc).isoformat()
        updates.append("updated_at = ?")
        params.append(now)
        params.append(scenario_id)

        await db.execute(
            f"UPDATE scenarios SET {', '.join(updates)} WHERE id = ?",
            tuple(params),
        )

        # Update project updated_at
        await db.execute(
            "UPDATE projects SET updated_at = ? WHERE id = ?", (now, project_id)
        )

    updated = await db.fetchone("SELECT * FROM scenarios WHERE id = ?", (scenario_id,))
    return {"success": True, "data": updated}


@router.delete("/{scenario_id}")
async def delete_scenario(project_id: str, scenario_id: str):
    """Delete a scenario and its runs."""
    await _ensure_project(project_id)

    scenario = await db.fetchone(
        "SELECT * FROM scenarios WHERE id = ? AND project_id = ?",
        (scenario_id, project_id),
    )
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Delete runs first
    await db.execute(
        "DELETE FROM simulation_runs WHERE scenario_id = ?", (scenario_id,)
    )

    # Delete scenario
    await db.execute("DELETE FROM scenarios WHERE id = ?", (scenario_id,))

    return {"success": True, "message": f"Deleted scenario {scenario_id}"}
