"""
MiroFish Strategy Simulator — Web Dashboard
Wraps around MiroFish backend API and provides analytics + God's Eye View.
"""

import os
import re
import json
import shutil
import requests
from datetime import datetime
from flask import Flask, render_template, jsonify, request, send_file
from werkzeug.utils import secure_filename

app = Flask(__name__)

# MiroFish backend URL
MIROFISH_API = os.environ.get("MIROFISH_API", "http://localhost:5001/api")
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
SEEDS_DIR = os.path.join(os.path.dirname(__file__), "seeds")
SCENARIOS_DIR = os.path.join(os.path.dirname(__file__), "scenarios")
ENGLISH_INSTRUCTION = (
    "IMPORTANT: ALL output — reports, analysis, agent profiles, social media posts, "
    "interviews, and communications — MUST be written entirely in English. "
    "Do NOT use Chinese, Spanish, or any other language. English only."
)


def mf_get(path, params=None):
    """Proxy GET to MiroFish backend."""
    try:
        r = requests.get(f"{MIROFISH_API}{path}", params=params, timeout=30)
        return r.json()
    except Exception as e:
        return {"success": False, "error": str(e)}


def mf_post(path, data=None):
    """Proxy POST to MiroFish backend."""
    try:
        r = requests.post(f"{MIROFISH_API}{path}", json=data or {}, timeout=120)
        return r.json()
    except Exception as e:
        return {"success": False, "error": str(e)}


def mf_post_multipart(path, fields=None, files=None):
    """Proxy multipart POST to MiroFish backend."""
    try:
        r = requests.post(f"{MIROFISH_API}{path}", data=fields or {}, files=files or {}, timeout=120)
        return r.json()
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============== Pages ==============

@app.route("/")
def index():
    """Dashboard home — project list and simulation launcher."""
    return render_template("index.html")


@app.route("/simulation/<project_id>")
def simulation_view(project_id):
    """Main simulation dashboard with all charts."""
    return render_template("simulation.html", project_id=project_id)


@app.route("/gods-eye/<project_id>")
def gods_eye_view(project_id):
    """God's Eye View — cross-scenario analysis and influence network."""
    return render_template("gods_eye.html", project_id=project_id)


@app.route("/report/<project_id>")
def report_view(project_id):
    """Report viewer."""
    return render_template("report.html", project_id=project_id)


@app.route("/editor/<filename>")
def editor_view(filename):
    """Seed document editor."""
    return render_template("editor.html", filename=filename)


@app.route("/agents/<project_id>")
def agents_view(project_id):
    """Agent management page."""
    return render_template("agents.html", project_id=project_id)


@app.route("/compare/<project_id>")
def compare_view(project_id):
    """Scenario comparison page."""
    return render_template("compare.html", project_id=project_id)


# ============== Seed File Management ==============

@app.route("/api/seeds", methods=["GET"])
def api_list_seeds():
    """List all available seed files."""
    seeds = []
    for fname in sorted(os.listdir(SEEDS_DIR)):
        if fname.endswith((".md", ".txt")):
            fpath = os.path.join(SEEDS_DIR, fname)
            size = os.path.getsize(fpath)
            seeds.append({"filename": fname, "size": size,
                          "modified": os.path.getmtime(fpath)})
    return jsonify({"success": True, "data": seeds})


@app.route("/api/seed/<filename>", methods=["GET"])
def api_get_seed(filename):
    """Get content of a specific seed file."""
    fpath = os.path.join(SEEDS_DIR, secure_filename(filename))
    if not os.path.exists(fpath):
        return jsonify({"success": False, "error": "File not found"}), 404
    with open(fpath, "r") as f:
        return jsonify({"success": True, "filename": filename, "content": f.read()})


@app.route("/api/seed/<filename>", methods=["PUT"])
def api_update_seed(filename):
    """Update a seed file's content."""
    fpath = os.path.join(SEEDS_DIR, secure_filename(filename))
    if not os.path.exists(fpath):
        return jsonify({"success": False, "error": "File not found"}), 404
    data = request.get_json() or {}
    content = data.get("content", "")
    if not content:
        return jsonify({"success": False, "error": "No content provided"}), 400
    with open(fpath, "w") as f:
        f.write(content)
    return jsonify({"success": True, "message": f"Saved {filename}"})


@app.route("/api/seed/upload", methods=["POST"])
def api_upload_seed():
    """Upload a new seed document."""
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file provided"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"success": False, "error": "No filename"}), 400
    fname = secure_filename(f.filename)
    if not fname.endswith((".md", ".txt")):
        fname += ".md"
    fpath = os.path.join(SEEDS_DIR, fname)
    f.save(fpath)
    return jsonify({"success": True, "filename": fname, "size": os.path.getsize(fpath)})


@app.route("/api/seed/save-as", methods=["POST"])
def api_save_seed_as():
    """Save content as a new seed file."""
    data = request.get_json() or {}
    fname = secure_filename(data.get("filename", "new_seed.md"))
    content = data.get("content", "")
    if not fname.endswith((".md", ".txt")):
        fname += ".md"
    fpath = os.path.join(SEEDS_DIR, fname)
    with open(fpath, "w") as f:
        f.write(content)
    return jsonify({"success": True, "filename": fname})


# ============== Agent Parsing ==============

