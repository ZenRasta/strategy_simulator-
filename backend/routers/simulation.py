"""
Simulation runs router — create runs, stream progress, proxy to MiroFish.
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

import database as db
from services.mirofish_proxy import (
    mf_get, mf_post, mf_post_multipart, mf_delete,
    ENGLISH_INSTRUCTION,
)

router = APIRouter(tags=["simulation"])


class RunCreate(BaseModel):
    name: str = "Simulation Run"
    seed_content: Optional[str] = None
    scenario_requirement: str = ""
    rounds: int = 40
    use_nash: bool = False
    nash_result: Optional[dict] = None


# ========================
# Simulation Run Management
# ========================

@router.post("/api/projects/{project_id}/scenarios/{scenario_id}/runs")
async def create_run(project_id: str, scenario_id: str, body: RunCreate):
    """
    Create a simulation run:
    1. Validate project/scenario exist
    2. Create a run record in our DB
    3. Call MiroFish to create project + simulation
    4. Store MiroFish IDs back into run
    """
    # Validate project exists
    project = await db.fetchone("SELECT * FROM projects WHERE id = ?", (project_id,))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate scenario exists
    scenario = await db.fetchone(
        "SELECT * FROM scenarios WHERE id = ? AND project_id = ?",
        (scenario_id, project_id),
    )
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Create run record
    run_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    nash_result_json = json.dumps(body.nash_result) if body.nash_result else ""

    await db.execute(
        """
        INSERT INTO simulation_runs
            (id, scenario_id, status, nash_used, nash_equilibrium_result, started_at)
        VALUES (?, ?, 'creating', ?, ?, ?)
        """,
        (run_id, scenario_id, 1 if body.use_nash else 0, nash_result_json, now),
    )

    # Build the requirement string
    full_requirement = f"{ENGLISH_INSTRUCTION}\n\n{scenario['description']}"
    if body.scenario_requirement:
        full_requirement += f"\n\nScenario: {body.scenario_requirement}"

    # Get seed content: from body, or from scenario's stored seed_file
    seed_text = body.seed_content
    if not seed_text:
        seed_data = scenario.get("seed_file", "{}")
        if isinstance(seed_data, str):
            try:
                parsed = json.loads(seed_data)
                seed_text = json.dumps(parsed, indent=2) if parsed else ""
            except (json.JSONDecodeError, TypeError):
                seed_text = seed_data

    # Step 1: Create MiroFish project via ontology/generate
    mf_project_result = {"success": False, "error": "No seed content available"}
    if seed_text:
        import tempfile
        import os

        # Write seed to a temp file for multipart upload
        tmp_path = os.path.join(tempfile.gettempdir(), f"seed_{run_id}.md")
        with open(tmp_path, "w") as f:
            f.write(seed_text)

        with open(tmp_path, "rb") as f:
            mf_project_result = await mf_post_multipart(
                "/graph/ontology/generate",
                fields={
                    "simulation_requirement": full_requirement,
                    "project_name": body.name or scenario["name"],
                    "additional_context": (
                        f"{ENGLISH_INSTRUCTION}\n\n"
                        "All agent profiles, social media posts, analysis, and reports must be in English."
                    ),
                },
                files={"files": ("seed.md", f, "text/markdown")},
            )

        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    if not mf_project_result.get("success"):
        await db.execute(
            "UPDATE simulation_runs SET status = 'failed', output_summary = ? WHERE id = ?",
            (json.dumps(mf_project_result), run_id),
        )
        return {
            "success": False,
            "data": {"run_id": run_id},
            "error": mf_project_result.get("error", "Failed to create MiroFish project"),
        }

    mf_project_id = mf_project_result.get("data", {}).get("project_id", "")

    # Step 2: Create MiroFish simulation
    mf_sim_result = await mf_post(
        "/simulation/create",
        {
            "project_id": mf_project_id,
            "simulation_requirement": full_requirement,
            "num_rounds": body.rounds,
        },
    )

    mf_simulation_id = ""
    if mf_sim_result.get("success"):
        mf_simulation_id = mf_sim_result.get("data", {}).get("simulation_id", "")

    # Update run with MiroFish IDs
    await db.execute(
        """
        UPDATE simulation_runs
        SET status = 'created',
            mirofish_project_id = ?,
            mirofish_simulation_id = ?
        WHERE id = ?
        """,
        (mf_project_id, mf_simulation_id, run_id),
    )

    run = await db.fetchone("SELECT * FROM simulation_runs WHERE id = ?", (run_id,))
    return {"success": True, "data": run}


@router.get("/api/projects/{project_id}/scenarios/{scenario_id}/runs/{run_id}")
async def get_run(project_id: str, scenario_id: str, run_id: str):
    """Get a simulation run's status and details."""
    run = await db.fetchone(
        """
        SELECT r.* FROM simulation_runs r
        JOIN scenarios s ON r.scenario_id = s.id
        WHERE r.id = ? AND s.project_id = ? AND r.scenario_id = ?
        """,
        (run_id, project_id, scenario_id),
    )
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # If run has a MiroFish simulation, fetch live status
    mf_sim_id = run.get("mirofish_simulation_id", "")
    if mf_sim_id and run.get("status") not in ("completed", "failed"):
        live_status = await mf_get(f"/simulation/{mf_sim_id}")
        if live_status.get("success"):
            run["mirofish_status"] = live_status.get("data", {})

    return {"success": True, "data": run}


