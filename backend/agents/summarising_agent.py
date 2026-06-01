import json
import os
from dotenv import load_dotenv
from backend.agents.risk_scoring_agent import run_risk_scorer
load_dotenv()

try:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    LLM_AVAILABLE = True
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.1,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
except Exception:
    # Fall back to local mock summariser if Groq SDK is unavailable
    from backend.agents.mock_claude import MockClaudeService
    LLM_AVAILABLE = False

def summarise_deal(deal: dict) -> str:
    """Call Groq to generate a highly synthesized executive sales summary."""

    system_instructions = """
You are a senior sales strategy analyst. A busy sales manager needs to understand 
the health of a pipeline deal in an instant. Do not just read back raw data rows. 
Synthesize the insights.

Provide your output in exactly this layout:
### {colour_emoji} {colour} | {deal_name}
* **Pipeline Impact:** ${value:,} | **Target Close:** {close_date} | **Health:** {score}/100
* **The Bottom Line:** [Write 2 sentences connecting the raw signals together. Explain what they MEAN contextually. Mention key names like the champion or objections if relevant.]
* **Manager Action Today:** [Provide ONE clear, proactive operational instruction for the sales team today.]

Rules:
- Be punchy and direct. Never start with "This deal" or "Based on the data".
- Do not list metrics that are perfectly normal or zero. Focus only on momentum and friction.
- Keep the entire output under 90 words.
"""

    color_map = {"GREEN": "≡ƒƒó", "AMBER": "≡ƒƒí", "RED": "≡ƒö┤"}
    deal["colour_emoji"] = color_map.get(deal["colour"].upper(), "ΓÜ¬")

    if LLM_AVAILABLE:
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_instructions),
            ("human", "Generate the executive brief for account record: {deal_name}")
        ])
        try:
            chain = prompt_template | llm
            result = chain.invoke(deal)
            return result.content.strip()
        except Exception as e:
            print(f"Warning: Failed to summarise deal {deal.get('deal_name')} due to API limit: {e}")
            return "Executive summary unavailable due to API rate limits. Focus on the risk signals provided."
    else:
        try:
            mock = MockClaudeService.summarize_deal(deal)
            return mock.get('narrative') if isinstance(mock, dict) else str(mock)
        except Exception as e:
            print(f"Warning: Mock summariser failed for {deal.get('deal_name')}: {e}")
            return "Executive summary unavailable (mock summariser failed)."


def run_summarising_agent(scored_deals: list) -> list[dict]:
    """Run summarising agent on all scored deals."""

    summarised = []

    for deal in scored_deals:
        print(f"  Summarising {deal['deal_name']}...")
        summary = summarise_deal(deal)

        # Derive risk_level from colour if not already present
        colour_str = deal.get("colour", "")
        if deal.get("risk_level"):
            risk_level = deal["risk_level"]
        elif "RED" in colour_str:
            risk_level = "red"
        elif "AMBER" in colour_str:
            risk_level = "amber"
        else:
            risk_level = "green"

        summarised.append({
            "deal_id": deal.get("deal_id", ""),
            "deal_name": deal["deal_name"],
            "value": deal["value"],
            "close_date": deal["close_date"],
            "score": deal["score"],
            "colour": deal["colour"],
            "risk_level": risk_level,
            "summary": summary,
            "all_reasons": deal.get("all_reasons", deal.get("reasons", [])),
            "primary_reason": deal.get("primary_reason", ""),
            "champion_name": deal.get("champion_name", ""),
            "economic_buyer": deal.get("economic_buyer", ""),
        })

    return summarised


class SummarisingAgent:
    def execute(self, scored_deals: list) -> list[dict]:
        return run_summarising_agent(scored_deals)

summarising_agent = SummarisingAgent()