def _parse_agents_from_seed(content):
    """Extract structured agent data from seed markdown."""
    agents = []
    # Match sections like ### AGENT: NAME or ### 3.1 — NAME or ### EXTERNAL AGENT:
    # The seed format uses ### N.N — NAME pattern and **Field:** Value
    sections = re.split(r'\n(?=### )', content)
    for section in sections:
        lines = section.strip().split('\n')
        if not lines:
            continue
        header = lines[0].strip()
        # Skip non-agent sections
        if not any(kw in header.lower() for kw in ['agent', '—', 'person', 'nib', 'utc', 'idb',
                    'ansa', 'goddard', 'grace', 'ttse', 'acado', 'guyana', 'colomb', 'media',
                    'mcletchie', 'zuniga', 'riley', 'mongroo', 'bailey', 'kerry', 'farrell',
                    'edwards', 'hylton']):
            continue
        agent = {"_header": header, "_raw": section, "fields": {}}
        # Extract name from header
        name_match = re.search(r'—\s*(.+?)(?:\s*\(|$)', header)
        if name_match:
            agent["name"] = name_match.group(1).strip()
        else:
            agent["name"] = re.sub(r'^###\s*', '', header).strip()
        # Extract **Field:** Value pairs
        for line in lines[1:]:
            field_match = re.match(r'\s*\*\*(.+?):\*\*\s*(.*)', line)
            if field_match:
                key = field_match.group(1).strip()
                val = field_match.group(2).strip()
                agent["fields"][key] = val
        if agent["fields"] or 'agent' in header.lower() or '—' in header:
            agents.append(agent)
    return agents


@app.route("/api/seed/agents/<filename>", methods=["GET"])
def api_get_seed_agents(filename):
    """Parse and return structured agent data from a seed file."""
    fpath = os.path.join(SEEDS_DIR, secure_filename(filename))
    if not os.path.exists(fpath):
        return jsonify({"success": False, "error": "File not found"}), 404
    with open(fpath, "r") as f:
        content = f.read()
    agents = _parse_agents_from_seed(content)
    return jsonify({"success": True, "data": agents, "count": len(agents)})


@app.route("/api/seed/agents/<filename>/add", methods=["POST"])
def api_add_agent(filename):
    """Add a new agent section to the seed file."""
    fpath = os.path.join(SEEDS_DIR, secure_filename(filename))
    if not os.path.exists(fpath):
        return jsonify({"success": False, "error": "File not found"}), 404
    data = request.get_json() or {}
    name = data.get("name", "New Agent")
    fields = data.get("fields", {})
    # Build markdown section
    section = f"\n\n### AGENT: {name}\n\n"
    for key, val in fields.items():
        section += f"**{key}:** {val}\n\n"
    with open(fpath, "a") as f:
        f.write(section)
    return jsonify({"success": True, "message": f"Added agent: {name}"})


@app.route("/api/seed/agents/<filename>/delete", methods=["POST"])
def api_delete_agent(filename):
    """Remove an agent section from the seed file."""
    fpath = os.path.join(SEEDS_DIR, secure_filename(filename))
    if not os.path.exists(fpath):
        return jsonify({"success": False, "error": "File not found"}), 404
    data = request.get_json() or {}
    agent_name = data.get("name", "")
    if not agent_name:
        return jsonify({"success": False, "error": "Agent name required"}), 400
    with open(fpath, "r") as f:
        content = f.read()
    # Remove the agent's section
    pattern = re.compile(
        r'\n### [^#]*?' + re.escape(agent_name) + r'.*?(?=\n### |\n## |\Z)',
        re.DOTALL
    )
    new_content = pattern.sub('', content)
    if new_content == content:
        return jsonify({"success": False, "error": f"Agent '{agent_name}' not found"}), 404
    with open(fpath, "w") as f:
        f.write(new_content)
    return jsonify({"success": True, "message": f"Deleted agent: {agent_name}"})


# ============== Scenario Management ==============

def _get_scenarios_file(seed_filename=None):
    """Get path to scenarios JSON file."""
    if seed_filename:
        name = os.path.splitext(secure_filename(seed_filename))[0]
        fpath = os.path.join(SCENARIOS_DIR, f"{name}.json")
        if os.path.exists(fpath):
            return fpath
    return os.path.join(SCENARIOS_DIR, "default.json")


@app.route("/api/scenarios", methods=["GET"])
def api_list_scenarios():
    """List all scenarios."""
    seed = request.args.get("seed", "")
    fpath = _get_scenarios_file(seed)
    if not os.path.exists(fpath):
        return jsonify({"success": True, "data": []})
    with open(fpath) as f:
        scenarios = json.load(f)
    return jsonify({"success": True, "data": scenarios})


@app.route("/api/scenarios", methods=["POST"])
def api_save_scenarios():
    """Save/replace all scenarios."""
    data = request.get_json() or {}
    seed = data.get("seed", "")
    scenarios = data.get("scenarios", [])
    if seed:
        name = os.path.splitext(secure_filename(seed))[0]
        fpath = os.path.join(SCENARIOS_DIR, f"{name}.json")
    else:
        fpath = os.path.join(SCENARIOS_DIR, "default.json")
    with open(fpath, "w") as f:
        json.dump(scenarios, f, indent=2)
    return jsonify({"success": True, "message": "Scenarios saved"})


@app.route("/api/scenarios/add", methods=["POST"])
def api_add_scenario():
    """Add a new scenario."""
    data = request.get_json() or {}
    seed = data.get("seed", "")
    scenario = {
        "id": data.get("id", f"custom_{int(datetime.now().timestamp())}"),
        "name": data.get("name", "New Scenario"),
        "description": data.get("description", ""),
        "requirement": data.get("requirement", ""),
    }
    fpath = _get_scenarios_file(seed)
    scenarios = []
    if os.path.exists(fpath):
        with open(fpath) as f:
            scenarios = json.load(f)
    scenarios.append(scenario)
    with open(fpath, "w") as f:
        json.dump(scenarios, f, indent=2)
    return jsonify({"success": True, "data": scenario})