# ========================
# SSE Progress Streaming
# ========================

@router.get("/api/runs/{run_id}/stream")
async def stream_run_progress(run_id: str, request: Request):
    """
    Server-Sent Events endpoint for real-time pipeline progress.
    Polls MiroFish run-status and emits events as the simulation progresses.
    """
    run = await db.fetchone("SELECT * FROM simulation_runs WHERE id = ?", (run_id,))
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    mf_sim_id = run.get("mirofish_simulation_id", "")

    async def event_generator():
        if not mf_sim_id:
            yield {
                "event": "error",
                "data": json.dumps({"message": "No MiroFish simulation linked"}),
            }
            return

        last_round = -1
        stale_count = 0

        while True:
            if await request.is_disconnected():
                break

            # Fetch live status from MiroFish
            status = await mf_get(f"/simulation/{mf_sim_id}/run-status")

            if status.get("success"):
                data = status.get("data", {})
                current_round = data.get("current_round", 0)
                total_rounds = data.get("total_rounds", 0)
                sim_status = data.get("status", "unknown")

                yield {
                    "event": "progress",
                    "data": json.dumps({
                        "run_id": run_id,
                        "current_round": current_round,
                        "total_rounds": total_rounds,
                        "status": sim_status,
                        "action_count": data.get("action_count", 0),
                        "agent_count": data.get("agent_count", 0),
                    }),
                }

                if sim_status in ("completed", "stopped", "error"):
                    # Update our DB
                    final_status = "completed" if sim_status == "completed" else "failed"
                    completed_at = datetime.now(timezone.utc).isoformat()
                    await db.execute(
                        "UPDATE simulation_runs SET status = ?, completed_at = ? WHERE id = ?",
                        (final_status, completed_at, run_id),
                    )
                    yield {
                        "event": "complete",
                        "data": json.dumps({
                            "run_id": run_id,
                            "status": final_status,
                        }),
                    }
                    break

                # Detect stale progress
                if current_round == last_round:
                    stale_count += 1
                else:
                    stale_count = 0
                    last_round = current_round

                if stale_count > 60:  # 5 minutes with no progress
                    yield {
                        "event": "stale",
                        "data": json.dumps({
                            "message": "No progress for 5 minutes",
                            "run_id": run_id,
                        }),
                    }
            else:
                yield {
                    "event": "error",
                    "data": json.dumps({
                        "message": status.get("error", "Failed to fetch status"),
                    }),
                }

            await asyncio.sleep(5)

    return EventSourceResponse(event_generator())


