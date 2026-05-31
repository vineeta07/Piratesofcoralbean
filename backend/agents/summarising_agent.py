import json
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from risk_scoring_agent import run_risk_scorer

load_dotenv()
llm=ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.1,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

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

    color_map = {"GREEN": "🟢", "AMBER": "🟡", "RED": "🔴"}
    deal["colour_emoji"] = color_map.get(deal["colour"].upper(), "⚪")

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_instructions),
        ("human", "Generate the executive brief for account record: {deal_name}")
    ])
    
    chain = prompt_template | llm
    result = chain.invoke(deal)
    
    return result.content.strip()


def run_summarising_agent(scored_deals: list) -> list[dict]:
    """Run summarising agent on all scored deals."""

    summarised = []

    for deal in scored_deals:
        print(f"  Summarising {deal['deal_name']}...")
        summary = summarise_deal(deal)

        summarised.append({
            "deal_name": deal["deal_name"],
            "value": deal["value"],
            "close_date": deal["close_date"],
            "score": deal["score"],
            "colour": deal["colour"],
            "summary": summary
        })

    return summarised