@app.route("/api/scenarios/delete", methods=["POST"])
def api_delete_scenario():
    """Delete a scenario by id."""
    data = request.get_json() or {}
    scenario_id = data.get("id", "")
    seed = data.get("seed", "")
    fpath = _get_scenarios_file(seed)
    if not os.path.exists(fpath):
        return jsonify({"success": False, "error": "No scenarios file"}), 404
    with open(fpath) as f:
        scenarios = json.load(f)
    scenarios = [s for s in scenarios if s.get("id") != scenario_id]
    with open(fpath, "w") as f:
        json.dump(scenarios, f, indent=2)
    return jsonify({"success": True, "message": f"Deleted scenario {scenario_id}"})


# ============== Scenario Comparison ==============

@app.route("/api/analytics/compare")
def api_compare_analytics():
    """Compare analytics across multiple simulations."""
    sim_ids = request.args.get("simulation_ids", "").split(",")
    sim_ids = [s.strip() for s in sim_ids if s.strip()]
    if len(sim_ids) < 2:
        return jsonify({"success": False, "error": "Need at least 2 simulation_ids"}), 400
    results = {}
    for sid in sim_ids:
        actions_resp = mf_get(f"/simulation/{sid}/actions", {"limit": 10000})
        stats_resp = mf_get(f"/simulation/{sid}/agent-stats")
        status_resp = mf_get(f"/simulation/{sid}")
        if not actions_resp.get("success"):
            results[sid] = {"error": actions_resp.get("error", "Failed to fetch")}
            continue
        all_actions = actions_resp.get("data", {}).get("actions", [])
        agent_stats = stats_resp.get("data", {}).get("agents", {}) if stats_resp.get("data") else {}
        status_data = status_resp.get("data", {})
        results[sid] = _compute_analytics(all_actions, agent_stats, status_data)
        # Add label
        results[sid]["label"] = status_data.get("simulation_requirement", sid)[:80]
    return jsonify({"success": True, "data": results})


# ============== API Proxy ==============

@app.route("/api/projects", methods=["GET"])
def api_list_projects():
    """List all MiroFish projects."""
    return jsonify(mf_get("/graph/project/list"))


@app.route("/api/project/delete/<project_id>", methods=["POST"])
def api_delete_project(project_id):
    """Delete a project and its associated simulations."""
    # Delete project via MiroFish backend
    try:
        r = requests.delete(f"{MIROFISH_API}/graph/project/{project_id}", timeout=30)
        result = r.json()
    except Exception:
        result = {"success": False}

    # Also clean up any simulation directories linked to this project
    sim_base = os.environ.get("MIROFISH_SIM_DIR", "/root/mirofish/backend/uploads/simulations")
    if os.path.isdir(sim_base):
        for sim_name in os.listdir(sim_base):
            state_file = os.path.join(sim_base, sim_name, "state.json")
            if os.path.isfile(state_file):
                try:
                    with open(state_file) as f:
                        state = json.load(f)
                    if state.get("project_id") == project_id:
                        shutil.rmtree(os.path.join(sim_base, sim_name))
                except Exception:
                    pass

    return jsonify({"success": True, "message": f"Deleted project {project_id}"})


@app.route("/api/project/create", methods=["POST"])
def api_create_project():
    """Create project via ontology/generate — uploads selected seed file as multipart."""
    data = request.get_json() or {}
    name = data.get("name", "Strategy Simulation")
    description = data.get("description", "Strategy simulation")
    seed_filename = data.get("seed_file", "seed_massy_holdings.md")
    scenario_req = data.get("scenario_requirement", "")

    seed_path = os.path.join(SEEDS_DIR, secure_filename(seed_filename))
    if not os.path.exists(seed_path):
        return jsonify({"success": False, "error": f"Seed file not found: {seed_filename}"}), 400

    # Build requirement with English instruction and scenario context
    full_requirement = f"{ENGLISH_INSTRUCTION}\n\n{description}"
    if scenario_req:
        full_requirement += f"\n\nScenario: {scenario_req}"

    with open(seed_path, "rb") as f:
        result = mf_post_multipart(
            "/graph/ontology/generate",
            fields={
                "simulation_requirement": full_requirement,
                "project_name": name,
                "additional_context": f"{ENGLISH_INSTRUCTION}\n\nAll agent profiles, social media posts, analysis, and reports must be in English.",
            },
            files={"files": (seed_filename, f, "text/markdown")},
        )
    return jsonify(result)


@app.route("/api/graph/build", methods=["POST"])
def api_build_graph():
    """Trigger graph building from seed document."""
    data = request.get_json() or {}
    project_id = data.get("project_id")
    if not project_id:
        return jsonify({"success": False, "error": "project_id required"}), 400
    return jsonify(mf_post("/graph/build", {"project_id": project_id}))


@app.route("/api/graph/status/<project_id>")
def api_graph_status(project_id):
    """Check project status (includes graph_id, simulations, etc.)."""
    result = mf_get(f"/graph/project/{project_id}")
    # Also fetch simulation list for this project
    sims = mf_get("/simulation/list", {"project_id": project_id})
    if result.get("success") and sims.get("success"):
        if "data" not in result:
            result["data"] = {}
        result["data"]["simulations"] = sims.get("data", [])
    return jsonify(result)


@app.route("/api/graph/task/<task_id>")
def api_graph_task(task_id):
    """Check graph build task status."""
    return jsonify(mf_get(f"/graph/task/{task_id}"))


@app.route("/api/graph/data/<graph_id>")
def api_graph_data(graph_id):
    """Get graph entities and edges for D3 visualization."""
    return jsonify(mf_get(f"/simulation/entities/{graph_id}"))


@app.route("/api/simulation/create", methods=["POST"])
def api_create_simulation():
    """Create a new simulation."""
    data = request.get_json() or {}
    return jsonify(mf_post("/simulation/create", data))


