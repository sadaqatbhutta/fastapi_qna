# Hybrid RAG (Local Docs + Wikipedia Fallback)

This patch adds a Wikipedia fallback to `/ask`:

- If your user has **no uploaded documents**, the API now fetches a short **Wikipedia summary** for the question topic and uses it to generate an answer.
- If documents exist but **no matched chunks** were found, a short Wikipedia summary is appended to the `combined_text` so answers can include public knowledge.

## Files Added
- `open_sources/wikipedia_client.py` — minimal Wikipedia client using `requests`.

## Changes
- `main.py` — `/ask` endpoint updated.

## Requirements
- `requests` is already in requirements.txt. No new dependency is required.
- Internet access is required at runtime for Wikipedia fallback.

## How it works
1. `/ask` aggregates the user's document text into `combined_text`.
2. If empty → query Wikipedia for a relevant summary, then answer.
3. If not empty but no matched chunks → enrich with Wikipedia summary.