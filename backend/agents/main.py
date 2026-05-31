import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

import json
from parser_agent import parser_agent
from context_agent import context_agent
from query_agent import query_builder
from risk_scoring_agent import run_risk_scorer
from summarising_agent import run_summarising_agent
from formatter_agent import run_formatter_agent
from coral_reader import load_and_score_deals

def run_pipeline(query: str):
    """
    Full pipeline triggered by a single manager query.
    Everything is generated on the fly — no hardcoded files.
    """

    print("=== STEP 1: Parser Agent ===")
    intent = parser_agent.execute(query)
    print(f"  {intent}")

    print("\n=== STEP 2: Context Agent ===")
    context = context_agent.execute(intent)
    print(f"  Sources: {context['sources']}")

    print("\n=== STEP 3: Query Agent ===")
    sql = query_builder.execute(context, intent)
    print(f"  SQL: {sql}")

    print("\n=== STEP 4: Risk Scoring Agent ===")
    

    scored = load_and_score_deals("coral/mock_data")

    print("\n=== STEP 5: Summarising Agent ===")
    summarised = run_summarising_agent(scored)

    print("\n=== STEP 6: Formatter Agent ===")
    results = run_formatter_agent(summarised, output_dir="backend/outputs")

    print(f"\n✅ docx  → {results['docx_path']}")
    print(f"✅ pptx  → {results['pptx_path']}")
    print(f"✅ slack → {len(results['slack']['blocks'])} blocks")
    print(f"✅ sf    → {len(results['salesforce'])} records")

    return results

if __name__ == "__main__":
    query = input("Sales Manager Query: ")
    run_pipeline(query)