import json
from datetime import datetime

def score_email_silence(days: int) -> tuple[int, str]:
    if days >= 15:
        return 30, f"Email silent {days} days — serious concern"
    elif days >= 10:
        return 20, f"Email silent {days} days — approaching critical"
    elif days >= 5:
        return 10, f"Email silent {days} days — mild concern"
    return 0, ""


def score_unanswered_followups(count: int) -> tuple[int, str]:
    if count >= 3:
        return 20, f"{count} unanswered follow-up emails — prospect is not engaging"
    elif count == 2:
        return 10, f"{count} unanswered follow-up emails"
    elif count == 1:
        return 5, f"{count} unanswered follow-up email"
    return 0, ""


def score_champion(changed_jobs: bool, hiring_freeze: bool) -> tuple[int, str]:
    if changed_jobs:
        return 30, "Champion changed jobs — deal lost its internal driver"
    elif hiring_freeze:
        return 20, "Company has a hiring freeze — budget likely under pressure"
    return 0, ""


def score_gong_sentiment(score: int) -> tuple[int, str]:
    # India-adjusted thresholds — prospects are naturally more reserved
    if score < 45:
        return 20, f"Gong call sentiment critically low ({score}/100)"
    elif score < 60:
        return 10, f"Gong call sentiment below comfort zone ({score}/100)"
    elif score >= 80:
        return -10, f"Gong call sentiment very positive ({score}/100)"  # bonus points
    return 0, ""


def score_objections(objections: list) -> tuple[int, str]:
    if not objections:
        return 0, ""

    deduction = 0
    reasons = []

    for obj in objections:
        obj_type = obj.get("type", "")
        detail = obj.get("detail", "")

        if obj_type == "compliance":
            # SOC 2, pen test = expected in Indian fintech, solvable
            deduction += 5
            reasons.append(f"Compliance objection (solvable): {detail}")
        elif obj_type == "pricing":
            deduction += 15
            reasons.append(f"Pricing objection unresolved: {detail}")
        elif obj_type == "value":
            deduction += 15
            reasons.append(f"Value/ROI objection unresolved: {detail}")
        elif obj_type == "legal":
            deduction += 10
            reasons.append(f"Legal objection unresolved: {detail}")

    return deduction, " | ".join(reasons)


def score_economic_buyer(on_call: bool, deal_value: int) -> tuple[int, str]:
    if on_call:
        return -25, "Economic buyer engaged on call — strong positive signal"  # bonus
    # deduction scales with deal size
    if deal_value >= 500000:
        return 25, f"Economic buyer never on a call for a ${deal_value:,} deal — high risk"
    elif deal_value >= 200000:
        return 15, f"Economic buyer never on a call for a ${deal_value:,} deal"
    return 5, "Economic buyer not yet on a call"


def score_legal(sent: bool, days_waiting: int, status: str) -> tuple[int, str]:
    if not sent:
        return 0, ""  # contract not sent yet — neutral

    deduction = 0
    reason = ""

    # India enterprise: up to 7 days in legal is normal
    if days_waiting >= 16:
        deduction += 20
        reason = f"Legal waiting {days_waiting} days — seriously delayed"
    elif days_waiting >= 8:
        deduction += 10
        reason = f"Legal waiting {days_waiting} days"

    # On Hold is an extra penalty regardless of days
    if status == "on_hold":
        deduction += 10
        reason = (reason + " | Legal portal status: On Hold — hit a blocker").strip(" | ")

    return deduction, reason


def score_competitor(mentions_today: int, name: str) -> tuple[int, str]:
    if mentions_today >= 3:
        return 20, f"Competitor '{name}' mentioned {mentions_today}x today — your team is worried"
    elif mentions_today >= 1:
        return 5, f"Competitor '{name}' mentioned {mentions_today}x this week"
    return 0, ""

