import pandas as pd
from risk_scoring_agent import score_deal
from datetime import date


def load_and_score_deals(data_dir: str) -> list[dict]:
    # Load all 5 CSVs
    sf    = pd.read_csv(f"{data_dir}/salesforce_deals.csv")
    gmail = pd.read_csv(f"{data_dir}/gmail_threads.csv")
    gong  = pd.read_csv(f"{data_dir}/gong_calls.csv")
    slack = pd.read_csv(f"{data_dir}/slack_messages.csv")
    li    = pd.read_csv(f"{data_dir}/linkedin_profiles.csv")

    # Latest gong call per deal only
    gong_latest = (
        gong.sort_values("call_date", ascending=False)
            .groupby("deal_id").first().reset_index()
    )

    # Count competitor mentions per deal from slack
    slack_comp_count = (
        slack[slack["mentions_competitor"] == True]
            .groupby("deal_id").size()
            .reset_index(name="competitor_mentions_today")
    )

    # Get competitor name from content_summary where mentioned
    slack_comp_name = (
        slack[slack["mentions_competitor"] == True]
            .groupby("deal_id")["content_summary"]
            .first().reset_index(name="competitor_name")
    )

    # Champion changed jobs from linkedin
    li_job = li[["deal_id", "changed_jobs_date", "hired_recently"]].copy()

    # Join everything on deal_id
    df = sf.merge(gmail,           on="deal_id", how="left")
    df = df.merge(gong_latest,     on="deal_id", how="left")
    df = df.merge(slack_comp_count, on="deal_id", how="left")
    df = df.merge(slack_comp_name,  on="deal_id", how="left")
    df = df.merge(li_job,           on="deal_id", how="left")
    today = date.today()

    df["competitor_mentions_today"] = df["competitor_mentions_today"].fillna(0).astype(int)
    df["competitor_name"]           = df["competitor_name"].fillna("")
    df["changed_jobs_date"]         = df["changed_jobs_date"].fillna("")
    df["sentiment_score"]           = df["sentiment_score"].fillna(50).astype(int)
    df["objections_count"]          = df["objections_count"].fillna(0).astype(int)
    df["economic_buyer_attended"]   = df["economic_buyer_attended"].fillna(False)
    df["contract_sent_date"] = pd.to_datetime(df["contract_sent_date"], errors="coerce")
    df["legal_days_waiting"] = df["contract_sent_date"].apply(lambda x: (today - x.date()).days if pd.notna(x) else 0)

    # Build deals list in risk_scoring_agent format
    deals = []
    for _, row in df.iterrows():
        # Build unresolved_objections from objections_count
        objections = []
        for i in range(int(row["objections_count"])):
            objections.append({"type": "value", "detail": f"Objection {i+1} from Gong call"})

        deals.append({
            "deal_name":                  row["deal_name"],
            "value":                      int(row["value"]),
            "close_date":                 str(row["close_date"]),
            "days_email_silent":          int(row["days_silent"]),
            "unanswered_followup_emails": 0,      # not in CSVs
            "champion_name":              row["champion_name"],
            "champion_changed_jobs":      bool(row["changed_jobs_date"]),
            "company_hiring_freeze":      bool(row.get("hired_recently", False)),
            "gong_sentiment_score":       int(row["sentiment_score"]),
            "unresolved_objections":      objections,
            "economic_buyer_on_call":     bool(row["economic_buyer_attended"]),
            "legal_contract_sent":        bool(row["has_legal"]),
            "legal_days_waiting": int(row["legal_days_waiting"]),
            "legal_status":               "pending",
            "competitor_mentions_today":  int(row["competitor_mentions_today"]),
            "competitor_name":            str(row["competitor_name"]),
        })

    # Score and sort: most urgent first
    scored = [score_deal(d) for d in deals]
    scored.sort(key=lambda d: (d["score"], -d["value"]))
    return scored