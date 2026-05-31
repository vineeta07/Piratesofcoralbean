import csv
import os
from datetime import datetime, timedelta

mock_dir = os.path.join(os.path.dirname(__file__), "coral/mock_data")
os.makedirs(mock_dir, exist_ok=True)

# 10 Deals (3 Red, 3 Amber, 4 Green)
deals = [
    # Red Deals (Single-threaded)
    {"deal_id": "deal_001", "deal_name": "Acme Corp", "value": 340000, "stage": "Negotiation", "owner": "Alice Smith", "close_date": "2024-06-15", "champion_name": "Sarah Chen", "economic_buyer": "Sarah Chen"},
    {"deal_id": "deal_002", "deal_name": "Globex Inc", "value": 180000, "stage": "Proposal", "owner": "Bob Jones", "close_date": "2024-06-20", "champion_name": "Mike Ross", "economic_buyer": "Mike Ross"},
    {"deal_id": "deal_003", "deal_name": "Initech", "value": 450000, "stage": "Contract Review", "owner": "Charlie Day", "close_date": "2024-05-30", "champion_name": "Peter Gibbons", "economic_buyer": "Peter Gibbons"},
    # Amber Deals
    {"deal_id": "deal_004", "deal_name": "Umbrella Corp", "value": 650000, "stage": "Discovery", "owner": "Alice Smith", "close_date": "2024-07-10", "champion_name": "Alice Abernathy", "economic_buyer": "Albert Wesker"},
    {"deal_id": "deal_005", "deal_name": "Stark Ind", "value": 850000, "stage": "Negotiation", "owner": "Bob Jones", "close_date": "2024-06-05", "champion_name": "Pepper Potts", "economic_buyer": "Tony Stark"},
    {"deal_id": "deal_006", "deal_name": "Wayne Ent", "value": 500000, "stage": "Proposal", "owner": "Charlie Day", "close_date": "2024-06-25", "champion_name": "Lucius Fox", "economic_buyer": "Bruce Wayne"},
    # Green Deals (Multi-threaded)
    {"deal_id": "deal_007", "deal_name": "Oscorp", "value": 250000, "stage": "Late Stage", "owner": "Alice Smith", "close_date": "2024-05-25", "champion_name": "Norman Osborn", "economic_buyer": "Harry Osborn"},
    {"deal_id": "deal_008", "deal_name": "Massive Dynamic", "value": 720000, "stage": "Contract Review", "owner": "Bob Jones", "close_date": "2024-05-28", "champion_name": "Nina Sharp", "economic_buyer": "William Bell"},
    {"deal_id": "deal_009", "deal_name": "Cyberdyne", "value": 900000, "stage": "Negotiation", "owner": "Charlie Day", "close_date": "2024-06-10", "champion_name": "Miles Dyson", "economic_buyer": "John Connor"},
    {"deal_id": "deal_010", "deal_name": "Hooli", "value": 120000, "stage": "Late Stage", "owner": "Alice Smith", "close_date": "2024-05-22", "champion_name": "Richard Hendricks", "economic_buyer": "Gavin Belson"},
]

gmail = [
    # email_id, deal_id, contact_email, last_email_sent, last_reply_from_prospect, days_silent, thread_length, has_legal, contract_sent_date
    ["em_01", "deal_001", "sarah@acme.com", "2024-05-16", "2024-05-04", 12, 5, False, ""], 
    ["em_02", "deal_002", "mike@globex.com", "2024-05-20", "2024-05-10", 10, 3, False, ""], 
    ["em_03", "deal_003", "peter@initech.com", "2024-05-25", "2024-05-17", 8, 8, True, "2024-05-15"], 
    
    ["em_04", "deal_004", "alice@umbrella.com", "2024-05-26", "2024-05-21", 5, 2, False, ""], 
    ["em_05", "deal_005", "pepper@stark.com", "2024-05-27", "2024-05-23", 4, 12, True, ""], 
    ["em_06", "deal_006", "lucius@wayne.com", "2024-05-25", "2024-05-19", 6, 7, False, "2024-05-18"], 
    
    ["em_07", "deal_007", "norman@oscorp.com", "2024-05-28", "2024-05-27", 1, 15, True, "2024-05-25"], 
    ["em_07b", "deal_007", "harry@oscorp.com", "2024-05-28", "2024-05-28", 0, 5, False, ""], # Multi-threaded
    
    ["em_08", "deal_008", "nina@massive.com", "2024-05-28", "2024-05-28", 0, 22, True, "2024-05-20"], 
    ["em_08b", "deal_008", "william@massive.com", "2024-05-27", "2024-05-27", 1, 10, False, ""], # Multi-threaded
    
    ["em_09", "deal_009", "miles@cyberdyne.com", "2024-05-27", "2024-05-26", 1, 9, True, "2024-05-24"], 
    ["em_09b", "deal_009", "john@cyberdyne.com", "2024-05-28", "2024-05-28", 0, 4, False, ""], # Multi-threaded
    
    ["em_10", "deal_010", "richard@hooli.com", "2024-05-28", "2024-05-27", 1, 4, True, "2024-05-21"], 
    ["em_10b", "deal_010", "gavin@hooli.com", "2024-05-27", "2024-05-27", 1, 2, False, ""], 
    ["em_10c", "deal_010", "erlich@hooli.com", "2024-05-28", "2024-05-28", 0, 8, False, ""], 
    ["em_10d", "deal_010", "jared@hooli.com", "2024-05-28", "2024-05-28", 0, 12, False, ""], # Strongly Multi-threaded (4+)
]

