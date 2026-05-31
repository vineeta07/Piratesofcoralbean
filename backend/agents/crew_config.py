import os
# pyrefly: ignore [missing-import]
from crewai import Agent, Task, Crew, Process
# pyrefly: ignore [missing-import]
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from typing import List, Optional

# Output models for structured data extraction
class ParserOutput(BaseModel):
    intent: str = Field(..., description="The main purpose of the query (e.g., risk_scan, forecast, deep_dive)")
    timeframe: str = Field(..., description="The time period mentioned (e.g., this_month, next_quarter)")
    signal: str = Field(..., description="The specific signal being checked (e.g., email_silence, sentiment, objections)")
    scope: str = Field(..., description="The scope of deals (e.g., all_deals, specifically closing)")
    urgency: str = Field(..., description="Calculated urgency level (high, normal, low)")

class ContextOutput(BaseModel):
    sources: List[str] = Field(..., description="List of required data sources (salesforce, gmail, gong, slack, linkedin)")
    skip: List[str] = Field(..., description="List of sources to skip")
    reason: str = Field(..., description="Brief explanation for the source selection")

class QueryOutput(BaseModel):
    sql: str = Field(..., description="The valid Coral SQL query string")

# Agent Definitions
def get_llm():
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        return "groq/llama-3.1-8b-instant"
    return None

llm = get_llm()

# Coral SQL Schema Definition
CORAL_SCHEMA = """
Tables & Columns:
1. salesforce.deals: [deal_id, deal_name, value, stage, owner, close_date, champion_name, economic_buyer]
2. gmail.threads: [email_id, deal_id, contact_email, last_email_sent, last_reply_from_prospect, days_silent, thread_length, has_legal, contract_sent_date]
3. gong.calls: [call_id, deal_id, contact_name, call_date, duration_min, sentiment_score, objections_count, economic_buyer_attended]
4. slack.messages: [message_id, deal_id, channel, timestamp, sentiment, mentions_competitor, escalation_flag, content_summary]
5. linkedin.profiles: [profile_id, deal_id, person_name, current_company, current_role, changed_jobs_date, previous_company, hired_recently]
6. notion.search: [id, url, raw, properties] (Use object_filter => '{"property":"object","value":"page"}' for pages)
7. google_calendar.events: [id, summary, description, start_date_time, end_date_time, attendees]

Relationships:
- All mock tables (1-5) can be joined on 'deal_id'.
- salesforce.deals.contact_email maps to gmail.threads.recipient.
- notion and google_calendar queries should be isolated or loosely joined via LIKE/ILIKE on deal names or champion names.
"""

# Parser Agent
parser_agent_node = Agent(
    role="Sales Query Analyst",
    goal="Understand precisely what a sales manager is asking about their pipeline.",
    backstory="You are an expert at analyzing natural language queries. You can identify intent, entities, and urgency with high precision.",
    allow_delegation=False,
    llm=llm,
    verbose=True
)

# Context Agent
context_agent_node = Agent(
    role="Data Source Strategist",
    goal="Determine the minimum required data sources for a given query. IMPORTANT: For ANY query about pipeline health, deals, or risk, you MUST include 'salesforce', 'gmail', 'gong', 'slack', and 'linkedin' to ensure the Risk Scoring engine has full context.",
    backstory="You understand exactly which tables (Salesforce, Gmail, Gong, Slack, LinkedIn, Notion, Google Calendar) hold which types of sales signals.",
    allow_delegation=False,
    llm=llm,
    verbose=True
)

# Query Agent
query_agent_node = Agent(
    role="Coral SQL Specialist",
    goal="Design bespoke Coral SQL queries that precisely answer the user's scenario by joining and filtering across heterogeneous sources.",
    backstory="You are a master of SQL and the Coral unified interface. You do not use templates; instead, you analyze the intent and context to build the most efficient and accurate query from scratch.",
    allow_delegation=False,
    llm=llm,
    verbose=True
)