@app.route("/api/simulation/prepare", methods=["POST"])
def api_prepare_simulation():
    """Prepare simulation (generate profiles, config). Async — returns task_id."""
    data = request.get_json() or {}
    return jsonify(mf_post("/simulation/prepare", data))


@app.route("/api/simulation/prepare/status", methods=["POST"])
def api_prepare_status():
    """Check preparation status."""
    data = request.get_json() or {}
    return jsonify(mf_post("/simulation/prepare/status", data))


@app.route("/api/simulation/start", methods=["POST"])
def api_start_simulation():
    """Start the simulation."""
    data = request.get_json() or {}
    return jsonify(mf_post("/simulation/start", data))


@app.route("/api/simulation/stop", methods=["POST"])
def api_stop_simulation():
    """Stop the simulation."""
    data = request.get_json() or {}
    return jsonify(mf_post("/simulation/stop", data))


@app.route("/api/simulation/delete/<simulation_id>", methods=["POST"])
def api_delete_simulation(simulation_id):
    """Delete a simulation and its data directory."""
    sim_dir = os.path.join(
        os.environ.get("MIROFISH_SIM_DIR", "/root/mirofish/backend/uploads/simulations"),
        simulation_id
    )
    if os.path.isdir(sim_dir):
        shutil.rmtree(sim_dir)
        return jsonify({"success": True, "message": f"Deleted simulation {simulation_id}"})
    return jsonify({"success": False, "error": f"Simulation not found: {simulation_id}"}), 404


@app.route("/api/simulation/status/<simulation_id>")
def api_simulation_status(simulation_id):
    """Get simulation state."""
    return jsonify(mf_get(f"/simulation/{simulation_id}"))


@app.route("/api/simulation/run-status/<simulation_id>")
def api_simulation_run_status(simulation_id):
    """Get real-time run status (current round, progress, action counts)."""
    return jsonify(mf_get(f"/simulation/{simulation_id}/run-status"))


@app.route("/api/simulation/actions/<simulation_id>")
def api_simulation_actions(simulation_id):
    """Get all agent actions."""
    params = {}
    limit = request.args.get("limit", "10000")
    params["limit"] = limit
    platform = request.args.get("platform")
    if platform and platform != "all":
        params["platform"] = platform
    round_num = request.args.get("round_num")
    if round_num:
        params["round_num"] = round_num
    return jsonify(mf_get(f"/simulation/{simulation_id}/actions", params))


@app.route("/api/simulation/timeline/<simulation_id>")
def api_simulation_timeline(simulation_id):
    """Get simulation timeline (per-round summary)."""
    return jsonify(mf_get(f"/simulation/{simulation_id}/timeline"))


@app.route("/api/simulation/agent-stats/<simulation_id>")
def api_agent_stats(simulation_id):
    """Get per-agent statistics."""
    return jsonify(mf_get(f"/simulation/{simulation_id}/agent-stats"))


@app.route("/api/simulation/posts/<simulation_id>")
def api_simulation_posts(simulation_id):
    """Get all posts from a simulation."""
    params = {k: v for k, v in request.args.items()}
    return jsonify(mf_get(f"/simulation/{simulation_id}/posts", params))


@app.route("/api/simulation/comments/<simulation_id>")
def api_simulation_comments(simulation_id):
    """Get all comments from a simulation."""
    params = {k: v for k, v in request.args.items()}
    return jsonify(mf_get(f"/simulation/{simulation_id}/comments", params))


@app.route("/api/simulation/profiles/<simulation_id>")
def api_simulation_profiles(simulation_id):
    """Get agent profiles for a simulation."""
    resp = mf_get(f"/simulation/{simulation_id}/profiles")
    # Strip CJK text from profiles — replace with English placeholder
    profiles = resp.get("data", {}).get("profiles", [])
    for p in profiles:
        for key in ("bio", "country", "background"):
            val = p.get(key, "")
            if val and _has_cjk(str(val)):
                p[key] = ""  # clear CJK fields
        # Clean interested_topics
        topics = p.get("interested_topics", [])
        if isinstance(topics, list):
            p["interested_topics"] = [t for t in topics if not _has_cjk(str(t))]
        elif isinstance(topics, str) and _has_cjk(topics):
            p["interested_topics"] = []
    return jsonify(resp)


@app.route("/api/simulation/list")
def api_simulation_list():
    """List all simulations, optionally filtered by project_id."""
    params = {}
    project_id = request.args.get("project_id")
    if project_id:
        params["project_id"] = project_id
    return jsonify(mf_get("/simulation/list", params))


@app.route("/api/simulation/interview", methods=["POST"])
def api_interview_agent():
    """Interview a specific agent — force English response."""
    data = request.get_json() or {}
    if "question" in data:
        data["question"] = (
            "Respond in English only. Based on your persona and all past actions: "
            + data["question"]
        )
    return jsonify(mf_post("/simulation/interview", data))


@app.route("/api/simulation/interview/batch", methods=["POST"])
def api_batch_interview():
    """Batch interview multiple agents."""
    data = request.get_json() or {}
    return jsonify(mf_post("/simulation/interview/batch", data))


@app.route("/api/simulation/interview/all", methods=["POST"])
def api_interview_all():
    """Interview all agents."""
    data = request.get_json() or {}
    return jsonify(mf_post("/simulation/interview/all", data))


# ============== Report API ==============

@app.route("/api/report/generate", methods=["POST"])
def api_generate_report():
    """Trigger report generation with English language requirement."""
    data = request.get_json() or {}
    # Inject English language requirement
    if "additional_instructions" not in data:
        data["additional_instructions"] = ENGLISH_INSTRUCTION
    else:
        data["additional_instructions"] = ENGLISH_INSTRUCTION + "\n" + data["additional_instructions"]
    return jsonify(mf_post("/report/generate", data))


