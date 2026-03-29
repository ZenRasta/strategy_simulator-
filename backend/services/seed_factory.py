"""
Seed factory — loads simulation type definitions, provides canonical seed scaffolds,
and merges type defaults into seed documents.
"""

import json
import os
import copy
from typing import Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
TYPES_FILE = os.path.join(DATA_DIR, "simulation_types.json")
SUB_TEMPLATES_DIR = os.path.join(DATA_DIR, "sub_templates")

# In-memory cache
_types_cache: Optional[dict] = None


def _load_types() -> dict:
    """Load and cache simulation types from JSON file."""
    global _types_cache
    if _types_cache is not None:
        return _types_cache

    if not os.path.exists(TYPES_FILE):
        # Create a default types file if it doesn't exist
        _create_default_types()

    with open(TYPES_FILE, "r") as f:
        data = json.load(f)

    # Index by id
    _types_cache = {}
    if isinstance(data, list):
        for t in data:
            _types_cache[t["id"]] = t
    elif isinstance(data, dict):
        _types_cache = data

    return _types_cache


def _create_default_types():
    """Create the default simulation types definition file."""
    os.makedirs(os.path.dirname(TYPES_FILE), exist_ok=True)
    default_types = [
        {
            "id": "corporate_strategy",
            "name": "Corporate Strategy Simulation",
            "description": "Simulate strategic decisions within a corporate environment including board dynamics, M&A, market competition, and stakeholder management.",
            "category": "business",
            "icon": "building",
            "requirements": {
                "min_actors": 3,
                "max_actors": 30,
                "required_roles": ["executive", "board_member"],
                "required_actions": ["cooperate", "compete", "negotiate"],
                "required_environment": ["industry", "market_conditions"],
                "requires_scenario_trigger": True,
            },
            "defaults": {
                "rounds": 40,
                "platforms": ["twitter", "reddit"],
                "environment": {
                    "industry": "conglomerate",
                    "market_conditions": "competitive",
                    "regulatory_environment": "moderate",
                },
            },
            "seed_scaffold": {
                "title": "",
                "description": "",
                "scenario_trigger": "",
                "actors": [],
                "environment": {
                    "industry": "",
                    "market_conditions": "",
                    "regulatory_environment": "",
                },
                "context": {},
            },
            "sub_templates": [
                "mna_takeover",
                "market_entry",
                "crisis_management",
                "board_dynamics",
            ],
        },
        {
            "id": "geopolitical",
            "name": "Geopolitical Simulation",
            "description": "Simulate geopolitical scenarios involving nation-states, international organizations, and non-state actors.",
            "category": "political",
            "icon": "globe",
            "requirements": {
                "min_actors": 2,
                "max_actors": 20,
                "required_roles": ["state_actor"],
                "required_actions": ["negotiate", "sanction", "ally"],
                "required_environment": ["region", "conflict_type"],
                "requires_scenario_trigger": True,
            },
            "defaults": {
                "rounds": 30,
                "platforms": ["twitter", "reddit"],
                "environment": {
                    "region": "",
                    "conflict_type": "diplomatic",
                    "era": "contemporary",
                },
            },
            "seed_scaffold": {
                "title": "",
                "description": "",
                "scenario_trigger": "",
                "actors": [],
                "environment": {
                    "region": "",
                    "conflict_type": "",
                    "era": "contemporary",
                },
                "context": {},
            },
            "sub_templates": [
                "trade_war",
                "territorial_dispute",
                "sanctions_regime",
                "alliance_formation",
            ],
        },
        {
            "id": "market_competition",
            "name": "Market Competition Simulation",
            "description": "Simulate competitive market dynamics between companies, including pricing, product launches, and market share battles.",
            "category": "business",
            "icon": "chart-line",
            "requirements": {
                "min_actors": 2,
                "max_actors": 15,
                "required_roles": ["competitor"],
                "required_actions": ["compete", "innovate", "price"],
                "required_environment": ["market", "market_size"],
                "requires_scenario_trigger": False,
            },
            "defaults": {
                "rounds": 25,
                "platforms": ["twitter", "reddit"],
                "environment": {
                    "market": "",
                    "market_size": "",
                    "growth_rate": "",
                },
            },
            "seed_scaffold": {
                "title": "",
                "description": "",
                "actors": [],
                "environment": {
                    "market": "",
                    "market_size": "",
                    "growth_rate": "",
                },
                "context": {},
            },
            "sub_templates": [
                "price_war",
                "product_launch",
                "market_entry",
                "disruption",
            ],
        },
        {
            "id": "regulatory",
            "name": "Regulatory & Policy Simulation",
            "description": "Simulate regulatory processes, policy debates, and compliance scenarios involving government bodies, industry, and advocacy groups.",
            "category": "policy",
            "icon": "gavel",
            "requirements": {
                "min_actors": 3,
                "max_actors": 20,
                "required_roles": ["regulator", "regulated_entity"],
                "required_actions": ["comply", "lobby", "regulate"],
                "required_environment": ["jurisdiction", "policy_area"],
                "requires_scenario_trigger": True,
            },
            "defaults": {
                "rounds": 30,
                "platforms": ["twitter", "reddit"],
                "environment": {
                    "jurisdiction": "",
                    "policy_area": "",
                    "political_climate": "",
                },
            },
            "seed_scaffold": {
                "title": "",
                "description": "",
                "scenario_trigger": "",
                "actors": [],
                "environment": {
                    "jurisdiction": "",
                    "policy_area": "",
                    "political_climate": "",
                },
                "context": {},
            },
            "sub_templates": [
                "new_regulation",
                "enforcement_action",
                "policy_reform",
            ],
        },
        {
            "id": "custom",
            "name": "Custom Simulation",
            "description": "Fully customizable simulation with no predefined constraints. Define your own actors, actions, and environment.",
            "category": "custom",
            "icon": "cog",
            "requirements": {
                "min_actors": 2,
                "max_actors": 50,
                "required_roles": [],
                "required_actions": [],
                "required_environment": [],
                "requires_scenario_trigger": False,
            },
            "defaults": {
                "rounds": 30,
                "platforms": ["twitter", "reddit"],
                "environment": {},
            },
            "seed_scaffold": {
                "title": "",
                "description": "",
                "actors": [],
                "environment": {},
                "context": {},
            },
            "sub_templates": [],
        },
    ]

    with open(TYPES_FILE, "w") as f:
        json.dump(default_types, f, indent=2)


