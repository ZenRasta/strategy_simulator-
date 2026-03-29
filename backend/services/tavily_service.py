"""
Tavily API integration for web search and URL content extraction.
"""

import os
import httpx

TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")
TAVILY_BASE = "https://api.tavily.com"


async def search(query: str, max_results: int = 10) -> dict:
    """Run an advanced Tavily search and return structured results."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            f"{TAVILY_BASE}/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "advanced",
                "max_results": max_results,
                "include_raw_content": True,
                "include_answer": True,
            },
        )
        return r.json()


async def extract(url: str) -> dict:
    """Extract content from a URL using Tavily's extraction API."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            f"{TAVILY_BASE}/extract",
            json={
                "api_key": TAVILY_API_KEY,
                "urls": [url],
            },
        )
        return r.json()
