import json
import os
from datetime import datetime

HISTORY_FILE = os.path.join(os.path.dirname(__file__), "../outputs/score_history.json")

def load_history() -> dict:
    if not os.path.exists(HISTORY_FILE):
        return {}
    with open(HISTORY_FILE) as f:
        return json.load(f)

def save_history(history: dict):
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=4)

def compute_momentum(scores: list[int]) -> tuple[str, int]:
    
    if len(scores) < 2:
        return "insufficient_data", 0

    changes = [scores[i] - scores[i-1] for i in range(1, len(scores))]
    avg_change = sum(changes) / len(changes)

    if avg_change <= -10:
        return "🔻 DECLINING",  -15   
    elif avg_change <= -5:
        return "📉 SOFTENING",  -7
    elif avg_change >= 10:
        return "📈 RECOVERING", +10   
    elif avg_change >= 5:
        return "📊 IMPROVING",  +5
    else:
        return "➡️  STABLE",     0

def run_momentum_agent(scored_deals: list[dict]) -> list[dict]:
    """
    Adds momentum label + adjusted score to each deal.
    Call this AFTER risk_scoring_agent, BEFORE summarising_agent.
    """
    history = load_history()
    today   = datetime.utcnow().strftime("%Y-%m-%d")

    for deal in scored_deals:
        name  = deal["deal_name"]
        score = deal["score"]

        if name not in history:
            history[name] = []
        history[name].append({"date": today, "score": score})

        history[name] = history[name][-5:]

        recent_scores = [h["score"] for h in history[name][-3:]]
        label, adjustment = compute_momentum(recent_scores)

        adjusted = max(0, min(100, score + adjustment))

        deal["momentum_label"]    = label
        deal["momentum_scores"]   = recent_scores
        deal["score_adjusted"]    = adjusted

        if adjusted >= 75:
            deal["colour"] = "GREEN"
        elif adjusted >= 50:
            deal["colour"] = "AMBER"
        else:
            deal["colour"] = "RED"

    save_history(history)
    return scored_deals