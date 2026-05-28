from backend.outputs.dashboard_json import DashboardJson
from backend.outputs.slack_digest import SlackDigest

class FormatterAgent:
    def execute(self, summaries: list[dict]) -> dict:
        """
        Formats the summaries into the final Dashboard JSON and Slack JSON.
        """
        dashboard_json = DashboardJson.format(summaries)
        slack_json = SlackDigest.format(summaries)
        
        return {
            "success": True,
            "dashboard": dashboard_json,
            "slack": slack_json
        }

formatter_agent = FormatterAgent()