@app.route("/api/report/status/<report_id>")
def api_report_status(report_id):
    """Check report generation progress."""
    return jsonify(mf_get(f"/report/{report_id}/progress"))


@app.route("/api/report/content/<report_id>")
def api_report_content(report_id):
    """Get report content."""
    result = mf_get(f"/report/{report_id}")
    # Normalize: MiroFish uses 'markdown_content', frontend expects 'content'
    if result.get("success") and result.get("data"):
        data = result["data"]
        if "markdown_content" in data and not data.get("content"):
            data["content"] = data["markdown_content"]
        if not data.get("title"):
            data["title"] = "Strategic Analysis Report"
    return jsonify(result)


@app.route("/api/report/by-simulation/<simulation_id>")
def api_report_by_simulation(simulation_id):
    """Get report for a simulation."""
    return jsonify(mf_get(f"/report/by-simulation/{simulation_id}"))


@app.route("/api/report/list")
def api_report_list():
    """List reports, optionally filtered by project_id."""
    project_id = request.args.get("project_id")
    simulation_id = request.args.get("simulation_id")
    params = []
    if project_id:
        params.append(f"project_id={project_id}")
    if simulation_id:
        params.append(f"simulation_id={simulation_id}")
    qs = f"?{'&'.join(params)}" if params else ""
    return jsonify(mf_get(f"/report/list{qs}"))


# ============== Analytics API ==============

@app.route("/api/analytics/<simulation_id>")
def api_analytics(simulation_id):
    """
    Comprehensive analytics computed from simulation actions.
    Returns data for all charts: heatmap, network, timeline, sentiment, etc.
    """
    # Fetch raw actions from MiroFish (correct routes: /{sim_id}/actions etc.)
    actions_resp = mf_get(f"/simulation/{simulation_id}/actions", {"limit": 10000})
    stats_resp = mf_get(f"/simulation/{simulation_id}/agent-stats")
    status_resp = mf_get(f"/simulation/{simulation_id}")

    if not actions_resp.get("success"):
        return jsonify(actions_resp)

    actions_data = actions_resp.get("data", {})
    stats_data = stats_resp.get("data", {})
    status_data = status_resp.get("data", {})

    all_actions = actions_data.get("actions", [])
    agent_stats = stats_data.get("agents", {}) if stats_data else {}

    # Derive analytics
    analytics = _compute_analytics(all_actions, agent_stats, status_data)
    return jsonify({"success": True, "data": analytics})


def _has_cjk(text):
    """Check if text contains CJK (Chinese/Japanese/Korean) characters."""
    return any('\u4e00' <= ch <= '\u9fff' for ch in (text or ''))


