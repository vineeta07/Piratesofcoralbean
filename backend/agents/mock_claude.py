class MockClaudeService:
    @staticmethod
    def parse_intent(query: str) -> dict:
        """Enhanced parsing logic for the Parser Agent."""
        query = query.lower()
        if "silent" in query or "gone silent" in query:
            return {
                "intent": "risk_scan",
                "timeframe": "this_month",
                "signal": "email_silence",
                "scope": "all_deals",
                "urgency": "high"
            }
        elif "forecast" in query:
            return {
                "intent": "forecast",
                "timeframe": "this_quarter",
                "signal": "revenue_projection",
                "scope": "pipeline",
                "urgency": "normal"
            }
        return {
            "intent": "general_scan",
            "timeframe": "all_deals",
            "signal": "all",
            "scope": "all",
            "urgency": "normal"
        }

    @staticmethod
    def map_context(intent_data: dict) -> dict:
        """Simulates the Context Agent's source mapping logic."""
        intent = intent_data.get("intent")
        signal = intent_data.get("signal")
        
        if signal == "email_silence":
            return {
                "sources": ["salesforce", "gmail"],
                "skip": ["gong", "linkedin", "slack"],
                "reason": "silence check only needs CRM + email"
            }
        elif intent == "forecast":
            return {
                "sources": ["salesforce"],
                "skip": ["gmail", "gong", "linkedin", "slack"],
                "reason": "forecasting primarily uses CRM opportunity data"
            }
        
        return {
            "sources": ["salesforce", "gmail", "gong", "linkedin", "slack"],
            "skip": [],
            "reason": "general scan requires full context from all sources"
        }

    @staticmethod
    def generate_coral_sql(context_data: dict, intent_data: dict) -> str:
        """Simulates the Query Agent's SQL generation."""
        signal = intent_data.get("signal")
        sources = context_data.get("sources")
        
        if signal == "email_silence":
            return (
                "SELECT s.deal_name, s.value, DATEDIFF(NOW(), e.last_reply) as days_silent\n"
                "FROM salesforce.opportunities s\n"
                "JOIN gmail.threads e ON s.contact_email = e.recipient\n"
                "WHERE close_date <= END_OF_MONTH\n"
                "HAVING days_silent > 7"
            )
        elif intent_data.get("intent") == "forecast":
            return (
                "SELECT SUM(value * probability) as expected_revenue\n"
                "FROM salesforce.opportunities\n"
                "WHERE stage != 'Closed Lost' AND close_date <= END_OF_QUARTER"
            )
            
        return "SELECT * FROM joined_deals LIMIT 10"

    @staticmethod
    def summarize_deal(scored_deal: dict) -> dict:
        """Simulates Claude writing a short narrative and action based on score and reasons."""
        risk_level = scored_deal.get("risk_level", "green")
        reasons = scored_deal.get("all_reasons", [])
        deal_name = scored_deal.get("deal_name", "Unknown Deal")
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
            "deal_id": scored_deal.get("deal_id"),
            "deal_name": deal_name,
            "value": scored_deal.get("value"),
            "score": scored_deal.get("score"),
            "risk_level": risk_level,
            "champion": champion,
            "narrative": narrative,
            "action": action
        }