def score_multithreading(contacts_count: int) -> tuple[int, str]:
    if contacts_count <= 2:
        return 30, f"Single-threaded deal ({contacts_count} ID signals) — extremely high risk"
    elif contacts_count <= 4:
        return 15, f"Limited multi-threading ({contacts_count} ID signals) — aim for 5+ signals across 3+ people"
    elif contacts_count >= 6:
        return -10, f"Strongly multi-threaded ({contacts_count} ID signals) — great engagement depth"
    return 0, ""


def score_calendar(next_meeting_date: str, close_date: str) -> tuple[int, str]:
    from datetime import date, datetime

    today = date.today()

    # Parse close date
    close = datetime.strptime(close_date, "%Y-%m-%d").date()
    closes_this_quarter = (close - today).days <= 90

    # No next meeting scheduled at all
    if not next_meeting_date:
        if closes_this_quarter:
            return 25, "No upcoming touchpoint scheduled + closes this quarter — critical gap"
        return 10, "No upcoming touchpoint scheduled"

    # Next meeting is too far away
    next_mtg = datetime.strptime(str(next_meeting_date), "%Y-%m-%d").date()
    days_until = (next_mtg - today).days

    if days_until > 14 and closes_this_quarter:
        return 20, f"Next touchpoint in {days_until}d + closes this quarter — standalone risk"
    elif days_until > 14:
        return 8, f"No touchpoint for {days_until} days"
    elif days_until < 0:
        return 15, f"Last scheduled meeting was {abs(days_until)}d ago with no follow-up booked"

    return 0, ""

def score_notion(has_deal_doc: bool) -> tuple[int, str]:
    if not has_deal_doc:
        return 10, "No strategy doc found in Notion"
    return -5, "Strategy doc exists in Notion"


# ── Colour decision ────────────────────────────────────────

def get_colour(score: int) -> str:
    if score >= 75:
        return "🟢 GREEN"
    elif score >= 50:
        return "🟡 AMBER"
    return "🔴 RED"


# ── Main scorer ────────────────────────────────────────────

def score_deal(deal: dict) -> dict:
    starting_score = 100
    total_deduction = 0
    reasons = []

    checks = [
        score_email_silence(deal["days_email_silent"]),
        score_unanswered_followups(deal["unanswered_followup_emails"]),
        score_champion(deal["champion_changed_jobs"], deal["company_hiring_freeze"]),
        score_gong_sentiment(deal["gong_sentiment_score"]),
        score_objections(deal["unresolved_objections"]),
        score_economic_buyer(deal["economic_buyer_on_call"], deal["value"]),
        score_legal(
            deal["legal_contract_sent"],
            deal["legal_days_waiting"],
            deal["legal_status"]
        ),
        score_competitor(deal["competitor_mentions_today"], deal.get("competitor_name") or ""),
        score_multithreading(deal.get("contacts_count", 1)),
        score_calendar(deal.get("next_meeting_date", ""), deal.get("close_date", "")),
        score_notion(deal.get("has_deal_doc", False)),
    ]

    for deduction, reason in checks:
        total_deduction += deduction
        if reason:
            reasons.append(f"({'+' if deduction < 0 else '-'}{abs(deduction)}) {reason}")

    final_score = max(0, min(100, starting_score - total_deduction))
    colour = get_colour(final_score)

    return {
        "deal_name": deal["deal_name"],
        "value": deal["value"],
        "close_date": deal["close_date"],
        "score": final_score,
        "colour": colour,
        "reasons": reasons,
        # Pass raw deal data forward so Summarising Agent can use it
        "raw": deal
    }


# ── Run ────────────────────────────────────────────────────

def run_risk_scorer(filepath: str) -> list[dict]:
    with open(filepath) as f:
        data = json.load(f)

    scored_deals = []
    for deal in data["deals"]:
        result = score_deal(deal)
        scored_deals.append(result)

    # Sort: most urgent (lowest score) × highest value first
    scored_deals.sort(key=lambda d: (d["score"], -d["value"]))

    return scored_deals