def _compute_analytics(actions, agent_stats, status_data):
    """Compute all analytics from raw action data."""
    # Filter out actions with Chinese content from content-related analytics
    # (keep structural actions like REFRESH, DO_NOTHING which have no content)

    # Build post_id -> (agent_id, agent_name) mapping for network edges
    post_authors = {}
    for a in actions:
        atype = a.get("action_type", "")
        args = a.get("action_args", {})
        if atype == "CREATE_POST" and "post_id" in args:
            post_authors[str(args["post_id"])] = (
                str(a.get("agent_id", "?")),
                a.get("agent_name", str(a.get("agent_id", "?")))
            )
        # QUOTE_POST and REPOST also create new posts
        if atype in ("QUOTE_POST", "REPOST") and "new_post_id" in args:
            post_authors[str(args["new_post_id"])] = (
                str(a.get("agent_id", "?")),
                a.get("agent_name", str(a.get("agent_id", "?")))
            )

    # Group actions by round
    rounds = {}
    agents = {}
    comm_edges = {}
    action_types = {}
    platform_actions = {"twitter": 0, "reddit": 0}

    for a in actions:
        rnum = a.get("round_num", 0)
        aid = str(a.get("agent_id", "?"))
        aname = a.get("agent_name", aid)
        atype = a.get("action_type", "UNKNOWN")
        platform = a.get("platform", "unknown")

        # Round grouping
        if rnum not in rounds:
            rounds[rnum] = {"actions": [], "agents": set(), "types": {}}
        rounds[rnum]["actions"].append(a)
        rounds[rnum]["agents"].add(aid)
        rounds[rnum]["types"][atype] = rounds[rnum]["types"].get(atype, 0) + 1

        # Agent tracking
        if aid not in agents:
            agents[aid] = {
                "name": aname, "actions": [], "rounds_active": set(),
                "action_types": {}, "platforms": {"twitter": 0, "reddit": 0},
                "content_lengths": [], "targets": {},
            }
        agents[aid]["actions"].append(a)
        agents[aid]["rounds_active"].add(rnum)
        agents[aid]["action_types"][atype] = agents[aid]["action_types"].get(atype, 0) + 1
        if platform in platform_actions:
            platform_actions[platform] += 1
            agents[aid]["platforms"][platform] = agents[aid]["platforms"].get(platform, 0) + 1

        # Content length for heatmap intensity
        args = a.get("action_args", {})
        content = args.get("content", args.get("text", ""))
        if content:
            agents[aid]["content_lengths"].append(len(str(content)))

        # Communication edges (replies, mentions, quotes, reposts)
        if atype in ("REPOST", "QUOTE_POST", "LIKE_POST", "DISLIKE_POST", "CREATE_COMMENT"):
            # Map post_id to the original author
            ref_post_id = str(args.get("quoted_id", args.get("reposted_id", args.get("post_id", ""))))
            target_aid, target_name = post_authors.get(ref_post_id, (None, None))
            if not target_aid:
                target_aid = str(args.get("agent_id", ""))
                target_name = target_aid
            if target_aid and target_aid != aid:
                edge_key = f"{aname}->{target_name}"
                comm_edges[edge_key] = comm_edges.get(edge_key, 0) + 1
                agents[aid]["targets"][target_aid] = agents[aid]["targets"].get(target_aid, 0) + 1

        # Action type totals
        action_types[atype] = action_types.get(atype, 0) + 1

    # -- Build response --
    total_rounds = max(rounds.keys()) + 1 if rounds else 0

    # 1. Activity heatmap: agent x round -> intensity
    heatmap = {}
    for aid, info in agents.items():
        heatmap[aid] = {
            "name": info["name"],
            "rounds": {}
        }
        for rnum in info["rounds_active"]:
            round_actions = [a for a in info["actions"] if a.get("round_num") == rnum]
            intensity = len(round_actions)
            avg_len = 0
            if info["content_lengths"]:
                round_contents = [len(str(a.get("action_args", {}).get("content", "")))
                                  for a in round_actions if a.get("action_args", {}).get("content")]
                avg_len = sum(round_contents) / max(len(round_contents), 1)
            heatmap[aid]["rounds"][str(rnum)] = {
                "action_count": intensity,
                "avg_content_length": round(avg_len),
                "intensity": min(intensity * 2 + avg_len / 100, 10),
            }

    # 2. Actions per round timeline
    actions_per_round = []
    for rnum in sorted(rounds.keys()):
        rd = rounds[rnum]
        actions_per_round.append({
            "round": rnum,
            "total_actions": len(rd["actions"]),
            "unique_agents": len(rd["agents"]),
            "action_types": rd["types"],
        })

    # 3. Communication / influence network
    network_nodes = set()
    network_edges = []
    for edge_key, weight in comm_edges.items():
        parts = edge_key.split("->")
        if len(parts) == 2:
            fr, to = parts
            network_nodes.add(fr)
            network_nodes.add(to)
            network_edges.append({"source": fr, "target": to, "weight": weight})

    # Calculate degree centrality
    degree = {}
    for edge in network_edges:
        degree[edge["source"]] = degree.get(edge["source"], 0) + edge["weight"]
        degree[edge["target"]] = degree.get(edge["target"], 0) + edge["weight"]

    network = {
        "nodes": [{"id": n, "label": agents.get(n, {}).get("name", n),
                    "degree": degree.get(n, 0)} for n in network_nodes],
        "edges": network_edges,
    }

    # 4. Agent summary table
    agent_summary = []
    for aid, info in agents.items():
        total_actions = len(info["actions"])
        agent_summary.append({
            "id": aid,
            "name": info["name"],
            "total_actions": total_actions,
            "rounds_active": len(info["rounds_active"]),
            "action_types": info["action_types"],
            "platforms": info["platforms"],
            "avg_content_length": round(sum(info["content_lengths"]) / max(len(info["content_lengths"]), 1)),
            "top_targets": sorted(info["targets"].items(), key=lambda x: -x[1])[:5],
        })
    agent_summary.sort(key=lambda x: -x["total_actions"])

    # 5. Action type distribution
    type_distribution = [{"type": t, "count": c} for t, c in
                         sorted(action_types.items(), key=lambda x: -x[1])]

    # 6. Platform comparison
    platform_comparison = platform_actions

    # 7. Sentiment analysis (simple keyword-based on English post content only)
    sentiment_timeline = []
    for rnum in sorted(rounds.keys()):
        pos, neg, neutral = 0, 0, 0
        for a in rounds[rnum]["actions"]:
            content = str(a.get("action_args", {}).get("content", "")).lower()
            if not content or _has_cjk(content):
                continue  # skip empty and non-English posts
            pos_words = ["growth", "opportunity", "success", "strong", "improve",
                         "positive", "confident", "optimistic", "expand", "achieve",
                         "profit", "gain", "innovation", "progress", "agreement"]
            neg_words = ["risk", "concern", "threat", "decline", "challenge",
                         "pressure", "weak", "fail", "crisis", "loss",
                         "debt", "delay", "conflict", "corruption", "scandal"]
            p = sum(1 for w in pos_words if w in content)
            n = sum(1 for w in neg_words if w in content)
            if p > n:
                pos += 1
            elif n > p:
                neg += 1
            else:
                neutral += 1
        total = pos + neg + neutral
        sentiment_timeline.append({
            "round": rnum,
            "positive": pos,
            "negative": neg,
            "neutral": neutral,
            "score": round((pos - neg) / max(total, 1), 3),
        })

    # 8. Agent activity over time (for line chart)
    agent_activity_lines = {}
    for aid, info in agents.items():
        line = []
        for rnum in range(total_rounds):
            count = len([a for a in info["actions"] if a.get("round_num") == rnum])
            line.append(count)
        agent_activity_lines[info["name"]] = line

    return {
        "total_rounds": total_rounds,
        "total_actions": len(actions),
        "total_agents": len(agents),
        "heatmap": heatmap,
        "actions_per_round": actions_per_round,
        "network": network,
        "agent_summary": agent_summary,
        "type_distribution": type_distribution,
        "platform_comparison": platform_comparison,
        "sentiment_timeline": sentiment_timeline,
        "agent_activity_lines": agent_activity_lines,
        "status": status_data,
    }


@app.route("/api/analytics/gods-eye/<simulation_id>")
def api_gods_eye(simulation_id):
    """
    God's Eye View analytics — deeper cross-cutting analysis.
    """
    # Get base analytics (correct routes)
    actions_resp = mf_get(f"/simulation/{simulation_id}/actions", {"limit": 10000})
    stats_resp = mf_get(f"/simulation/{simulation_id}/agent-stats")

    if not actions_resp.get("success"):
        return jsonify(actions_resp)

    all_actions = actions_resp.get("data", {}).get("actions", [])
    agent_stats = stats_resp.get("data", {}).get("agents", {}) if stats_resp.get("data") else {}

    gods_eye = _compute_gods_eye(all_actions, agent_stats)
    return jsonify({"success": True, "data": gods_eye})


