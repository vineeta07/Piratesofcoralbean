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
            
            return final_output
            
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