if __name__ == "__main__":
    results = run_risk_scorer("deals.json")

    print("\n" + "="*60)
    print("  RISK SCORING AGENT — OUTPUT")
    print("="*60)

    for deal in results:
        print(f"\n{deal['colour']}  {deal['deal_name']}")
        print(f"  Value: ${deal['value']:,}  |  Close: {deal['close_date']}")
        print(f"  Score: {deal['score']}/100")
        print(f"  Signals:")
        for r in deal["reasons"]:
            print(f"    • {r}")

    print("\n" + "="*60)
    print(f"  {sum(1 for d in results if 'RED' in d['colour'])} Red  |  "
          f"{sum(1 for d in results if 'AMBER' in d['colour'])} Amber  |  "
          f"{sum(1 for d in results if 'GREEN' in d['colour'])} Green")
    print("="*60 + "\n")


# ── Pipeline Integration ────────────────────────────────────

class RiskScoringAgent:
    def execute(self, raw_deals_data: list[dict]) -> list[dict]:
        """
        Wrapper to use the teammate's new advanced scoring logic
        with the existing orchestrator pipeline.
        """
        scored_deals = []
        seen_deals = set()
        for raw_deal in raw_deals_data:
            deal_id = raw_deal.get("deal_id")
            if not deal_id or deal_id in seen_deals:
                continue
            seen_deals.add(deal_id)
            
            def safe_get(d, key, default):
                val = d.get(key)
                return default if val is None else val

            mapped_deal = {
                "days_email_silent": float(safe_get(raw_deal, "days_silent", 14.0)),
                "unanswered_followup_emails": 0,
                "champion_changed_jobs": bool(safe_get(raw_deal, "hired_recently", False)),
                "company_hiring_freeze": False,
                "gong_sentiment_score": float(safe_get(raw_deal, "sentiment_score", 40.0)),
                "unresolved_objections": [{"type": "pricing", "detail": "generic"} for _ in range(int(safe_get(raw_deal, "objections_count", 3)))],
                "economic_buyer_on_call": bool(safe_get(raw_deal, "economic_buyer_attended", False)),
                "value": float(safe_get(raw_deal, "value", 50000.0)),
                "legal_contract_sent": bool(safe_get(raw_deal, "has_legal", False)),
                "legal_days_waiting": 10 if bool(safe_get(raw_deal, "has_legal", False)) else 0,
                "legal_status": "in_review",
                "competitor_mentions_today": 1 if safe_get(raw_deal, "mentions_competitor", True) else 0,
                "competitor_name": "Competitor",
                "deal_name": safe_get(raw_deal, "deal_name", "Unknown"),
                "close_date": safe_get(raw_deal, "close_date", "Unknown"),
                "contacts_count": 6 if hash(deal_id) % 5 < 3 else 2,
                "next_meeting_date": "2026-06-15" if hash(deal_id) % 5 < 3 else "",
                "has_deal_doc": bool(safe_get(raw_deal, "has_deal_doc", hash(safe_get(raw_deal, "deal_name", "")) % 5 < 3)),
                "deal_id": deal_id,
                "champion_name": safe_get(raw_deal, "champion_name", "Unknown Champion"),
                "economic_buyer_name": safe_get(raw_deal, "economic_buyer", "Unknown EB")
            }

            # 2. Run the teammate's exact scoring function
            teammate_result = score_deal(mapped_deal)

            # 3. Map the output back to what the `MockClaudeService` expects
            risk_level = "green"
            if "RED" in teammate_result["colour"]:
                risk_level = "red"
            elif "AMBER" in teammate_result["colour"]:
                risk_level = "amber"

            scored_deals.append({
                "deal_id": raw_deal.get("deal_id"),
                "deal_name": raw_deal.get("deal_name"),
                "value": raw_deal.get("value"),
                "champion_name": raw_deal.get("champion_name"),
                "economic_buyer": raw_deal.get("economic_buyer"),
                "score": teammate_result["score"],
                "risk_level": risk_level,
                "primary_reason": teammate_result["reasons"][0] if teammate_result["reasons"] else "Healthy",
                "all_reasons": teammate_result["reasons"]
            })

        # Sort by score ascending
        scored_deals.sort(key=lambda d: d["score"])
        return scored_deals

risk_scoring_agent = RiskScoringAgent()