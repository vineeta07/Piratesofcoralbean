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
    if score < 45:
        return 20, f"Gong call sentiment critically low ({score}/100)"
    elif score < 60:
        return 10, f"Gong call sentiment below comfort zone ({score}/100)"
    elif score >= 80:
        return -10, f"Gong call sentiment very positive ({score}/100)" 
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
        return -25, "Economic buyer engaged on call — strong positive signal"  
    if deal_value >= 500000:
        return 25, f"Economic buyer never on a call for a ${deal_value:,} deal — high risk"
    elif deal_value >= 200000:
        return 15, f"Economic buyer never on a call for a ${deal_value:,} deal"
    return 5, "Economic buyer not yet on a call"


def score_legal(sent: bool, days_waiting: int, status: str) -> tuple[int, str]:
    if not sent:
        return 0, ""  

    deduction = 0
    reason = ""

    if days_waiting >= 16:
        deduction += 20
        reason = f"Legal waiting {days_waiting} days — seriously delayed"
    elif days_waiting >= 8:
        deduction += 10
        reason = f"Legal waiting {days_waiting} days"

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



def get_colour(score: int) -> str:
    if score >= 75:
        return "GREEN"
    elif score >= 50:
        return "AMBER"
    return "RED"



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
        "raw": deal
    }



def run_risk_scorer(filepath: str) -> list[dict]:
    with open(filepath) as f:
        data = json.load(f)

    scored_deals = []
    for deal in data["deals"]:
        result = score_deal(deal)
        scored_deals.append(result)

    scored_deals.sort(key=lambda d: (d["score"], -d["value"]))

    return scored_deals


