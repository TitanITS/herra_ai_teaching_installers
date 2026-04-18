from __future__ import annotations

from typing import Any, Dict, List

from backend.storage.database import get_conn


def count_ingested_text() -> int:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM ingested_text")
    row = cursor.fetchone()
    conn.close()
    return int(row[0] or 0)


def search_ingested_text_context(query: str, limit: int = 4) -> List[Dict[str, Any]]:
    terms = [t.lower() for t in query.split() if t.strip()]

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            id, text, tokens, penalized, created_at,
            detected_type, recommended_format, analysis_confidence,
            trust_score, trust_label, ai_source
        FROM ingested_text
        WHERE penalized = 0
        ORDER BY id DESC
        LIMIT 200
        """
    )
    rows = cursor.fetchall()
    conn.close()

    ranked: List[tuple[int, tuple[Any, ...]]] = []
    for row in rows:
        body = (row[1] or "").lower()
        score = 0
        for term in terms:
            if len(term) < 3:
                continue
            if term in body:
                score += 1
        if score > 0:
            ranked.append((score, row))

    if not ranked:
        ranked = [(0, row) for row in rows[:limit]]

    ranked.sort(key=lambda item: (-item[0], -int(item[1][0])))
    selected = [row for _, row in ranked[:limit]]

    return [
        {
            "id": r[0],
            "text": r[1],
            "tokens": r[2],
            "penalized": bool(r[3]),
            "created_at": r[4],
            "detected_type": r[5],
            "recommended_format": r[6],
            "analysis_confidence": r[7],
            "trust_score": r[8],
            "trust_label": r[9],
            "ai_source": r[10],
        }
        for r in selected
    ]