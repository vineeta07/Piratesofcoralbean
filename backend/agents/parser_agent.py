from backend.agents.crew_config import crew_manager

class ParserAgent:
    def execute(self, query: str) -> dict:
        """
        Parses the natural language query into a structured intent using CrewAI.
        """
        return crew_manager.get_parser_result(query)

parser_agent = ParserAgent()
