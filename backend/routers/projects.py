"""
Projects CRUD router.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import database as db

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    industry: str = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    archived: Optional[bool] = None


@router.get("")
async def list_projects():
    """List all projects with scenario counts."""
    projects = await db.fetchall(
        """
        SELECT p.*,
               (SELECT COUNT(*) FROM scenarios s WHERE s.project_id = p.id) AS scenario_count
        FROM projects p
        WHERE p.archived = 0
        ORDER BY p.updated_at DESC
        """
    )
    return {"success": True, "data": projects}


@router.post("")
async def create_project(body: ProjectCreate):
    """Create a new project."""
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    await db.execute(
        """
        INSERT INTO projects (id, name, description, industry, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (project_id, body.name, body.description, body.industry, now, now),
    )

    project = await db.fetchone("SELECT * FROM projects WHERE id = ?", (project_id,))
    return {"success": True, "data": project}


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get a project with its scenarios."""
    project = await db.fetchone("SELECT * FROM projects WHERE id = ?", (project_id,))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    scenarios = await db.fetchall(
        "SELECT * FROM scenarios WHERE project_id = ? ORDER BY created_at DESC",
        (project_id,),
    )

    result = dict(project)
    result["scenarios"] = scenarios
    return {"success": True, "data": result}


@router.put("/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate):
    """Update a project."""
    project = await db.fetchone("SELECT * FROM projects WHERE id = ?", (project_id,))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updates = []
    params = []
    if body.name is not None:
        updates.append("name = ?")
        params.append(body.name)
    if body.description is not None:
        updates.append("description = ?")
        params.append(body.description)
    if body.industry is not None:
        updates.append("industry = ?")
        params.append(body.industry)
    if body.archived is not None:
        updates.append("archived = ?")
        params.append(1 if body.archived else 0)

    if updates:
        now = datetime.now(timezone.utc).isoformat()
        updates.append("updated_at = ?")
        params.append(now)
        params.append(project_id)

        await db.execute(
            f"UPDATE projects SET {', '.join(updates)} WHERE id = ?",
            tuple(params),
        )

    updated = await db.fetchone("SELECT * FROM projects WHERE id = ?", (project_id,))
    return {"success": True, "data": updated}


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project and cascade to scenarios and runs."""
    project = await db.fetchone("SELECT * FROM projects WHERE id = ?", (project_id,))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete simulation runs for all scenarios in this project
    await db.execute(
        """
        DELETE FROM simulation_runs
        WHERE scenario_id IN (SELECT id FROM scenarios WHERE project_id = ?)
        """,
        (project_id,),
    )

    # Delete scenarios
    await db.execute("DELETE FROM scenarios WHERE project_id = ?", (project_id,))

    # Delete project
    await db.execute("DELETE FROM projects WHERE id = ?", (project_id,))

    return {"success": True, "message": f"Deleted project {project_id}"}
