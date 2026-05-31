import pandas as pd
import numpy as np
from risk_scoring_agent import score_deal
from datetime import date
import os


def load_and_score_deals(data_dir: str) -> list[dict]:
    # Load all 5 CSVs
    sf    = pd.read_csv(f"{data_dir}/salesforce_deals.csv")
    gmail = pd.read_csv(f"{data_dir}/gmail_threads.csv")
    gong  = pd.read_csv(f"{data_dir}/gong_calls.csv")
    slack = pd.read_csv(f"{data_dir}/slack_messages.csv")
    li    = pd.read_csv(f"{data_dir}/linkedin_profiles.csv")
    print(f"Looking for calendar file at: {data_dir}/calendar_events.csv")
    print(f"Files found: {os.listdir(data_dir)}")
    cal = pd.read_csv(f"{data_dir}/calendar_events.csv")

# Latest next_meeting_date per deal
    cal_latest = (
        cal.sort_values("event_date", ascending=False)
        .groupby("deal_id")
        .first()
        .reset_index()[["deal_id", "next_meeting_date"]]
    )

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

    # Aggregate unique contacts across all sources
    gmail_contacts = gmail.groupby("deal_id")["contact_email"].unique().reset_index()
    gong_contacts = gong.groupby("deal_id")["contact_name"].unique().reset_index()

    # Get latest gmail thread info per deal to preserve status columns
    gmail_latest = (
        gmail.sort_values("last_email_sent", ascending=False)
             .groupby("deal_id").first().reset_index()
    )

    # Join everything on deal_id
    df = sf.merge(gmail_latest,      on="deal_id", how="left")
    df = df.merge(gmail_contacts,    on="deal_id", how="left", suffixes=("", "_list"))
    df = df.merge(gong_contacts,     on="deal_id", how="left")
    df = df.merge(gong_latest,       on="deal_id", how="left", suffixes=("", "_latest"))
    df = df.merge(slack_comp_count,  on="deal_id", how="left")
    df = df.merge(slack_comp_name,   on="deal_id", how="left")
    df = df.merge(li_job,            on="deal_id", how="left")
    df = df.merge(cal_latest,        on="deal_id", how="left")
    df["next_meeting_date"] = df["next_meeting_date"].fillna("")
    today = date.today()

    df["contact_email_list"] = df["contact_email_list"].apply(lambda x: x if isinstance(x, (list, pd.Series, set, np.ndarray)) else [])
    df["contact_name"] = df["contact_name"].apply(lambda x: x if isinstance(x, (list, pd.Series, set, np.ndarray)) else [])

    df["competitor_mentions_today"] = df["competitor_mentions_today"].fillna(0).astype(int)
    df["competitor_name"]           = df["competitor_name"].fillna("")
    df["changed_jobs_date"]         = df["changed_jobs_date"].fillna("")
    df["sentiment_score"]           = df["sentiment_score"].fillna(50).astype(int)
    df["objections_count"]          = df["objections_count"].fillna(0).astype(int)
    df["economic_buyer_attended"]   = df["economic_buyer_attended"].fillna(False)
    df["contract_sent_date"] = pd.to_datetime(df["contract_sent_date"], errors="coerce")
    df["legal_days_waiting"] = df["contract_sent_date"].apply(lambda x: (today - x.date()).days if pd.notna(x) else 0)
    df["days_silent"] = df["days_silent"].fillna(0).astype(int)
    df["has_legal"] = df["has_legal"].fillna(False)

    # Build deals list in risk_scoring_agent format
    deals = []
    for _, row in df.iterrows():
        # Combine all unique contact identifiers (names and emails)
        all_contacts = set()
        if pd.notna(row["champion_name"]): all_contacts.add(str(row["champion_name"]).strip())
        if pd.notna(row["economic_buyer"]): all_contacts.add(str(row["economic_buyer"]).strip())
        
        for email in row["contact_email_list"]:
            if pd.notna(email): all_contacts.add(str(email).strip())
        for name in row["contact_name"]:
            if pd.notna(name): all_contacts.add(str(name).strip())
        
        contacts_count = len(all_contacts)

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
            "contacts_count":             contacts_count,
            "next_meeting_date": str(row["next_meeting_date"]),
        })

    # Score and sort: most urgent first
    scored = [score_deal(d) for d in deals]
    scored.sort(key=lambda d: (d["score"], -d["value"]))
    return scored