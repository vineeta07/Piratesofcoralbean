import pytest
from unittest.mock import MagicMock, patch
from backend.agents.parser_agent import ParserAgent
from backend.agents.context_agent import ContextAgent
from backend.agents.query_agent import QueryBuilderAgent
from backend.agents.crew_config import CrewPipelineManager

# Mock data for different scenarios
SCENARIOS = {
    "Find deals silent > 7 days": {
        "parser": {
            "intent": "risk_scan",
            "timeframe": "last_7_days",
            "signal": "email_silence",
            "scope": "all_deals",
            "urgency": "high"
        },
        "context": {
            "sources": ["salesforce", "gmail"],
            "skip": ["gong", "slack", "linkedin"],
            "reason": "Tracking silence requires CRM status and email activity."
        },
        "query": {"sql": "SELECT * FROM coral.deals JOIN coral.emails ..."}
    },
    "Forecast for Q3": {
        "parser": {
            "intent": "forecast",
            "timeframe": "Q3",
            "signal": "expected_revenue",
            "scope": "all_deals",
            "urgency": "normal"
        },
        "context": {
            "sources": ["salesforce"],
            "skip": ["gmail", "gong", "slack", "linkedin"],
            "reason": "Forecasting relies on CRM opportunity data."
        },
        "query": {"sql": "SELECT SUM(amount) FROM coral.deals WHERE ..."}
    },
    "Slack objections for Acme": {
        "parser": {
            "intent": "objections",
            "timeframe": "all_time",
            "signal": "objections",
            "scope": "acme_corp",
            "urgency": "high"
        },
        "context": {
            "sources": ["slack"],
            "skip": ["salesforce", "gmail", "gong", "linkedin"],
            "reason": "Specific request for Slack signals."
        },
        "query": {"sql": "SELECT * FROM coral.slack_messages WHERE ..."}
    },
    "Budget and Security Objections": {
        "parser": {
            "intent": "multi_signal_scan",
            "timeframe": "this_month",
            "signal": "objections",
            "scope": "all_deals",
            "urgency": "high"
        },
        "context": {
            "sources": ["salesforce", "gong", "slack"],
            "skip": ["gmail", "linkedin"],
            "reason": "Requires deal names (SFDC) + call data (Gong) + chat data (Slack)."
        },
        "query": {
            "sql": (
                "SELECT d.deal_name, g.objections_identified, s.unseen_objections\n"
                "FROM salesforce.deals d\n"
                "JOIN gong.calls g ON d.deal_id = g.deal_id\n"
                "JOIN slack.messages s ON d.deal_id = s.deal_id\n"
                "WHERE g.objections_identified LIKE '%budget%' OR s.unseen_objections LIKE '%security%'"
            )
        }
    }
}

@pytest.fixture
def mock_crew_manager():
    return CrewPipelineManager()

def test_parser_agent_scenarios(mock_crew_manager):
    parser_agent = ParserAgent()
    
    with patch('backend.agents.parser_agent.crew_manager', mock_crew_manager):
        for query, expected in SCENARIOS.items():
            # Mock the crew and its tasks
            mock_crew = MagicMock()
            mock_crew.tasks = [MagicMock(), MagicMock(), MagicMock()]
            mock_crew.tasks[0].output.json_dict = expected['parser']
            mock_crew.tasks[1].output.json_dict = expected['context']
            mock_crew.tasks[2].output.json_dict = expected['query']
            
            with patch('backend.agents.crew_config.create_crew', return_value=mock_crew):
                result = parser_agent.execute(query)
                assert result['intent'] == expected['parser']['intent']

def test_context_agent_scenarios(mock_crew_manager):
    context_agent = ContextAgent()
    
    with patch('backend.agents.context_agent.crew_manager', mock_crew_manager):
        for query, expected in SCENARIOS.items():
            mock_crew = MagicMock()
            mock_crew.tasks = [MagicMock(), MagicMock(), MagicMock()]
            mock_crew.tasks[0].output.json_dict = expected['parser']
            mock_crew.tasks[1].output.json_dict = expected['context']
            mock_crew.tasks[2].output.json_dict = expected['query']
            
            with patch('backend.agents.crew_config.create_crew', return_value=mock_crew):
                # This will run the crew once
                mock_crew_manager.get_parser_result(query)
                result = context_agent.execute(expected['parser'])
                assert set(result['sources']) == set(expected['context']['sources'])

def test_query_builder_scenarios(mock_crew_manager):
    query_builder = QueryBuilderAgent()
    # Correcting the patch path to the actual module where crew_manager is used
    with patch('backend.agents.query_agent.crew_manager', mock_crew_manager):
        for query, expected in SCENARIOS.items():
            mock_crew = MagicMock()
            mock_crew.tasks = [MagicMock(), MagicMock(), MagicMock()]
            mock_crew.tasks[0].output.json_dict = expected['parser']
            mock_crew.tasks[1].output.json_dict = expected['context']
            mock_crew.tasks[2].output.json_dict = expected['query']
            
            with patch('backend.agents.crew_config.create_crew', return_value=mock_crew):
                mock_crew_manager.get_parser_result(query)
                result = query_builder.execute(expected['context'], expected['parser'])
                assert "SELECT" in result.upper()

def test_caching_logic(mock_crew_manager):
    """Verify that multiple calls for the same query only trigger the run once."""
    query = "Find deals silent > 7 days"
    expected = SCENARIOS[query]
    
    mock_crew = MagicMock()
    mock_crew.tasks = [MagicMock(), MagicMock(), MagicMock()]
    # Set return values for individual tasks
    mock_crew.tasks[0].output.dict.return_value = expected['parser']
    mock_crew.tasks[1].output.dict.return_value = expected['context']
    mock_crew.tasks[2].output.dict.return_value = expected['query']

    with patch('backend.agents.crew_config.create_crew', return_value=mock_crew) as mock_create:
        # Multiple calls for the same query
        mock_crew_manager.get_parser_result(query)
        mock_crew_manager.get_context_result({}, query)
        mock_crew_manager.get_query_result({}, {}, query)
        
        # Should only be called once
        assert mock_create.call_count == 1