gong = [
    # call_id, deal_id, contact_name, call_date, duration_min, sentiment_score, objections_count, economic_buyer_attended
    ["call_01", "deal_001", "Sarah Chen", "2024-05-10", 45, 40, 3, False], 
    ["call_02", "deal_002", "Mike Ross", "2024-05-12", 30, 50, 2, False], 
    ["call_03", "deal_003", "Peter Gibbons", "2024-05-15", 60, 45, 4, False], 
    
    ["call_04", "deal_004", "Alice Abernathy", "2024-05-20", 45, 65, 2, False], 
    ["call_05", "deal_005", "Pepper Potts", "2024-05-22", 60, 75, 1, False], 
    ["call_06", "deal_006", "Lucius Fox", "2024-05-18", 30, 60, 3, True], 
    
    ["call_07", "deal_007", "Norman Osborn", "2024-05-26", 45, 85, 0, True], 
    ["call_08", "deal_008", "Nina Sharp", "2024-05-27", 60, 90, 0, True], 
    ["call_09", "deal_009", "Miles Dyson", "2024-05-25", 45, 88, 1, True], 
    ["call_10", "deal_010", "Richard Hendricks", "2024-05-27", 30, 95, 0, True], 
    ["call_10b", "deal_010", "Erlich Bachman", "2024-05-28", 45, 90, 0, False], 
]

slack = [
    # message_id, deal_id, channel, timestamp, sentiment, mentions_competitor, escalation_flag, content_summary
    ["msg_01", "deal_001", "#deal-acme", "2024-05-17T10:00:00", "negative", True, False, "Competitor XYZ mentioned in pricing discussion"], # RED
    ["msg_02", "deal_002", "#deal-globex", "2024-05-21T11:00:00", "neutral", True, False, "Checking if we can match competitor features"], # RED
    ["msg_03", "deal_003", "#deal-initech", "2024-05-26T09:00:00", "negative", False, True, "Legal delayed the review by 7 days"], # RED
    
    ["msg_04", "deal_004", "#deal-umbrella", "2024-05-22T14:00:00", "neutral", False, False, "Follow up needed on security questionnaire"], # AMBER
    ["msg_05", "deal_005", "#deal-stark", "2024-05-25T15:00:00", "neutral", True, False, "They are evaluating one other vendor"], # AMBER
    ["msg_06", "deal_006", "#deal-wayne", "2024-05-23T16:00:00", "negative", False, False, "Budget might be tighter than expected"], # AMBER
    
    ["msg_07", "deal_007", "#deal-oscorp", "2024-05-28T10:00:00", "positive", False, False, "Verbal approval received"], # GREEN
    ["msg_08", "deal_008", "#deal-massive", "2024-05-28T11:00:00", "positive", False, False, "Contract signed by economic buyer"], # GREEN
    ["msg_09", "deal_009", "#deal-cyberdyne", "2024-05-27T14:00:00", "positive", False, False, "Security review passed"], # GREEN
    ["msg_10", "deal_010", "#deal-hooli", "2024-05-28T16:00:00", "positive", False, False, "Implementation kick-off scheduled"], # GREEN
]

linkedin = [
    # profile_id, deal_id, person_name, current_company, current_role, changed_jobs_date, previous_company, hired_recently
    ["prof_01", "deal_001", "Sarah Chen", "Microsoft", "VP Sales", "2024-05-10", "Acme Corp", True], # RED - Champion left
    ["prof_02", "deal_002", "Mike Ross", "Globex Inc", "Director IT", "", "Pearson Specter", False],
    ["prof_03", "deal_003", "Peter Gibbons", "Initech", "Software Engineer", "", "", False],
    
    ["prof_04", "deal_004", "Alice Abernathy", "Umbrella Corp", "Head of Security", "", "", False],
    ["prof_05", "deal_005", "Pepper Potts", "Stark Ind", "CEO", "", "", False],
    ["prof_06", "deal_006", "Lucius Fox", "Wayne Ent", "CTO", "", "", False],
    
    ["prof_07", "deal_007", "Norman Osborn", "Oscorp", "CEO", "", "", False],
    ["prof_08", "deal_008", "Nina Sharp", "Massive Dynamic", "COO", "", "", False],
    ["prof_09", "deal_009", "Miles Dyson", "Cyberdyne", "Director AI", "", "", False],
    ["prof_10", "deal_010", "Richard Hendricks", "Hooli", "Engineer", "", "", False],
]

def write_csv(filename, headers, rows):
    with open(f"{mock_dir}/{filename}", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        if rows and isinstance(rows[0], dict):
            for row in rows:
                writer.writerow([row.get(h, "") for h in headers])
        else:
            writer.writerows(rows)

write_csv("salesforce_deals.csv", ["deal_id", "deal_name", "value", "stage", "owner", "close_date", "champion_name", "economic_buyer"], deals)
write_csv("gmail_threads.csv", ["email_id", "deal_id", "contact_email", "last_email_sent", "last_reply_from_prospect", "days_silent", "thread_length", "has_legal", "contract_sent_date"], gmail)
write_csv("gong_calls.csv", ["call_id", "deal_id", "contact_name", "call_date", "duration_min", "sentiment_score", "objections_count", "economic_buyer_attended"], gong)
write_csv("slack_messages.csv", ["message_id", "deal_id", "channel", "timestamp", "sentiment", "mentions_competitor", "escalation_flag", "content_summary"], slack)
write_csv("linkedin_profiles.csv", ["profile_id", "deal_id", "person_name", "current_company", "current_role", "changed_jobs_date", "previous_company", "hired_recently"], linkedin)

print("Mock CSV data generated successfully.")
