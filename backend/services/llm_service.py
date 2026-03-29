"""
LLM service — calls DeepSeek via OpenRouter (OpenAI-compatible API).
Used for seed extraction from text, generating actor profiles, etc.
"""

import json
import os
import re
import httpx

LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://openrouter.ai/api/v1")
LLM_MODEL_NAME = os.environ.get("LLM_MODEL_NAME", "deepseek/deepseek-chat")


async def complete(prompt: str, max_tokens: int = 8000, temperature: float = 0.3) -> str:
    """Send a completion request to the LLM and return the response text."""
    if not LLM_API_KEY:
        raise RuntimeError("LLM_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    body = {
        "model": LLM_MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            f"{LLM_BASE_URL}/chat/completions",
            headers=headers,
            json=body,
        )
        response.raise_for_status()
        data = response.json()

    choices = data.get("choices", [])
    if not choices:
        raise RuntimeError("No response from LLM")

    return choices[0].get("message", {}).get("content", "")


async def extract_seed_json(prompt: str) -> dict:
    """
    Send extraction prompt to LLM and parse the JSON seed response.
    Handles common LLM response quirks (markdown fences, trailing text).
    """
    raw = await complete(prompt, max_tokens=8000, temperature=0.2)

    # Strip markdown code fences if present
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    # Try direct parse
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Try to find JSON object in the response
    match = re.search(r'\{[\s\S]*\}', raw)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Return raw text wrapped in an error structure
    return {
        "error": "Failed to parse LLM response as JSON",
        "raw_response": raw[:2000],
    }