def _compute_gods_eye(actions, agent_stats):
    """Compute God's Eye View analytics."""
    # Group by platform for cross-platform analysis
    twitter_actions = [a for a in actions if a.get("platform") == "twitter"]
    reddit_actions = [a for a in actions if a.get("platform") == "reddit"]

    # 1. Cross-platform divergence: same agents, different behavior
    agent_platform_behavior = {}
    for a in actions:
        aid = str(a.get("agent_id", "?"))
        aname = a.get("agent_name", aid)
        platform = a.get("platform", "unknown")
        atype = a.get("action_type", "UNKNOWN")

        if aid not in agent_platform_behavior:
            agent_platform_behavior[aid] = {
                "name": aname,
                "twitter": {"total": 0, "types": {}, "content_lengths": []},
                "reddit": {"total": 0, "types": {}, "content_lengths": []},
            }
        if platform in ("twitter", "reddit"):
            pb = agent_platform_behavior[aid][platform]
            pb["total"] += 1
            pb["types"][atype] = pb["types"].get(atype, 0) + 1
            content = str(a.get("action_args", {}).get("content", ""))
            if content:
                pb["content_lengths"].append(len(content))

    cross_platform_divergence = []
    for aid, info in agent_platform_behavior.items():
        tw = info["twitter"]
        rd = info["reddit"]
        if tw["total"] > 0 and rd["total"] > 0:
            tw_avg = sum(tw["content_lengths"]) / max(len(tw["content_lengths"]), 1)
            rd_avg = sum(rd["content_lengths"]) / max(len(rd["content_lengths"]), 1)
            cross_platform_divergence.append({
                "agent_id": aid,
                "name": info["name"],
                "twitter_actions": tw["total"],
                "reddit_actions": rd["total"],
                "twitter_types": tw["types"],
                "reddit_types": rd["types"],
                "twitter_avg_content_len": round(tw_avg),
                "reddit_avg_content_len": round(rd_avg),
                "platform_ratio": round(tw["total"] / max(rd["total"], 1), 2),
            })
    cross_platform_divergence.sort(key=lambda x: abs(x["platform_ratio"] - 1), reverse=True)

    # 2. Influence network with PageRank-like scoring
    influence_graph = {}
    for a in actions:
        aid = str(a.get("agent_id", "?"))
        aname = a.get("agent_name", aid)
        atype = a.get("action_type", "")
        args = a.get("action_args", {})

        if aid not in influence_graph:
            influence_graph[aid] = {"name": aname, "influenced_by": {}, "influences": {},
                                    "posts_created": 0, "reactions_received": 0}
        if atype == "CREATE_POST":
            influence_graph[aid]["posts_created"] += 1
        elif atype in ("LIKE_POST", "REPOST", "CREATE_COMMENT", "DISLIKE_POST"):
            target = str(args.get("agent_id", ""))
            if target and target != aid and target in influence_graph:
                influence_graph[aid]["influenced_by"][target] = \
                    influence_graph[aid]["influenced_by"].get(target, 0) + 1
                influence_graph[target]["influences"][aid] = \
                    influence_graph[target]["influences"].get(aid, 0) + 1
                influence_graph[target]["reactions_received"] += 1

    # Compute influence score
    influence_scores = []
    for aid, info in influence_graph.items():
        score = (info["posts_created"] * 2 +
                 info["reactions_received"] * 3 +
                 len(info["influences"]) * 5)
        influence_scores.append({
            "agent_id": aid,
            "name": info["name"],
            "influence_score": score,
            "posts_created": info["posts_created"],
            "reactions_received": info["reactions_received"],
            "agents_influenced": len(info["influences"]),
            "influenced_by_count": len(info["influenced_by"]),
            "top_influenced_by": sorted(info["influenced_by"].items(), key=lambda x: -x[1])[:5],
            "top_influences": sorted(info["influences"].items(), key=lambda x: -x[1])[:5],
        })
    influence_scores.sort(key=lambda x: -x["influence_score"])

    # 3. Coalition detection — agents that interact frequently with each other
    coalitions = _detect_coalitions(actions)

    # 4. Information cascade detection — track how content spreads
    cascades = _detect_cascades(actions)

    # 5. Temporal activity patterns — when are agents most active
    temporal_patterns = {}
    for a in actions:
        rnum = a.get("round_num", 0)
        aid = str(a.get("agent_id", "?"))
        if aid not in temporal_patterns:
            temporal_patterns[aid] = {
                "name": a.get("agent_name", aid),
                "activity_by_round": {},
            }
        temporal_patterns[aid]["activity_by_round"][rnum] = \
            temporal_patterns[aid]["activity_by_round"].get(rnum, 0) + 1

    # Find peak activity rounds per agent
    peak_rounds = {}
    for aid, info in temporal_patterns.items():
        if info["activity_by_round"]:
            peak = max(info["activity_by_round"].items(), key=lambda x: x[1])
            peak_rounds[aid] = {"name": info["name"], "peak_round": peak[0], "peak_count": peak[1]}

    # 6. Content theme analysis (keyword frequency by round)
    themes_by_round = _analyze_themes(actions)

    return {
        "cross_platform_divergence": cross_platform_divergence[:20],
        "influence_scores": influence_scores[:20],
        "coalitions": coalitions,
        "cascades": cascades[:20],
        "peak_activity": peak_rounds,
        "themes_by_round": themes_by_round,
        "platform_summary": {
            "twitter_total": len([a for a in actions if a.get("platform") == "twitter"]),
            "reddit_total": len([a for a in actions if a.get("platform") == "reddit"]),
        },
    }


