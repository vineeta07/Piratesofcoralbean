import csv
import os
import random
import uuid
from datetime import datetime, timedelta

def get_random_date(start_date: datetime, end_date: datetime):
    delta = end_date - start_date
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    return start_date + timedelta(seconds=random_second)

def generate_mock_data():
    num_deals = 15
    now = datetime(2026, 5, 1)
    end_date = datetime(2026, 7, 31)
    
    # 1. Salesforce Deals
    companies = ["Stark Industries", "Wayne Enterprises", "Acme Corp", "Initech", "Globex", "Hooli", "Soylent", "Massive Dynamic", "Oscorp", "Cyberdyne"]
    first_names = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Heidi"]
    last_names = ["Smith", "Doe", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson"]
    
    deals = []
    for i in range(num_deals):
        deal_id = f"DEAL-{1000+i}"
        company = random.choice(companies) + f" {i}"
        deal_name = f"{company} - Enterprise License"
        value = random.randint(50000, 1000000)
        stage = random.choice(["Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"])
        close_date = get_random_date(now, end_date).strftime("%Y-%m-%d")
        is_healthy = (i % 5 < 3)  # 60% of deals are healthy (0, 1, 2 out of 0, 1, 2, 3, 4)
        
        deals.append({
            "deal_id": f"DEAL-100{i}",
            "deal_name": f"{random.choice(companies)} {i} - Enterprise License",
            "value": value,
            "stage": random.choice(["Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]),
            "owner": "vinita.sales@coralbean.com",
            "close_date": close_date,
            "champion_name": f"{random.choice(first_names)} {random.choice(last_names)}",
            "economic_buyer": f"{random.choice(first_names)} {random.choice(last_names)}",
            "contact_email": f"contact{i}@example.com",
            "company": random.choice(companies),
            # internal fields for other tables
            "days_silent": random.randint(0, 3) if is_healthy else random.randint(0, 30),
            "sentiment_score": random.randint(80, 95) if is_healthy else random.randint(30, 85),
            "economic_buyer_attended": True if is_healthy else random.choice([True, False]),
            "has_legal": False if is_healthy else random.choice([True, False]),
            "hired_recently": False if is_healthy else random.choice([True, False]),
            "mentions_competitor": False if is_healthy else random.choice([True, False]),
            "is_healthy_flag": is_healthy
        })

    # write salesforce deals
    os.makedirs("backend/coral/mock_data", exist_ok=True)
    with open("backend/coral/mock_data/salesforce_deals.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["deal_id", "deal_name", "value", "stage", "owner", "close_date", "champion_name", "economic_buyer", "contact_email"])
        writer.writeheader()
        for d in deals:
            writer.writerow({k: d[k] for k in ["deal_id", "deal_name", "value", "stage", "owner", "close_date", "champion_name", "economic_buyer", "contact_email"]})

    # 2. Gmail Threads
    with open("backend/coral/mock_data/gmail_threads.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["email_id", "deal_id", "contact_email", "last_email_sent", "last_reply_from_prospect", "days_silent", "thread_length", "has_legal", "contract_sent_date"])
        writer.writeheader()
        for d in deals:
            is_healthy = d.get("is_healthy_flag", False)
            days_silent = random.randint(0, 3) if is_healthy else random.randint(0, 30)
            last_reply = (datetime(2026, 5, 31) - timedelta(days=days_silent)).strftime("%Y-%m-%d")
            writer.writerow({
                "email_id": f"MSG-{uuid.uuid4().hex[:8]}",
                "deal_id": d["deal_id"],
                "contact_email": d["contact_email"],
                "last_email_sent": (datetime(2026, 5, 31) - timedelta(days=random.randint(0, 5))).strftime("%Y-%m-%d"),
                "last_reply_from_prospect": last_reply,
                "days_silent": days_silent,
                "thread_length": random.randint(2, 50),
                "has_legal": random.choice([True, False]),
                "contract_sent_date": (datetime(2026, 5, 1) - timedelta(days=random.randint(1, 15))).strftime("%Y-%m-%d") if random.choice([True, False]) else ""
            })

    # 3. Gong Calls
    with open("backend/coral/mock_data/gong_calls.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["call_id", "deal_id", "contact_name", "call_date", "duration_min", "sentiment_score", "objections_count", "economic_buyer_attended"])
        writer.writeheader()
        for d in deals:
            is_healthy = d.get("is_healthy_flag", False)
            for _ in range(random.randint(1, 4)):
                writer.writerow({
                    "call_id": f"CALL-{uuid.uuid4().hex[:8]}",
                    "deal_id": d["deal_id"],
                    "contact_name": d["champion_name"],
                    "call_date": (datetime(2026, 5, 31) - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d"),
                    "duration_min": random.randint(15, 60),
                    "sentiment_score": random.randint(80, 95) if is_healthy else random.randint(30, 95),
                    "objections_count": random.randint(0, 1) if is_healthy else random.randint(0, 5),
                    "economic_buyer_attended": True if is_healthy else random.choice([True, False])
                })

    # 4. Slack Messages
    with open("backend/coral/mock_data/slack_messages.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["message_id", "deal_id", "channel", "timestamp", "sentiment", "mentions_competitor", "escalation_flag", "content_summary"])
        writer.writeheader()
        for d in deals:
            is_healthy = d.get("is_healthy_flag", False)
            for _ in range(random.randint(2, 10)):
                writer.writerow({
                    "message_id": f"SLK-{uuid.uuid4().hex[:8]}",
                    "deal_id": d["deal_id"],
                    "channel": "#sales-updates",
                    "timestamp": (datetime(2026, 5, 31) - timedelta(days=random.randint(0, 10))).isoformat(),
                    "sentiment": "positive" if is_healthy else random.choice(["positive", "neutral", "negative"]),
                    "mentions_competitor": False if is_healthy else random.choice([True, False, False, False]),
                    "escalation_flag": False if is_healthy else random.choice([True, False, False, False, False]),
                    "content_summary": f"Discussion regarding {d['deal_name']}"
                })

    # 5. LinkedIn Profiles
    with open("backend/coral/mock_data/linkedin_profiles.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["profile_id", "deal_id", "person_name", "current_company", "current_role", "changed_jobs_date", "previous_company", "hired_recently"])
        writer.writeheader()
        for d in deals:
            hired = random.choice([True, False, False])
            writer.writerow({
                "profile_id": f"LNK-{uuid.uuid4().hex[:8]}",
                "deal_id": d["deal_id"],
                "person_name": d["champion_name"],
                "current_company": d["company"],
                "current_role": "VP of Engineering",
                "changed_jobs_date": (datetime(2026, 5, 1) - timedelta(days=random.randint(1, 60))).strftime("%Y-%m-%d") if hired else "",
                "previous_company": "Some Other Corp",
                "hired_recently": hired
            })

    # 6. Notion Search
    with open("backend/coral/mock_data/notion_search.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "url", "raw", "properties"])
        writer.writeheader()
        for d in deals:
            is_healthy = d.get("is_healthy_flag", False)
            has_doc = True if is_healthy else random.choice([True, False, False])
            if has_doc:
                writer.writerow({
                    "id": f"NOTION-{uuid.uuid4().hex[:8]}",
                    "url": f"https://notion.so/{d['deal_name'].replace(' ', '-')}",
                    "raw": "Mock content",
                    "properties": f'{{"title": "{d["deal_name"]} Strategy"}}'
                })

    # 7. Google Calendar Events
    with open("backend/coral/mock_data/google_calendar_events.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "summary", "description", "start_date_time", "end_date_time", "attendees"])
        writer.writeheader()
        for d in deals:
            is_healthy = d.get("is_healthy_flag", False)
            has_meeting = True if is_healthy else random.choice([True, False, False, True])
            if has_meeting:
                writer.writerow({
                    "id": f"CAL-{uuid.uuid4().hex[:8]}",
                    "summary": f"Sync with {d['champion_name']} - {d['company']}",
                    "description": "Discussing next steps",
                    "start_date_time": (datetime(2026, 5, 31) - timedelta(days=random.randint(-5, 10))).isoformat(),
                    "end_date_time": (datetime(2026, 5, 31) - timedelta(days=random.randint(-5, 10))).isoformat(),
                    "attendees": f'{d["contact_email"]},vinita.sales@coralbean.com'
                })

if __name__ == "__main__":
    generate_mock_data()
    print("Mock data generated in backend/coral/mock_data/")
