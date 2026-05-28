from backend.agents.mock_claude import MockClaudeService

class SummarisingAgent:
    def execute(self, scored_deals: list[dict]) -> list[dict]:
        """
        Generates a human-readable narrative and recommended action for each deal.
        """
        summarized_deals = []
        for deal in scored_deals:
            summary = MockClaudeService.summarize_deal(deal)
            summarized_deals.append(summary)
        return summarized_deals

summarising_agent = SummarisingAgent()
