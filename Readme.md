# DealCortex

**Eliminate CRM Theatre with AI and Coral. DealCortex turns noisy, optimistic pipeline updates into ground-truth deal intelligence by joining Salesforce, Gmail, Gong, Slack, and LinkedIn in real time.**

---

## 🛑 The Real-World Problem: CRM Theatre

Sales reps often log subjective, overly optimistic updates in Salesforce: “Everything is closing.” But the actual risk signals live elsewhere:

- email silence in Gmail
- negative call sentiment in Gong
- competitor mentions in Slack
- champion job changes in LinkedIn
- legal or momentum drops hidden across multiple tools

What makes this dangerous is not just that CRM data is incomplete. It is that the truth is fragmented across invisible silos, while the dashboard looks healthy.

| The Illusion (CRM Data) | The Truth (Siloed Reality)                         |
| ----------------------- | -------------------------------------------------- |
| “Deal is committed”     | Prospect stopped replying 12 days ago              |
| “Forecast looks strong” | Gong transcript shows unresolved objections        |
| “Champion is aligned”   | Champion changed jobs on LinkedIn last week        |
| “Legal is on track”     | Email thread shows redlined contract stalled       |
| “No blockers”           | Slack has competitor mentions and internal concern |

---

## ⚡ The Superpower: Powered by Coral

DealCortex is fundamentally impossible without Coral because the product depends on one thing most stacks cannot do cleanly: **cross-source SQL JOINs over heterogeneous enterprise data**.

Coral lets the backend query multiple operational sources with one SQL-like layer, so the system can correlate CRM records with communication, conversation, and people-data signals in a single analysis pass.

```sql
SELECT
	sf.deal_id,
	sf.deal_name,
	sf.value,
	gm.days_silent,
	g.sentiment_score,
	l.changed_jobs_date,
	l.current_company
FROM salesforce.deals sf
LEFT JOIN gmail.threads gm
	ON sf.deal_id = gm.deal_id
 AND LOWER(SPLIT_PART(sf.contact_email, '@', 2)) = LOWER(SPLIT_PART(gm.contact_email, '@', 2))
LEFT JOIN gong.calls g
	ON sf.deal_id = g.deal_id
LEFT JOIN linkedin.updates l
	ON LOWER(SPLIT_PART(sf.contact_email, '@', 2)) = LOWER(SPLIT_PART(l.email, '@', 2))
WHERE sf.stage IN ('Discovery', 'Proposal', 'Negotiation')
ORDER BY sf.value DESC;
```

That is the core unlock: one query, four sources, one deal truth.

---

## 🤖 The Agentic Pipeline

DealCortex uses a streamlined 4-agent backend flow:

```text
User Query
	 │
	 ├── 1. Routing Agent
	 │     • Parses intent
	 │     • Maps sources and context
	 │
	 ├── 2. Query Agent
	 │     • Converts intent into strict Coral-compatible SQL
	 │     • Uses the schema dictionary and safe table mappings
	 │
	 ├── 3. Risk Scoring Agent
	 │     • Deterministic Python scoring engine
	 │     • Produces exact R / A / G pipeline health
	 │
	 └── 4. Insight & Execution Agent
				 • Writes executive briefs
				 • Generates Slack-ready outputs
				 • Orchestrates autonomous 1-click remediation actions
```

Each agent has a narrow responsibility so the output stays explainable, fast, and judge-friendly.

---

## 🛠️ Tech Stack & Local Infrastructure

**Frontend**

- React
- Next.js
- Tailwind CSS

**Backend & Agents**

- Python
- FastAPI
- Hugging Face / LLM-powered orchestration

**Data Retrieval Layer**

- Coral CLI
- Coral local server

**Storage / Mocking**

- PostgreSQL-compatible mock data layer

**Privacy**

- The entire Coral retrieval layer runs **100% locally on the host machine**, so sensitive enterprise data never needs to leave the environment during analysis.

The frontend calls the backend at `POST /api/analyze`, and the backend returns both the deal dashboard and generated deliverables.

---

## 📦 Installation & Quickstart

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Piratesofcoralbean

# 2. Install Coral CLI globally
npm install -g @coral-ai/cli

# 3. Initialize and serve the local Coral engine
coral init
coral server
coral onboard

# 4. Start the Python backend
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload

# 5. Start the frontend
cd ../frontend
npm install
npm run dev
```

### Environment Notes

- Frontend API base URL: `VITE_API_BASE_URL`
- Default local backend URL: `http://localhost:8080`
- The frontend is wired to the backend through the shared API helper in `frontend/lib/api.ts`

---

## 🎬 The Demo Walkthrough

1. Open the standard CRM view and show the optimistic pipeline story: healthy stages, confident reps, and a deceptively clean dashboard.
2. Flip to the Coral-Powered Agentic View and trigger a live analysis. The UI immediately reveals the hidden signals behind the scenes.
3. Watch deal degradation appear in real time, such as Sarah Chen changing jobs on LinkedIn, silent Gmail threads, or negative Gong sentiment.
4. Show the dashboard, the Slack digest, and the generated executive artifacts.
5. End by opening the DOCX brief or PowerPoint deck from the frontend output panel, then trigger the human-in-the-loop Slack escalation or auto-drafted outreach.

### What the frontend now shows

- deal risk cards with Red / Amber / Green scoring
- the generated SQL inspection panel
- Slack-ready digest blocks
- downloadable DOCX and PPTX outputs from the AI agents

---

## 📁 Project Surface

- Backend API: `backend/main.py`
- Agent orchestration: `backend/pipeline/orchestrator.py`
- Coral integration: `backend/coral/`
- Frontend dashboard: `frontend/components/PipelineDashboard.tsx`
- API bridge: `frontend/lib/api.ts`

---

## Conclusion

DealCortex does not just summarize deals. It reconstructs deal truth from fragmented signals, then turns that truth into action. Judges get a clean story, a credible architecture, and a working demo that produces both insights and deliverables.
