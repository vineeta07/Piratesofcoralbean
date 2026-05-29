from backend.agents.crew_config import crew_manager

class ContextAgent:
    def execute(self, intent_data: dict) -> dict:
        """
        Decides which sources are needed for this specific question using CrewAI.
        """
        return crew_manager.get_context_result(intent_data)

context_agent = ContextAgent()
