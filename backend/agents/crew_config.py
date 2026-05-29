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
    # CrewAI can handle many providers natively via LiteLLM strings 
    # format: 'provider/model-name'
    if api_key:
        return "groq/llama-3.3-70b-versatile"
    return None

llm = get_llm()

# Coral SQL Schema Definition
CORAL_SCHEMA = """
Tables & Columns:
1. salesforce.deals: [deal_id, deal_name, value, stage, close_date, probability, contact_email]
2. gmail.threads: [deal_id, recipient, last_reply, sentiment_score]
3. gong.calls: [deal_id, transcript_summary, objections_identified]
4. slack.messages: [deal_id, message_content, unseen_objections]
5. linkedin.profiles: [deal_id, job_title, tenure]

Relationships:
- All tables can be joined on 'deal_id'.
- salesforce.deals.contact_email maps to gmail.threads.recipient.
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
    goal="Determine the minimum required data sources for a given query.",
    backstory="You understand exactly which tables (Salesforce, Gmail, Gong, Slack, LinkedIn) hold which types of sales signals.",
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
            "1. Join tables only if necessary based on the required sources.\n"
            "2. Use the 'deal_id' for joins.\n"
            "3. Apply filters based on intent and timeframe (e.g., stage, close_date).\n"
            "4. Return only valid Coral SQL."
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
