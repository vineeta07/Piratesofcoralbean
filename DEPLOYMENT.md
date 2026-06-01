# Deployment Guide

## Why "Failed to fetch" happens on other devices/Vercel

The error occurs because:

1. **Frontend doesn't know backend URL** — The env var `NEXT_PUBLIC_API_BASE_URL` must be set before the frontend builds
2. **CORS blocks the request** — Backend CORS headers must include the frontend's origin
3. **Localhost doesn't exist remotely** — Default fallback `http://localhost:8080` only works on your local machine

## Local Development

```bash
# 1. Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload

# 2. Frontend (in another terminal)
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
# Automatically fetches from http://localhost:8080 (from .env)
```

## Vercel Deployment

### Step 1: Deploy Backend

Deploy your backend to Heroku, Railway, or another provider and get a URL like:

```
https://your-backend-url.herokuapp.com
```

### Step 2: Add Vercel Environment Variable

In Vercel dashboard → Settings → Environment Variables:

- **Name**: `NEXT_PUBLIC_API_BASE_URL`
- **Value**: `https://your-backend-url.herokuapp.com`
- **Environments**: Production, Preview, Development

### Step 3: Update CORS on Backend

In `backend/main.py`, add your Vercel URL to `allowed_origins`:

```python
allowed_origins = [
    "https://your-project.vercel.app",
    "https://your-project-staging.vercel.app",
    # ... existing localhost entries
]
```

### Step 4: Deploy Frontend to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Add deployment env vars"
git push origin main

# Vercel auto-deploys from main branch
# Check: Vercel Dashboard → Deployments
```

## Testing Deployment

```bash
# From any machine, test the API directly:
curl -X POST https://your-backend-url.herokuapp.com/api/health
# Should return: {"status":"ok"}

# Test from frontend:
curl https://your-project.vercel.app
# Should load without "Failed to fetch" errors
```

## Troubleshooting

| Error             | Cause                                 | Fix                                                        |
| ----------------- | ------------------------------------- | ---------------------------------------------------------- |
| `Failed to fetch` | Frontend can't reach backend          | Set `NEXT_PUBLIC_API_BASE_URL` before build                |
| `CORS error`      | Backend doesn't allow frontend origin | Add frontend URL to `allowed_origins` in `backend/main.py` |
| `Timeout`         | Backend not running or wrong port     | Verify backend is live: `curl {backend_url}/api/health`    |
| `Blank page`      | Frontend build failed                 | Check Vercel build logs → Deployments → Build logs         |

## Architecture

```
┌─────────────────────────────────────────────────┐
│ User's Browser (any device/location)            │
│ ┌─────────────────────────────────────────────┐ │
│ │ Frontend (React + Next.js on Vercel)        │ │
│ │ - Fetches from NEXT_PUBLIC_API_BASE_URL     │ │
│ │ - Static HTML/JS (cached globally)          │ │
│ └────────────────┬────────────────────────────┘ │
│                  │                               │
│         CORS-enabled HTTPS POST                  │
│                  │                               │
└──────────────────┼───────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────────┐
         │ Backend API (Deployed)  │
         │ - Uvicorn on port 8080  │
         │ - CrewAI agents         │
         │ - Coral queries         │
         │ - CORS allows frontend  │
         └─────────────────────────┘
```

## For Other Developers

When sharing this project:

1. **Copy `.env.example` to `.env`** and fill in values
2. **For local dev**: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`
3. **For Vercel**: Ask them to set the env var in their Vercel dashboard
4. **Backend must be deployed first** before frontend can connect
