import subprocess
import json
import logging
import os
import pandas as pd
from datetime import date

# Resolve project root (two levels up from this file: backend/coral/ -> project root)
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_CORAL_EXE = os.path.join(_PROJECT_ROOT, "coral", "coral.exe")
_MOCK_DATA_DIR = os.path.join(os.path.dirname(__file__), "mock_data")

logger = logging.getLogger(__name__)


class CoralDataLoader:
    def __init__(self):
        self._cache = None

    def execute_query(self, sql_string: str) -> list[dict]:
        """Executes a SQL query against the Coral CLI. Falls back to CSV mock data if Coral is unavailable."""
        # Try the real Coral CLI first
        try:
            coral_path = _CORAL_EXE if os.path.isfile(_CORAL_EXE) else "coral"
            logger.info(f"Attempting Coral CLI at: {coral_path}")

            result = subprocess.run(
                [coral_path, "sql", "--format", "json", sql_string],
                capture_output=True,
                text=True,
                check=True,
                timeout=15,
            )

            data = json.loads(result.stdout)
            return data

        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError) as e:
            logger.warning(f"Coral CLI unavailable ({type(e).__name__}: {e}). Falling back to CSV mock data.")

        # ── Fallback: load and join mock CSVs to simulate the Coral query ──
        return self._load_from_csvs()

    def _load_from_csvs(self) -> list[dict]:
        """Loads deal data from CSV files in mock_data/ and returns it as a list of dicts."""
        if self._cache is not None:
            return self._cache

        data_dir = _MOCK_DATA_DIR
        if not os.path.isdir(data_dir):
            raise FileNotFoundError(
                f"Neither Coral CLI nor mock data directory found. Expected CSVs at: {data_dir}"
            )

        logger.info(f"Loading mock data from: {data_dir}")

        sf = pd.read_csv(os.path.join(data_dir, "salesforce_deals.csv"))
        gmail = pd.read_csv(os.path.join(data_dir, "gmail_threads.csv"))
        gong = pd.read_csv(os.path.join(data_dir, "gong_calls.csv"))
        slack = pd.read_csv(os.path.join(data_dir, "slack_messages.csv"))
        li = pd.read_csv(os.path.join(data_dir, "linkedin_profiles.csv"))

        # Latest gmail thread per deal
        gmail_latest = (
            gmail.sort_values("last_email_sent", ascending=False)
                 .groupby("deal_id").first().reset_index()
        )

        # Latest gong call per deal
        gong_latest = (
            gong.sort_values("call_date", ascending=False)
                .groupby("deal_id").first().reset_index()
        )

        # Competitor mentions from slack
        slack_comp = (
            slack[slack["mentions_competitor"] == True]
                .groupby("deal_id")
                .agg(
                    competitor_mentions_today=("mentions_competitor", "size"),
                    escalation_flag=("escalation_flag", "first"),
                )
                .reset_index()
        )

        # LinkedIn info
        li_info = li[["deal_id", "changed_jobs_date", "hired_recently"]].copy()

        # Join everything on deal_id
        df = sf.merge(gmail_latest, on="deal_id", how="left", suffixes=("", "_gm"))
        df = df.merge(gong_latest, on="deal_id", how="left", suffixes=("", "_g"))
        df = df.merge(slack_comp, on="deal_id", how="left")
        df = df.merge(li_info, on="deal_id", how="left")

        # Fill NaN values
        df["days_silent"] = df["days_silent"].fillna(0).astype(int)
        df["has_legal"] = df["has_legal"].fillna(False)
        df["sentiment_score"] = df["sentiment_score"].fillna(50).astype(int)
        df["objections_count"] = df["objections_count"].fillna(0).astype(int)
        df["economic_buyer_attended"] = df["economic_buyer_attended"].fillna(False)
        df["mentions_competitor"] = df.get("competitor_mentions_today", pd.Series(dtype=int)).fillna(0).astype(int)
        df["escalation_flag"] = df["escalation_flag"].fillna(False)
        df["hired_recently"] = df["hired_recently"].fillna(False)
        df["changed_jobs_date"] = df["changed_jobs_date"].fillna("")

        # Build output list matching the columns the pipeline expects
        records = []
        for _, row in df.iterrows():
            records.append({
                "deal_id": row.get("deal_id", ""),
                "deal_name": row.get("deal_name", "Unknown"),
                "value": int(row.get("value", 0)),
                "stage": row.get("stage", ""),
                "owner": row.get("owner", ""),
                "close_date": str(row.get("close_date", "")),
                "champion_name": row.get("champion_name", "Unknown"),
                "economic_buyer": row.get("economic_buyer", ""),
                "days_silent": int(row["days_silent"]),
                "has_legal": bool(row["has_legal"]),
                "contract_sent_date": str(row.get("contract_sent_date", "")),
                "sentiment_score": int(row["sentiment_score"]),
                "objections_count": int(row["objections_count"]),
                "economic_buyer_attended": bool(row["economic_buyer_attended"]),
                "mentions_competitor": int(row["mentions_competitor"]),
                "escalation_flag": bool(row["escalation_flag"]),
                "hired_recently": bool(row["hired_recently"]),
                "changed_jobs_date": str(row["changed_jobs_date"]),
            })

        self._cache = records
        return records


# Singleton instance for the app
coral_client = CoralDataLoader()
