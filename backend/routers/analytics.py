"""
Analytics router — proxies and computes analytics from MiroFish simulation data.
"""

from typing import Optional

from fastapi import APIRouter, Request

from services.mirofish_proxy import mf_get

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _has_cjk(text: str) -> bool:
    """Check if text contains CJK (Chinese/Japanese/Korean) characters."""
    return any("\u4e00" <= ch <= "\u9fff" for ch in (text or ""))


def _compute_analytics(actions: list, agent_stats: dict, status_data: dict) -> dict:
    """Compute all analytics from raw action data."""
    # Build post_id -> (agent_id, agent_name) mapping for network edges
    post_authors = {}
    for a in actions:
        atype = a.get("action_type", "")
        args = a.get("action_args", {})
        if atype == "CREATE_POST" and "post_id" in args:
            post_authors[str(args["post_id"])] = (
                str(a.get("agent_id", "?")),
                a.get("agent_name", str(a.get("agent_id", "?"))),
            )
        if atype in ("QUOTE_POST", "REPOST") and "new_post_id" in args:
            post_authors[str(args["new_post_id"])] = (
                str(a.get("agent_id", "?")),
                a.get("agent_name", str(a.get("agent_id", "?"))),
            )

    # Group actions by round
    rounds: dict = {}
    agents: dict = {}
    comm_edges: dict = {}
    action_types: dict = {}
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
                "name": aname,
                "actions": [],
                "rounds_active": set(),
                "action_types": {},
                "platforms": {"twitter": 0, "reddit": 0},
                "content_lengths": [],
                "targets": {},
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

        # Communication edges
        if atype in ("REPOST", "QUOTE_POST", "LIKE_POST", "DISLIKE_POST", "CREATE_COMMENT"):
            ref_post_id = str(
                args.get("quoted_id", args.get("reposted_id", args.get("post_id", "")))
            )
            target_aid, target_name = post_authors.get(ref_post_id, (None, None))
            if not target_aid:
                target_aid = str(args.get("agent_id", ""))
                target_name = target_aid
            if target_aid and target_aid != aid:
                edge_key = f"{aname}->{target_name}"
                comm_edges[edge_key] = comm_edges.get(edge_key, 0) + 1
                agents[aid]["targets"][target_aid] = agents[aid]["targets"].get(target_aid, 0) + 1

        action_types[atype] = action_types.get(atype, 0) + 1

    total_rounds = max(rounds.keys()) + 1 if rounds else 0

    # 1. Activity heatmap
    heatmap = {}
    for aid, info in agents.items():
        heatmap[aid] = {"name": info["name"], "rounds": {}}
        for rnum in info["rounds_active"]:
            round_actions = [a for a in info["actions"] if a.get("round_num") == rnum]
            intensity = len(round_actions)
            round_contents = [
                len(str(a.get("action_args", {}).get("content", "")))
                for a in round_actions
                if a.get("action_args", {}).get("content")
            ]
            avg_len = sum(round_contents) / max(len(round_contents), 1) if round_contents else 0
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

    degree: dict = {}
    for edge in network_edges:
        degree[edge["source"]] = degree.get(edge["source"], 0) + edge["weight"]
        degree[edge["target"]] = degree.get(edge["target"], 0) + edge["weight"]

    network = {
        "nodes": [
            {
                "id": n,
                "label": agents.get(n, {}).get("name", n),
                "degree": degree.get(n, 0),
            }
            for n in network_nodes
        ],
        "edges": network_edges,
    }

    # 4. Agent summary table
    agent_summary = []
    for aid, info in agents.items():
        total_actions_count = len(info["actions"])
        agent_summary.append({
            "id": aid,
            "name": info["name"],
            "total_actions": total_actions_count,
            "rounds_active": len(info["rounds_active"]),
            "action_types": info["action_types"],
            "platforms": info["platforms"],
            "avg_content_length": round(
                sum(info["content_lengths"]) / max(len(info["content_lengths"]), 1)
            ),
            "top_targets": sorted(info["targets"].items(), key=lambda x: -x[1])[:5],
        })
    agent_summary.sort(key=lambda x: -x["total_actions"])

    # 5. Action type distribution
    type_distribution = [
        {"type": t, "count": c}
        for t, c in sorted(action_types.items(), key=lambda x: -x[1])
    ]

    # 6. Platform comparison
    platform_comparison = platform_actions

    # 7. Sentiment analysis
    sentiment_timeline = []
    pos_words = [
        "growth", "opportunity", "success", "strong", "improve",
        "positive", "confident", "optimistic", "expand", "achieve",
        "profit", "gain", "innovation", "progress", "agreement",
    ]
    neg_words = [
        "risk", "concern", "threat", "decline", "challenge",
        "pressure", "weak", "fail", "crisis", "loss",
        "debt", "delay", "conflict", "corruption", "scandal",
    ]
    for rnum in sorted(rounds.keys()):
        pos, neg, neutral = 0, 0, 0
        for a in rounds[rnum]["actions"]:
            content = str(a.get("action_args", {}).get("content", "")).lower()
            if not content or _has_cjk(content):
                continue
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

    # 8. Agent activity over time
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