def create_crew(query: str):
    # Tasks
    parse_task = Task(
        description=f"Analyze this query: '{query}' and extract intent, timeframe, signal, scope, and urgency.",
        expected_output="A JSON object with intent, timeframe, signal, scope, and urgency.",
        agent=parser_agent_node,
        output_json=ParserOutput
    )

    context_task = Task(
        description="Based on the parsed intent, decide which data sources are needed (Salesforce, Gmail, Gong, Slack, LinkedIn).",
        expected_output="A JSON object with sources, skip, and reason.",
        agent=context_agent_node,
        output_json=ContextOutput,
        context=[parse_task]
    )

    query_task = Task(
        description=(
            "Write a dynamic Coral SQL query to answer the user's question.\n"
            f"Schema Details:\n{CORAL_SCHEMA}\n"
            "Requirements:\n"
            "1. You MUST ALWAYS start your query EXACTLY with this string to ensure all risk data is available:\n"
            "SELECT sf.*, gm.days_silent, gm.has_legal, g.sentiment_score, g.objections_count, g.economic_buyer_attended, sl.mentions_competitor, sl.escalation_flag, l.hired_recently FROM salesforce.deals sf LEFT JOIN gmail.threads gm ON sf.deal_id = gm.deal_id LEFT JOIN gong.calls g ON sf.deal_id = g.deal_id LEFT JOIN slack.messages sl ON sf.deal_id = sl.deal_id LEFT JOIN linkedin.profiles l ON sf.deal_id = l.deal_id\n"
            "2. Then, append the appropriate WHERE clause based on intent and timeframe (e.g., stage, close_date). Note: Open deals are deals where stage IN ('Discovery', 'Proposal', 'Negotiation').\n"
            "3. IMPORTANT: Do NOT pre-filter deals by subjective criteria like 'risk', 'sentiment_score', 'days_silent', etc. The RiskScoringAgent will handle all risk calculations downstream. Just fetch the raw data for all open deals unless a specific deal is requested.\n"
            "4. To extract the month or year, use `EXTRACT(MONTH FROM CAST(close_date AS DATE))` and `EXTRACT(YEAR FROM CAST(close_date AS DATE))`.\n"
            "5. DO NOT use column aliases as functions (e.g. NEVER write `sf(close_date)`, always write `sf.close_date`).\n"
            "6. Return ONLY the raw SQL query string, without markdown formatting, quotes, or explanation."
        ),
        expected_output="A raw SQL query string.",
        agent=query_agent_node,
        output_json=QueryOutput,
        context=[parse_task, context_task]
    )

    return Crew(
        agents=[parser_agent_node, context_agent_node, query_agent_node],
        tasks=[parse_task, context_task, query_task],
        process=Process.sequential,
        verbose=True
    )

class CrewPipelineManager:
    def __init__(self):
        self._current_query = None
        self._results = {}

    def _run_if_needed(self, query: str):
        if query != self._current_query:
            print(f"Running CrewAI pipeline for query: {query}")
            crew = create_crew(query)
            result = crew.kickoff()
            
            # The result object contains the output of the final task by default, 
            # but we can access individual task outputs from the crew object after kickoff.
            # However, crewai results can be accessed via task.output if we keep track of them.
            
            # Accessing task outputs directly
            self._results['parser'] = crew.tasks[0].output.json_dict
            self._results['context'] = crew.tasks[1].output.json_dict
            self._results['query'] = crew.tasks[2].output.json_dict
            self._current_query = query

    def get_parser_result(self, query: str):
        self._run_if_needed(query)
        return self._results.get('parser')

    def get_context_result(self, intent_data: dict, query: str = None):
        # If query is not provided, we assume it's already run
        if query:
            self._run_if_needed(query)
        return self._results.get('context')

    def get_query_result(self, context_data: dict, intent_data: dict, query: str = None):
        if query:
            self._run_if_needed(query)
        res = self._results.get('query')
        return res.get('sql') if res else None

crew_manager = CrewPipelineManager()
