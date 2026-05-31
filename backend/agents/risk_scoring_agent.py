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
        for raw_deal in raw_deals_data:
            # 1. Map Coral raw data to the structure the teammate's script expects
            mapped_deal = {
                "days_email_silent": raw_deal.get("days_silent") or 0,
                "unanswered_followup_emails": 0, # Defaulted as not in raw
                "champion_changed_jobs": bool(raw_deal.get("hired_recently")),
                "company_hiring_freeze": False,
                "gong_sentiment_score": raw_deal.get("sentiment_score") or 50,
                "unresolved_objections": [{"type": "pricing", "detail": "generic"} for _ in range(int(raw_deal.get("objections_count") or 0))],
                "economic_buyer_on_call": bool(raw_deal.get("economic_buyer_attended")),
                "value": raw_deal.get("value") or 0,
                "legal_contract_sent": bool(raw_deal.get("has_legal")),
                "legal_days_waiting": 10 if bool(raw_deal.get("has_legal")) else 0,
                "legal_status": "in_review",
                "competitor_mentions_today": 1 if raw_deal.get("mentions_competitor") else 0,
                "competitor_name": "Competitor",
                "deal_name": raw_deal.get("deal_name") or "Unknown",
                "close_date": raw_deal.get("close_date") or "Unknown"
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