# ========================
# MiroFish Proxy Endpoints
# ========================

@router.get("/api/simulation/{simulation_id}/status")
async def proxy_simulation_status(simulation_id: str):
    """Get simulation state from MiroFish."""
    return await mf_get(f"/simulation/{simulation_id}")


@router.get("/api/simulation/{simulation_id}/run-status")
async def proxy_run_status(simulation_id: str):
    """Get real-time run status from MiroFish."""
    return await mf_get(f"/simulation/{simulation_id}/run-status")


@router.get("/api/simulation/{simulation_id}/actions")
async def proxy_actions(simulation_id: str, limit: int = 10000, platform: Optional[str] = None, round_num: Optional[int] = None):
    """Get simulation actions from MiroFish."""
    params: dict = {"limit": limit}
    if platform and platform != "all":
        params["platform"] = platform
    if round_num is not None:
        params["round_num"] = round_num
    return await mf_get(f"/simulation/{simulation_id}/actions", params)


@router.get("/api/simulation/{simulation_id}/timeline")
async def proxy_timeline(simulation_id: str):
    """Get simulation timeline from MiroFish."""
    return await mf_get(f"/simulation/{simulation_id}/timeline")


@router.get("/api/simulation/{simulation_id}/agent-stats")
async def proxy_agent_stats(simulation_id: str):
    """Get per-agent statistics from MiroFish."""
    return await mf_get(f"/simulation/{simulation_id}/agent-stats")


@router.get("/api/simulation/{simulation_id}/profiles")
async def proxy_profiles(simulation_id: str):
    """Get agent profiles from MiroFish."""
    return await mf_get(f"/simulation/{simulation_id}/profiles")


@router.get("/api/simulation/{simulation_id}/posts")
async def proxy_posts(simulation_id: str, request: Request):
    """Get posts from MiroFish."""
    params = dict(request.query_params)
    return await mf_get(f"/simulation/{simulation_id}/posts", params)


@router.get("/api/simulation/{simulation_id}/comments")
async def proxy_comments(simulation_id: str, request: Request):
    """Get comments from MiroFish."""
    params = dict(request.query_params)
    return await mf_get(f"/simulation/{simulation_id}/comments", params)


# ========================
# Simulation Lifecycle
# ========================

class SimulationAction(BaseModel):
    simulation_id: str
    project_id: Optional[str] = None
    num_rounds: Optional[int] = None
    simulation_requirement: Optional[str] = None


@router.post("/api/simulation/prepare")
async def proxy_prepare(body: SimulationAction):
    """Prepare simulation (generate profiles, config)."""
    return await mf_post("/simulation/prepare", body.model_dump(exclude_none=True))


@router.post("/api/simulation/prepare/status")
async def proxy_prepare_status(body: SimulationAction):
    """Check preparation status."""
    return await mf_post("/simulation/prepare/status", body.model_dump(exclude_none=True))


@router.post("/api/simulation/start")
async def proxy_start(body: SimulationAction):
    """Start the simulation."""
    return await mf_post("/simulation/start", body.model_dump(exclude_none=True))


@router.post("/api/simulation/stop")
async def proxy_stop(body: SimulationAction):
    """Stop the simulation."""
    return await mf_post("/simulation/stop", body.model_dump(exclude_none=True))


@router.get("/api/simulation/list")
async def proxy_simulation_list(project_id: Optional[str] = None):
    """List all simulations."""
    params = {}
    if project_id:
        params["project_id"] = project_id
    return await mf_get("/simulation/list", params)


# ========================
# Interview Proxy
# ========================

class InterviewRequest(BaseModel):
    simulation_id: str
    agent_id: Optional[str] = None
    agent_ids: Optional[list[str]] = None
    question: str = ""


