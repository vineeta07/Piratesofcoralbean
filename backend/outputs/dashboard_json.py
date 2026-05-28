class DashboardJson:
    @staticmethod
    def format(summaries: list[dict]) -> dict:
        red_count = sum(1 for d in summaries if d["risk_level"] == "red")
        amber_count = sum(1 for d in summaries if d["risk_level"] == "amber")
        green_count = sum(1 for d in summaries if d["risk_level"] == "green")
        
        # Dashboard expects exactly this structure
        return {
            "deals": summaries,
            "summary": {
                "total_deals": len(summaries),
                "red_count": red_count,
                "amber_count": amber_count,
                "green_count": green_count
            }
        }
