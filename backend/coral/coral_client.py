import pandas as pd
import os

class CoralDataLoader:
    def __init__(self, data_dir: str = "backend/coral/mock_data"):
        self.data_dir = data_dir
        self._cache = None

    def load_and_join(self) -> list[dict]:
        """Loads the 5 CSV files, joins them on deal_id, and returns a list of dictionaries."""
        if self._cache is not None:
            return self._cache

        # Load dataframes
        df_sales = pd.read_csv(os.path.join(self.data_dir, "salesforce_deals.csv"))
        df_gmail = pd.read_csv(os.path.join(self.data_dir, "gmail_threads.csv"))
        df_gong = pd.read_csv(os.path.join(self.data_dir, "gong_calls.csv"))
        df_slack = pd.read_csv(os.path.join(self.data_dir, "slack_messages.csv"))
        df_linkedin = pd.read_csv(os.path.join(self.data_dir, "linkedin_profiles.csv"))

        # Simulated SQL Joins
        # Join salesforce with gmail on deal_id
        merged = pd.merge(df_sales, df_gmail, on="deal_id", how="left")
        
        # Join with gong
        merged = pd.merge(merged, df_gong, on="deal_id", how="left")
        
        # Join with slack
        merged = pd.merge(merged, df_slack, on="deal_id", how="left")
        
        # Join with linkedin
        merged = pd.merge(merged, df_linkedin, on="deal_id", how="left")

        # Convert NaN to None for JSON serialization
        merged = merged.where(pd.notnull(merged), None)
        
        results = merged.to_dict(orient="records")
        self._cache = results
        
        return results

# Singleton instance for the app
coral_client = CoralDataLoader()
