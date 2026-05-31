from backend.agents.crew_config import crew_manager

class QueryBuilderAgent:
    def execute(self, context_data: dict, intent_data: dict) -> str:
        """
        Translates intent and context into valid Coral SQL using CrewAI.
        """
        sql = crew_manager.get_query_result(context_data, intent_data)
        if sql:
            # Fix common LLM SQL hallucinations where it treats table aliases as functions
            sql = sql.replace("sf(", "sf.")
            sql = sql.replace("g(", "g.")
            sql = sql.replace("sl(", "sl.")
            sql = sql.replace("gc(", "gc.")
            sql = sql.replace("n(", "n.")
            sql = sql.replace("l(", "l.")
            # Strip markdown formatting if the LLM adds it
            sql = sql.strip("` \n")
            if sql.lower().startswith("sql\n"):
                sql = sql[4:].strip("` \n")
            elif sql.lower().startswith("sql"):
                sql = sql[3:].strip("` \n")
        return sql

query_builder = QueryBuilderAgent()
