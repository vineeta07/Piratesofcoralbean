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
        
        if signal == "email_silence" or intent == "risk_scan":
            return {
                "sources": ["salesforce", "gmail", "gong", "slack", "linkedin"],
                "skip": [],
                "reason": "risk scans need full context from all canonical sources"
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
                "SELECT sf.deal_id, sf.deal_name, sf.value, gm.days_silent, g.sentiment_score, g.objections_count, sl.mentions_competitor, sl.escalation_flag, l.hired_recently\n"
                "FROM salesforce.deals sf\n"
                "LEFT JOIN gmail.threads gm ON sf.deal_id = gm.deal_id\n"
                "LEFT JOIN gong.calls g ON sf.deal_id = g.deal_id\n"
                "LEFT JOIN slack.messages sl ON sf.deal_id = sl.deal_id\n"
                "LEFT JOIN linkedin.profiles l ON sf.deal_id = l.deal_id\n"
                "WHERE gm.days_silent > 7\n"
                "LIMIT 50"
            )
        elif intent_data.get("intent") == "forecast":
            return (
                "SELECT SUM(value) as expected_revenue\n"
                "FROM salesforce.deals\n"
                "WHERE stage != 'Closed Lost' AND close_date <= END_OF_QUARTER"
            )
            
        # Default: return the canonical joined query used by the pipeline
        return (
            "SELECT sf.*, gm.days_silent, gm.has_legal, g.sentiment_score, g.objections_count, "
            "g.economic_buyer_attended, sl.mentions_competitor, sl.escalation_flag, l.hired_recently "
            "FROM salesforce.deals sf "
            "LEFT JOIN gmail.threads gm ON sf.deal_id = gm.deal_id "
            "LEFT JOIN gong.calls g ON sf.deal_id = g.deal_id "
            "LEFT JOIN slack.messages sl ON sf.deal_id = sl.deal_id "
            "LEFT JOIN linkedin.profiles l ON sf.deal_id = l.deal_id LIMIT 50"
        )

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
