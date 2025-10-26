from __future__ import annotations

import os
from typing import List

import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_API_KEY")
SERPAPI_ENDPOINT = "https://serpapi.com/search.json"


class WebDoc:
    def __init__(self, title: str, url: str, snippet: str):
        self.metadata = {"source": url, "title": title}
        self.page_content = snippet


def serpapi_search(query: str, num: int = 5) -> List[WebDoc]:
    """Perform a SerpAPI search and return a list of WebDoc objects containing snippet + url.

    Requires SERPAPI_API_KEY in environment or .env.
    """
    if not SERPAPI_KEY:
        raise RuntimeError("SERPAPI_API_KEY not set in environment (.env)")

    params = {
        "q": query,
        "api_key": SERPAPI_KEY,
        "engine": "google",
        "num": num,
    }

    resp = requests.get(SERPAPI_ENDPOINT, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    results = []
    # organic_results typically contains the main list
    organic = data.get("organic_results") or data.get("organic") or []
    for item in organic[:num]:
        title = item.get("title") or item.get("position") or ""
        link = item.get("link") or item.get("url") or item.get("displayed_link") or ""
        snippet = (
            item.get("snippet")
            or item.get("snippet_highlighted")
            or item.get("rich_snippet", {}).get("top", {}).get("text", "")
        )
        # fallback to description or snippet fields
        if not snippet:
            snippet = item.get("rich_snippet", {}).get("bottom", {}).get("text", "")
        if not snippet:
            snippet = ""
        results.append(WebDoc(title=title, url=link, snippet=snippet))

    return results