def load_type_definition(type_id: str) -> Optional[dict]:
    """Load a simulation type definition by ID."""
    types = _load_types()
    return types.get(type_id)


def get_all_types() -> list[dict]:
    """Return all simulation type definitions."""
    types = _load_types()
    return list(types.values())


def _get_requirements(type_def: dict) -> dict:
    """
    Normalize requirements from either format:
    - New format: nested under type_def["requirements"]
    - Existing format: top-level min_actors, required_actor_roles, environment_variable_keys
    """
    # If there's a nested requirements dict, use it
    if "requirements" in type_def:
        return type_def["requirements"]

    # Otherwise, build from top-level fields (existing simulation_types.json format)
    reqs: dict = {}
    reqs["min_actors"] = type_def.get("min_actors", 2)
    reqs["max_actors"] = type_def.get("max_actors", 50)

    # required_actor_roles is a list of {role, severity, reason}
    actor_roles = type_def.get("required_actor_roles", [])
    reqs["required_roles"] = [r["role"] for r in actor_roles if isinstance(r, dict)]
    reqs["_required_actor_roles_detail"] = actor_roles  # preserve severity info

    # environment_variable_keys is a dict of {key: {type, default, ...}}
    env_keys = type_def.get("environment_variable_keys", {})
    reqs["required_environment"] = list(env_keys.keys())
    reqs["_environment_variable_keys_detail"] = env_keys

    reqs["required_actions"] = type_def.get("required_actions", [])
    reqs["requires_scenario_trigger"] = type_def.get("requires_scenario_trigger", False)

    return reqs