def _detect_coalitions(actions):
    """Detect agent coalitions based on mutual interaction frequency."""
    interactions = {}
    for a in actions:
        aid = str(a.get("agent_id", "?"))
        aname = a.get("agent_name", aid)
        args = a.get("action_args", {})
        target = str(args.get("agent_id", ""))

        if target and target != aid:
            pair = tuple(sorted([aid, target]))
            if pair not in interactions:
                interactions[pair] = {"count": 0, "agents": {}}
            interactions[pair]["count"] += 1
            interactions[pair]["agents"][aid] = aname
            interactions[pair]["agents"][target] = interactions[pair]["agents"].get(target, target)

    # Find strong mutual pairs
    strong_pairs = [(pair, info) for pair, info in interactions.items() if info["count"] >= 3]
    strong_pairs.sort(key=lambda x: -x[1]["count"])

    # Build coalition groups using connected components
    coalition_map = {}
    coalition_id = 0
    for pair, info in strong_pairs[:50]:
        a, b = pair
        ca = coalition_map.get(a)
        cb = coalition_map.get(b)
        if ca is None and cb is None:
            coalition_map[a] = coalition_id
            coalition_map[b] = coalition_id
            coalition_id += 1
        elif ca is not None and cb is None:
            coalition_map[b] = ca
        elif cb is not None and ca is None:
            coalition_map[a] = cb
        elif ca != cb:
            # Merge smaller into larger
            for k, v in coalition_map.items():
                if v == cb:
                    coalition_map[k] = ca

    # Group by coalition
    groups = {}
    agent_names = {}
    for a in actions:
        agent_names[str(a.get("agent_id", "?"))] = a.get("agent_name", "?")

    for aid, cid in coalition_map.items():
        if cid not in groups:
            groups[cid] = []
        groups[cid].append({"id": aid, "name": agent_names.get(aid, aid)})

    return [{"coalition_id": cid, "members": members, "size": len(members)}
            for cid, members in groups.items() if len(members) >= 2]


def _detect_cascades(actions):
    """Detect information cascades — posts that generated chains of reactions."""
    posts = {}
    reactions = []

    for a in actions:
        atype = a.get("action_type", "")
        args = a.get("action_args", {})
        if atype == "CREATE_POST":
            post_id = str(args.get("post_id", a.get("result", "")))
            posts[post_id] = {
                "author": a.get("agent_name", "?"),
                "round": a.get("round_num", 0),
                "content": str(args.get("content", ""))[:200],
                "reactions": [],
            }
        elif atype in ("LIKE_POST", "REPOST", "CREATE_COMMENT", "DISLIKE_POST"):
            post_id = str(args.get("post_id", ""))
            if post_id in posts:
                posts[post_id]["reactions"].append({
                    "agent": a.get("agent_name", "?"),
                    "type": atype,
                    "round": a.get("round_num", 0),
                })

    # Return posts with most reactions (English only)
    cascades = [{"post_id": pid, **info, "reaction_count": len(info["reactions"])}
                for pid, info in posts.items()
                if len(info["reactions"]) >= 2 and not _has_cjk(info.get("content", ""))]
    cascades.sort(key=lambda x: -x["reaction_count"])
    return cascades


def _analyze_themes(actions):
    """Analyze content themes by round using keyword extraction."""
    theme_keywords = {
        "growth": ["growth", "expand", "revenue", "profit", "market share", "acquisition"],
        "risk": ["risk", "threat", "vulnerability", "exposure", "concern", "crisis"],
        "governance": ["board", "governance", "compliance", "audit", "transparency", "accountability"],
        "technology": ["technology", "digital", "AI", "automation", "data", "innovation"],
        "finance": ["finance", "debt", "loan", "capital", "investment", "dividend", "cash flow"],
        "competition": ["competitor", "ANSA", "Goddard", "GraceKennedy", "market position"],
        "guyana": ["Guyana", "oil", "warehouse", "Houston", "ExxonMobil"],
        "jamaica": ["Jamaica", "Acado", "divestiture", "distribution"],
        "colombia": ["Colombia", "peso", "COP", "Petro"],
        "governance_crisis": ["Delphi", "Parisot", "Warner", "scandal", "investigation"],
    }

    rounds = {}
    for a in actions:
        rnum = a.get("round_num", 0)
        content = str(a.get("action_args", {}).get("content", "")).lower()
        if not content or _has_cjk(content):
            continue
        if rnum not in rounds:
            rounds[rnum] = {k: 0 for k in theme_keywords}
        for theme, keywords in theme_keywords.items():
            for kw in keywords:
                if kw.lower() in content:
                    rounds[rnum][theme] += 1

    return [{"round": rnum, "themes": themes} for rnum, themes in sorted(rounds.items())]


@app.route("/api/seed")
def api_seed_content():
    """Return the default seed document content."""
    default = os.path.join(SEEDS_DIR, "seed_massy_holdings.md")
    if os.path.exists(default):
        with open(default, "r") as f:
            return jsonify({"success": True, "content": f.read()})
    # Fallback: return first seed file found
    for fname in os.listdir(SEEDS_DIR):
        if fname.endswith((".md", ".txt")):
            with open(os.path.join(SEEDS_DIR, fname), "r") as f:
                return jsonify({"success": True, "content": f.read(), "filename": fname})
    return jsonify({"success": False, "error": "No seed files found"})


# ============== Zep Memory Graph API ==============

@app.route("/api/memory/graph/<graph_id>")
def api_memory_graph(graph_id):
    """Get Zep memory graph for visualization."""
    return jsonify(mf_get(f"/simulation/entities/{graph_id}", {"enrich": "true"}))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
