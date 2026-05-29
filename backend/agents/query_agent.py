from backend.agents.crew_config import crew_manager

class QueryBuilderAgent:
    def execute(self, context_data: dict, intent_data: dict) -> str:
        """
        Translates intent and context into valid Coral SQL using CrewAI.
        """
        return crew_manager.get_query_result(context_data, intent_data)

query_builder = QueryBuilderAgent()
