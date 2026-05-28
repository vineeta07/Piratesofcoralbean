from backend.coral.coral_client import coral_client
import math

class QueryBuilderAgent:
    def execute(self, intent_data: dict) -> list[dict]:
        """
        Simulates the query builder and risk scorer.
        In a real scenario, this would use Claude to convert the intent into a Coral SQL query.
        For the hackathon, we fetch the joined data and apply the risk scoring.
        """
        # Fetch raw data from Coral (5 joined CSVs)
        raw_data = coral_client.load_and_join()
        
        # We assume the intent means "score all deals" for the demo
        scored_deals = []
        for deal in raw_data:
            scored_deal = self._score_deal(deal)
            scored_deals.append(scored_deal)
            
        # Optional: Sort by risk (red first, then score ascending)
        scored_deals.sort(key=lambda x: x["score"])
        return scored_deals

    def _score_deal(self, deal: dict) -> dict:
        score = 100
        reasons = []
        
        # Negatives
        days_silent = deal.get("days_silent")
        if days_silent is not None and days_silent > 7:
            score -= 20
            reasons.append(f"Email silent {days_silent} days")
            
        sentiment = deal.get("sentiment_score")
        if sentiment is not None and sentiment < 70:
            score -= 15
            reasons.append(f"Low call sentiment ({sentiment})")
            
        changed_jobs = deal.get("changed_jobs_date")
        hired_recently = deal.get("hired_recently")
        if hired_recently:
            score -= 30
            reasons.append("Champion recently changed jobs")
            
        objections = deal.get("objections_count")
        if objections is not None and objections > 2:
            score -= 10
            reasons.append(f"{math.trunc(objections)} unresolved objections")
            
        escalated = deal.get("escalation_flag")
        if escalated:
            score -= 15
            reasons.append("Escalation flag raised in Slack")
            
        competitor = deal.get("mentions_competitor")
        if competitor:
            score -= 15
            reasons.append("Competitor mentioned in Slack")

        # Positives
        has_legal = deal.get("has_legal")
        if has_legal:
            score += 15
            
        econ_buyer = deal.get("economic_buyer_attended")
        if econ_buyer:
            score += 25
            
        if days_silent is not None and days_silent < 2:
            score += 20

        # Clamp between 0-100
        score = max(0, min(100, score))
        
        risk_level = "green"
        if score <= 40:
            risk_level = "red"
        elif score <= 70:
            risk_level = "amber"
            
        primary_reason = reasons[0] if reasons else "Deal looks healthy"
        
        return {
            "deal_id": deal.get("deal_id"),
            "deal_name": deal.get("deal_name"),
            "value": deal.get("value"),
            "champion_name": deal.get("champion_name"),
            "score": score,
            "risk_level": risk_level,
            "primary_reason": primary_reason,
            "all_reasons": reasons
        }

query_builder = QueryBuilderAgent()