@router.post("/api/simulation/interview")
async def proxy_interview(body: InterviewRequest):
    """Interview a specific agent."""
    data = body.model_dump(exclude_none=True)
    if "question" in data:
        data["question"] = (
            "Respond in English only. Based on your persona and all past actions: "
            + data["question"]
        )
    return await mf_post("/simulation/interview", data)


@router.post("/api/simulation/interview/batch")
async def proxy_batch_interview(body: InterviewRequest):
    """Batch interview multiple agents."""
    return await mf_post("/simulation/interview/batch", body.model_dump(exclude_none=True))


@router.post("/api/simulation/interview/all")
async def proxy_interview_all(body: InterviewRequest):
    """Interview all agents."""
    return await mf_post("/simulation/interview/all", body.model_dump(exclude_none=True))


# ========================
# Report Proxy
# ========================

class ReportGenerate(BaseModel):
    simulation_id: str
    report_type: str = "full"
    additional_instructions: str = ""


@router.post("/api/report/generate")
async def proxy_report_generate(body: ReportGenerate):
    """Generate a report."""
    data = body.model_dump()
    # Inject English language requirement
    if not data.get("additional_instructions"):
        data["additional_instructions"] = ENGLISH_INSTRUCTION
    else:
        data["additional_instructions"] = ENGLISH_INSTRUCTION + "\n" + data["additional_instructions"]
    return await mf_post("/report/generate", data)


@router.get("/api/report/status/{report_id}")
async def proxy_report_status(report_id: str):
    """Check report generation progress."""
    return await mf_get(f"/report/{report_id}/progress")


@router.get("/api/report/content/{report_id}")
async def proxy_report_content(report_id: str):
    """Get report content."""
    result = await mf_get(f"/report/{report_id}")
    # Normalize field names
    if result.get("success") and result.get("data"):
        data = result["data"]
        if "markdown_content" in data and not data.get("content"):
            data["content"] = data["markdown_content"]
        if not data.get("title"):
            data["title"] = "Strategic Analysis Report"
    return result


@router.get("/api/report/by-simulation/{simulation_id}")
async def proxy_report_by_simulation(simulation_id: str):
    """Get report for a simulation."""
    return await mf_get(f"/report/by-simulation/{simulation_id}")


@router.get("/api/report/list")
async def proxy_report_list(project_id: Optional[str] = None, simulation_id: Optional[str] = None):
    """List reports."""
    params = []
    if project_id:
        params.append(f"project_id={project_id}")
    if simulation_id:
        params.append(f"simulation_id={simulation_id}")
    qs = f"?{'&'.join(params)}" if params else ""
    return await mf_get(f"/report/list{qs}")


# ========================
# Graph Proxy
# ========================

@router.get("/api/graph/project/list")
async def proxy_project_list():
    """List MiroFish projects."""
    return await mf_get("/graph/project/list")


@router.get("/api/graph/project/{mf_project_id}")
async def proxy_project_status(mf_project_id: str):
    """Get MiroFish project status."""
    result = await mf_get(f"/graph/project/{mf_project_id}")
    sims = await mf_get("/simulation/list", {"project_id": mf_project_id})
    if result.get("success") and sims.get("success"):
        if "data" not in result:
            result["data"] = {}
        result["data"]["simulations"] = sims.get("data", [])
    return result


@router.post("/api/graph/build")
async def proxy_graph_build(request: Request):
    """Trigger graph building."""
    data = await request.json()
    return await mf_post("/graph/build", data)


@router.get("/api/graph/task/{task_id}")
async def proxy_graph_task(task_id: str):
    """Check graph build task status."""
    return await mf_get(f"/graph/task/{task_id}")


@router.get("/api/graph/data/{graph_id}")
async def proxy_graph_data(graph_id: str):
    """Get graph entities for visualization."""
    return await mf_get(f"/simulation/entities/{graph_id}")
