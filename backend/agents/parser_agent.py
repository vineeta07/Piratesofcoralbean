from backend.agents.mock_claude import MockClaudeService

class ParserAgent:
    def execute(self, query: str) -> dict:
        """
        Parses the natural language query into a structured intent.
        """
        return MockClaudeService.parse_intent(query)

parser_agent = ParserAgent()
