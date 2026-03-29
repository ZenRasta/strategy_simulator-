"""
Seed validation engine.
Validates seed documents against simulation type requirements including
required roles, actor counts, environment variables, actions, and scenario triggers.
"""

from typing import Optional
from services.seed_factory import load_type_definition, _get_requirements


def validate_seed(seed: dict, type_id: str) -> dict:
    """
    Validate a seed against a simulation type's requirements.

    Returns:
        dict with "valid" (bool), "errors" (list of critical issues),
        and "warnings" (list of non-critical suggestions).
    """
    errors: list[str] = []
    warnings: list[str] = []

    type_def = load_type_definition(type_id)
    if not type_def:
        return {
            "valid": False,
            "errors": [f"Unknown simulation type: {type_id}"],
            "warnings": [],
        }

    requirements = _get_requirements(type_def)

    # Validate actors
    actors = seed.get("actors", [])
    _validate_actor_count(actors, requirements, errors, warnings)
    _validate_required_roles(actors, requirements, errors, warnings)
    _validate_actor_actions(actors, requirements, errors, warnings)

    # Validate environment
    _validate_environment(seed, requirements, errors, warnings)

    # Validate scenario trigger
    _validate_scenario_trigger(seed, requirements, errors, warnings)

    # Validate basic structure
    _validate_structure(seed, errors, warnings)

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }


def _validate_actor_count(
    actors: list, requirements: dict, errors: list, warnings: list
):
    """Check that actor count falls within the allowed range."""
    min_actors = requirements.get("min_actors", 2)
    max_actors = requirements.get("max_actors", 50)

    if len(actors) < min_actors:
        errors.append(
            f"Too few actors: {len(actors)} provided, minimum is {min_actors}"
        )
    elif len(actors) > max_actors:
        warnings.append(
            f"Many actors: {len(actors)} provided, maximum recommended is {max_actors}. "
            "Simulation may be slow."
        )


def _validate_required_roles(
    actors: list, requirements: dict, errors: list, warnings: list
):
    """Check that all required roles are filled by at least one actor."""
    # Support both formats:
    # 1. Simple list: required_roles = ["executive", "board_member"]
    # 2. Detailed list: _required_actor_roles_detail = [{role, severity, reason}]
    detailed_roles = requirements.get("_required_actor_roles_detail", [])
    simple_roles = requirements.get("required_roles", [])

    if not detailed_roles and not simple_roles:
        return

    actor_roles = set()
    for actor in actors:
        role = actor.get("role", "").lower().strip()
        if role:
            actor_roles.add(role)
        # Also check role_type and type fields
        for field in ("role_type", "type", "category"):
            val = actor.get(field, "").lower().strip()
            if val:
                actor_roles.add(val)

    if detailed_roles:
        for role_spec in detailed_roles:
            role_name = role_spec.get("role", "").lower().strip()
            severity = role_spec.get("severity", "error")
            reason = role_spec.get("reason", "")

            found = any(
                role_name in ar or ar in role_name for ar in actor_roles
            )
            if not found:
                msg = f"Missing role: '{role_name}'."
                if reason:
                    msg += f" {reason}"
                if severity == "error":
                    errors.append(msg)
                elif severity == "warning":
                    warnings.append(msg)
                else:  # "info"
                    warnings.append(f"[Info] {msg}")
    else:
        for required_role in simple_roles:
            role_lower = required_role.lower().strip()
            found = any(
                role_lower in ar or ar in role_lower for ar in actor_roles
            )
            if not found:
                errors.append(
                    f"Missing required role: '{required_role}'. "
                    f"No actor has this role assigned."
                )


def _validate_actor_actions(
    actors: list, requirements: dict, errors: list, warnings: list
):
    """Check that actors have valid actions defined."""
    required_actions = requirements.get("required_actions", [])

    for actor in actors:
        name = actor.get("name", "Unknown")
        actions = actor.get("available_actions", [])

        if not actions:
            warnings.append(
                f"Actor '{name}' has no available_actions defined. "
                "Default actions will be used."
            )
            continue

        if required_actions:
            missing = [
                ra
                for ra in required_actions
                if not any(ra.lower() in a.lower() for a in actions)
            ]
            if missing:
                warnings.append(
                    f"Actor '{name}' is missing recommended actions: {', '.join(missing)}"
                )


def _validate_environment(
    seed: dict, requirements: dict, errors: list, warnings: list
):
    """Validate environment/context variables."""
    required_env = requirements.get("required_environment", [])
    env_detail = requirements.get("_environment_variable_keys_detail", {})

    env = seed.get("environment", {})
    env_vars = seed.get("environment_variables", {})
    context = seed.get("context", {})
    combined = {**env, **env_vars, **context}

    for var_name in required_env:
        if var_name not in combined:
            # Provide description from detail if available
            detail = env_detail.get(var_name, {})
            desc = detail.get("description", "")
            msg = f"Missing required environment variable: '{var_name}'"
            if desc:
                msg += f" ({desc})"
            errors.append(msg)
        elif not combined[var_name] and combined[var_name] != 0:
            warnings.append(
                f"Environment variable '{var_name}' is empty"
            )


def _validate_scenario_trigger(
    seed: dict, requirements: dict, errors: list, warnings: list
):
    """Validate that a scenario trigger/premise is defined."""
    needs_trigger = requirements.get("requires_scenario_trigger", False)
    if not needs_trigger:
        return

    trigger = seed.get("scenario_trigger", seed.get("trigger", seed.get("premise", "")))
    if not trigger:
        errors.append(
            "A scenario trigger/premise is required for this simulation type. "
            "Define a 'scenario_trigger' field describing the catalysing event."
        )
    elif len(str(trigger)) < 20:
        warnings.append(
            "Scenario trigger is very short. A more detailed trigger "
            "will produce better simulation results."
        )


def _validate_structure(seed: dict, errors: list, warnings: list):
    """Validate basic seed document structure."""
    if not seed.get("title") and not seed.get("name"):
        warnings.append("Seed has no title/name. Consider adding one for identification.")

    actors = seed.get("actors", [])
    for i, actor in enumerate(actors):
        if not actor.get("name"):
            errors.append(f"Actor at index {i} has no name")

    # Check for duplicate actor names
    names = [a.get("name", "") for a in actors if a.get("name")]
    seen = set()
    for name in names:
        if name in seen:
            warnings.append(f"Duplicate actor name: '{name}'")
        seen.add(name)
