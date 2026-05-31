import time
from backend.agents.parser_agent import parser_agent
from backend.agents.context_agent import context_agent
from backend.agents.query_agent import query_builder
from backend.agents.risk_scoring_agent import risk_scoring_agent
from backend.coral.coral_client import coral_client
from backend.agents.summarising_agent import summarising_agent
from backend.agents.formatter_agent import formatter_agent

class Orchestrator:
    def analyze_query(self, query: str) -> dict:
        print(f"\n--- Starting Orchestration for: '{query}' ---")
        
        try:
            # 1. Parse Intent
            start = time.time()
            intent = parser_agent.execute(query)
            t_parse = (time.time() - start) * 1000
            print(f"[OK] Parser Agent finished in {t_parse:.1f}ms. Intent: {intent['intent']}")
            
            # 2. Build Query & Score Risk
            start = time.time()
            context = context_agent.execute(intent)
            sql_query = query_builder.execute(context, intent)
            print(f"[OK] Generated SQL: {sql_query}")
            
            raw_data = coral_client.execute_query(sql_query)
            scored_deals = risk_scoring_agent.execute(raw_data)
            t_query = (time.time() - start) * 1000
            print(f"[OK] Query/Risk Agent finished in {t_query:.1f}ms. Scored {len(scored_deals)} deals.")
            
            # 3. Summarise
            start = time.time()
            summaries = summarising_agent.execute(scored_deals)
            t_sum = (time.time() - start) * 1000
            print(f"[OK] Summariser Agent finished in {t_sum:.1f}ms.")
            
            # 4. Format Output
            start = time.time()
            final_output = formatter_agent.execute(summaries)
            t_fmt = (time.time() - start) * 1000
            print(f"[OK] Formatter Agent finished in {t_fmt:.1f}ms.")
            
            total_time = t_parse + t_query + t_sum + t_fmt
            print(f"[DONE] Total Pipeline Time: {total_time:.1f}ms")
            
            # 5. Build the dashboard response the frontend expects
            deals_for_frontend = []
            for deal in summaries:
                # Derive risk_level from colour if not set
                risk_level = deal.get("risk_level", "green")
                if not risk_level or risk_level not in ("red", "amber", "green"):
                    colour = deal.get("colour", "")
                    if "RED" in colour:
                        risk_level = "red"
                    elif "AMBER" in colour:
                        risk_level = "amber"
                    else:
                        risk_level = "green"
                
                # Extract action from all_reasons or primary_reason
                all_reasons = deal.get("all_reasons", [])
                primary_reason = deal.get("primary_reason", "")
                action = primary_reason if primary_reason else (all_reasons[0] if all_reasons else "Monitor deal health")
                
                deals_for_frontend.append({
                    "deal_id": deal.get("deal_id", f"deal-{len(deals_for_frontend)}"),
                    "deal_name": deal.get("deal_name", "Unknown"),
                    "value": deal.get("value", 0),
                    "score": deal.get("score", 50),
                    "risk_level": risk_level,
                    "narrative": deal.get("summary", ""),
                    "action": action,
                    "champion": deal.get("champion_name", "Unknown"),
                    "close_date": deal.get("close_date", ""),
                    "all_reasons": all_reasons,
                    "primary_reason": primary_reason,
                    "economic_buyer": deal.get("economic_buyer", ""),
                })
            
            # Compute summary counts
            red_count = sum(1 for d in deals_for_frontend if d["risk_level"] == "red")
            amber_count = sum(1 for d in deals_for_frontend if d["risk_level"] == "amber")
            green_count = sum(1 for d in deals_for_frontend if d["risk_level"] == "green")
            
            return {
                "success": True,
                "dashboard": {
                    "deals": deals_for_frontend,
                    "summary": {
                        "total_deals": len(deals_for_frontend),
                        "red_count": red_count,
                        "amber_count": amber_count,
                        "green_count": green_count,
                    }
                },
                "slack": final_output.get("slack", {"blocks": []}),
                "salesforce": final_output.get("salesforce", []),
            }
            
        except Exception as e:
            print(f"Error in Orchestrator: {str(e)}")
            # Fallback
            return {
                "success": False,
                "error": str(e),
                "dashboard": {"deals": [], "summary": {"total_deals": 0, "red_count": 0, "amber_count": 0, "green_count": 0}},
                "slack": {"blocks": [{"type": "section", "text": {"type": "mrkdwn", "text": "Error running pipeline."}}]}
            }

pipeline_orchestrator = Orchestrator()
