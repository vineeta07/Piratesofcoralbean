class MockClaudeService:
    @staticmethod
    def parse_intent(query: str) -> dict:
        """Simulates Claude extracting intent from natural language."""
        query = query.lower()
        if "risk" in query or "focus" in query or "late" in query:
            return {
                "intent": "risk_scan",
                "timeframe": "this_month",
                "signal_type": "all",
                "urgency": "high"
            }
        return {
            "intent": "general_scan",
            "timeframe": "all_deals",
            "signal_type": "all",
            "urgency": "normal"
        }

    @staticmethod
    def summarize_deal(scored_deal: dict) -> dict:
        """Simulates Claude writing a short narrative and action based on score and reasons."""
        risk_level = scored_deal["risk_level"]
        reasons = scored_deal.get("all_reasons", [])
        deal_name = scored_deal["deal_name"]
        champion = scored_deal.get("champion_name", "the champion")
        econ_buyer = scored_deal.get("economic_buyer", "the economic buyer")
        
        if risk_level == "red":
            narrative = f"{champion} might be disengaged. Key issues detected: {', '.join(reasons)}. This requires immediate attention."
            if "Champion recently changed jobs" in reasons:
                narrative = f"Champion {champion} changed jobs. The deal lost its primary sponsor. {', '.join(reasons[1:])}."
                action = f"Contact the economic buyer {econ_buyer} directly today. Do not wait to re-engage."
            elif any("Email silent" in r for r in reasons):
                action = f"Escalate immediately. Try calling {champion} or reaching out to {econ_buyer}."
            else:
                action = f"Review objections on next call. Prepare mitigation strategy."
                
        elif risk_level == "amber":
            narrative = f"Deal is progressing but has some friction: {', '.join(reasons)}."
            action = f"Send a targeted follow-up addressing these concerns. Keep {econ_buyer} looped in."
            
        else: # green
            narrative = f"Deal is healthy and on track. Engagement is strong."
            action = f"Continue standard cadence. Prepare for close with {econ_buyer}."
            
        return {
            "deal_id": scored_deal["deal_id"],
            "deal_name": deal_name,
            "value": scored_deal["value"],
            "score": scored_deal["score"],
            "risk_level": risk_level,
            "champion": champion,
            "narrative": narrative,
            "action": action
        }
