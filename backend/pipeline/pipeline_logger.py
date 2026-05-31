import json
import os
from datetime import datetime

AUDIT_FILE = os.path.join(os.path.dirname(__file__), "../outputs/audit_trail.jsonl")

def log_audit(scored_deals: list[dict], query: str):
    """
    Appends one audit record per pipeline run.
    .jsonl = one JSON object per line — immutable, append-only.
    Never deletes or overwrites.
    """
    record = {
        "timestamp":   datetime.utcnow().isoformat(),
        "query":       query,
        "snapshot":    [
            {
                "deal_name":  d["deal_name"],
                "value":      d["value"],
                "close_date": d["close_date"],
                "score":      d["score"],
                "colour":     d["colour"],
                "reasons":    d["reasons"],
                "raw_signals": d.get("raw", {})   # full raw deal data
            }
            for d in scored_deals
        ]
    }

    with open(AUDIT_FILE, "a") as f:   # "a" = append, never overwrites
        f.write(json.dumps(record) + "\n")

    print(f"  ✅ Audit logged → {AUDIT_FILE}")