def get_canonical_seed(type_id: str) -> Optional[dict]:
    """
    Return the pre-filled seed scaffold for a simulation type.
    This is the starting point for creating a new seed document.
    """
    type_def = load_type_definition(type_id)
    if not type_def:
        return None

    # Use explicit scaffold if present, otherwise build from type definition
    scaffold = copy.deepcopy(type_def.get("seed_scaffold", {}))

    if not scaffold:
        # Build scaffold from type definition fields
        scaffold = {
            "title": "",
            "description": "",
            "simulation_type": type_id,
            "scenario_trigger": "",
            "actors": [],
            "environment": {},
            "environment_variables": {},
            "context": {},
        }

    # Pre-fill environment defaults from either format
    defaults = type_def.get("defaults", {})
    if "environment" in defaults:
        env = scaffold.get("environment", {})
        for k, v in defaults["environment"].items():
            if k not in env or not env[k]:
                env[k] = v
        scaffold["environment"] = env

    # Pre-fill environment_variables from environment_variable_keys
    env_keys = type_def.get("environment_variable_keys", {})
    if env_keys:
        env_vars = scaffold.get("environment_variables", {})
        for k, spec in env_keys.items():
            if k not in env_vars:
                env_vars[k] = spec.get("default", "")
        scaffold["environment_variables"] = env_vars

    scaffold["_simulation_type"] = type_id
    scaffold["_type_name"] = type_def.get("name", "")
    return scaffold


def apply_type_defaults(seed: dict, type_id: str) -> dict:
    """
    Merge simulation type defaults into a seed document.
    Existing values in the seed take precedence.
    """
    type_def = load_type_definition(type_id)
    if not type_def:
        return seed

    result = copy.deepcopy(seed)
    defaults = type_def.get("defaults", {})

    # Merge environment
    if "environment" in defaults:
        env = result.get("environment", {})
        for k, v in defaults["environment"].items():
            if k not in env or not env[k]:
                env[k] = v
        result["environment"] = env

    # Merge environment_variables from keys definition
    env_keys = type_def.get("environment_variable_keys", {})
    if env_keys:
        env_vars = result.get("environment_variables", {})
        for k, spec in env_keys.items():
            if k not in env_vars or not env_vars[k]:
                env_vars[k] = spec.get("default", "")
        result["environment_variables"] = env_vars

    # Set simulation metadata
    result["_simulation_type"] = type_id
    result["_type_name"] = type_def.get("name", "")

    # Ensure default actions on actors that lack them
    reqs = _get_requirements(type_def)
    default_actions = reqs.get("required_actions", [])
    if default_actions:
        for actor in result.get("actors", []):
            if not actor.get("available_actions"):
                actor["available_actions"] = list(default_actions)

    return result


def get_sub_templates(type_id: str) -> list[dict]:
    """
    Return available sub-templates for a simulation type.
    Sub-templates are loaded from individual JSON files in data/sub_templates/.
    """
    type_def = load_type_definition(type_id)
    if not type_def:
        return []

    template_ids = type_def.get("sub_templates", [])
    templates = []

    for tid in template_ids:
        template_file = os.path.join(SUB_TEMPLATES_DIR, f"{tid}.json")
        if os.path.exists(template_file):
            with open(template_file, "r") as f:
                template = json.load(f)
                templates.append(template)
        else:
            # Return a basic stub for templates that don't have files yet
            templates.append({
                "id": tid,
                "name": tid.replace("_", " ").title(),
                "description": f"Sub-template for {tid.replace('_', ' ')} scenarios",
                "seed_overrides": {},
            })

    return templates
