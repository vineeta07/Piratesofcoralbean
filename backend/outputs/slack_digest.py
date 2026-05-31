class SlackDigest:
    @staticmethod
    def format(summaries: list[dict]) -> dict:
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📊 Sales Pipeline Health Check"
                }
            }
        ]
        
        # Sort by risk (red -> amber -> green) and take top 5
        priority = {"red": 0, "amber": 1, "green": 2}
        sorted_summaries = sorted(summaries, key=lambda x: (priority.get(x.get("risk_level"), 3), -(x.get("value") or 0)))
        top_deals = sorted_summaries[:5]

        for deal in top_deals:
            icon = "🔴" if deal.get("risk_level") == "red" else "🟡" if deal.get("risk_level") == "amber" else "🟢"
            deal_val = deal.get('value') or 0
            value_k = f"${deal_val / 1000:,.0f}K"
            
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"{icon} *{deal['deal_name']}* ({value_k})\n{deal['narrative']}\n_→ {deal['action']}_"
                }
            })
            
        return {"blocks": blocks}
