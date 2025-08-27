"""
Lightweight Wikipedia client using public REST APIs (no extra dependencies).
"""

import requests
from typing import Optional, Tuple

WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"

def search_title(query: str) -> Optional[str]:
    """
    Return the best-matching Wikipedia page title for a query using opensearch.
    """
    try:
        params = {
            "action": "opensearch",
            "search": query,
            "limit": 1,
            "namespace": 0,
            "format": "json"
        }
        r = requests.get(WIKI_API, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        if isinstance(data, list) and len(data) >= 2 and data[1]:
            return data[1][0]
    except Exception:
        return None
    return None

def fetch_summary(title: str) -> Optional[str]:
    """
    Fetch the plain-text summary for a given title (first paragraph or two).
    """
    try:
        url = WIKI_SUMMARY.format(title=title.replace(" ", "_"))
        r = requests.get(url, timeout=10, headers={"accept": "application/json"})
        r.raise_for_status()
        data = r.json()
        # 'extract' has the text summary
        extract = data.get("extract")
        if extract:
            # Clamp to ~1200 chars to keep prompt light
            return extract[:1200]
    except Exception:
        return None
    return None

def wikipedia_summary_for(query: str) -> Optional[Tuple[str, str]]:
    """
    High-level helper: search a title then fetch its summary.
    Returns (title, summary) or None if not found.
    """
    title = search_title(query)
    if not title:
        return None
    summary = fetch_summary(title)
    if not summary:
        return None
    return title, summary