def _compute_gods_eye(actions: list, agent_stats: dict) -> dict:
    """Compute God's Eye View analytics — deeper cross-cutting analysis."""
    agent_platform_behavior: dict = {}

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

    # Cross-platform divergence
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

    # Influence scoring: simple degree-based
    influence_scores = {}
    post_authors: dict = {}
    for a in actions:
        atype = a.get("action_type", "")
        args = a.get("action_args", {})
        aid = str(a.get("agent_id", "?"))
        aname = a.get("agent_name", aid)
        if atype == "CREATE_POST" and "post_id" in args:
            post_authors[str(args["post_id"])] = (aid, aname)
        if atype in ("QUOTE_POST", "REPOST") and "new_post_id" in args:
            post_authors[str(args["new_post_id"])] = (aid, aname)

    for a in actions:
        atype = a.get("action_type", "")
        args = a.get("action_args", {})
        if atype in ("REPOST", "QUOTE_POST", "LIKE_POST", "CREATE_COMMENT"):
            ref_id = str(args.get("quoted_id", args.get("reposted_id", args.get("post_id", ""))))
            target_aid, target_name = post_authors.get(ref_id, (None, None))
            if target_aid:
                if target_aid not in influence_scores:
                    influence_scores[target_aid] = {"name": target_name, "score": 0, "interactions": 0}
                weight = {"REPOST": 3, "QUOTE_POST": 4, "LIKE_POST": 1, "CREATE_COMMENT": 2}.get(atype, 1)
                influence_scores[target_aid]["score"] += weight
                influence_scores[target_aid]["interactions"] += 1

    influence_ranking = sorted(influence_scores.values(), key=lambda x: -x["score"])

    # Temporal phases: split into thirds
    all_rounds = sorted(set(a.get("round_num", 0) for a in actions))
    phases = []
    if all_rounds:
        third = max(len(all_rounds) // 3, 1)
        phase_names = ["early", "middle", "late"]
        for p_idx in range(3):
            start = p_idx * third
            end = (p_idx + 1) * third if p_idx < 2 else len(all_rounds)
            phase_rounds = set(all_rounds[start:end])
            phase_actions = [a for a in actions if a.get("round_num", 0) in phase_rounds]

            type_counts: dict = {}
            for a in phase_actions:
                t = a.get("action_type", "UNKNOWN")
                type_counts[t] = type_counts.get(t, 0) + 1

            phases.append({
                "phase": phase_names[p_idx],
                "rounds": sorted(phase_rounds),
                "total_actions": len(phase_actions),
                "action_types": type_counts,
            })

    return {
        "cross_platform_divergence": cross_platform_divergence,
        "influence_ranking": influence_ranking[:20],
        "temporal_phases": phases,
        "agent_count": len(agent_platform_behavior),
        "total_actions": len(actions),
    }


# ========================
# Routes
# ========================

@router.get("/{simulation_id}")
async def get_analytics(simulation_id: str):
    """Comprehensive analytics computed from simulation actions."""
    actions_resp = await mf_get(f"/simulation/{simulation_id}/actions", {"limit": 10000})
    stats_resp = await mf_get(f"/simulation/{simulation_id}/agent-stats")
    status_resp = await mf_get(f"/simulation/{simulation_id}")

    if not actions_resp.get("success"):
        return actions_resp

    all_actions = actions_resp.get("data", {}).get("actions", [])
    agent_stats = stats_resp.get("data", {}).get("agents", {}) if stats_resp.get("data") else {}
    status_data = status_resp.get("data", {})

    analytics = _compute_analytics(all_actions, agent_stats, status_data)
    return {"success": True, "data": analytics}


@router.get("/gods-eye/{simulation_id}")
async def get_gods_eye(simulation_id: str):
    """God's Eye View analytics."""
    actions_resp = await mf_get(f"/simulation/{simulation_id}/actions", {"limit": 10000})
    stats_resp = await mf_get(f"/simulation/{simulation_id}/agent-stats")

    if not actions_resp.get("success"):
        return actions_resp

    all_actions = actions_resp.get("data", {}).get("actions", [])
    agent_stats = stats_resp.get("data", {}).get("agents", {}) if stats_resp.get("data") else {}

    gods_eye = _compute_gods_eye(all_actions, agent_stats)
    return {"success": True, "data": gods_eye}


@router.get("/compare")
async def compare_analytics(request: Request):
    """Compare analytics across multiple simulations."""
    sim_ids_raw = request.query_params.get("simulation_ids", "")
    sim_ids = [s.strip() for s in sim_ids_raw.split(",") if s.strip()]

    if len(sim_ids) < 2:
        return {"success": False, "error": "Need at least 2 simulation_ids"}

    results = {}
    for sid in sim_ids:
        actions_resp = await mf_get(f"/simulation/{sid}/actions", {"limit": 10000})
        stats_resp = await mf_get(f"/simulation/{sid}/agent-stats")
        status_resp = await mf_get(f"/simulation/{sid}")

        if not actions_resp.get("success"):
            results[sid] = {"error": actions_resp.get("error", "Failed to fetch")}
            continue

        all_actions = actions_resp.get("data", {}).get("actions", [])
        agent_stats = stats_resp.get("data", {}).get("agents", {}) if stats_resp.get("data") else {}
        status_data = status_resp.get("data", {})

        results[sid] = _compute_analytics(all_actions, agent_stats, status_data)
        results[sid]["label"] = status_data.get("simulation_requirement", sid)[:80]

    return {"success": True, "data": results}
