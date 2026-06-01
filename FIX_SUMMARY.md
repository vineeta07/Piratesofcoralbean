# Vercel Deployment Fix Summary

## Problem

"Failed to fetch" error when accessing https://piratesofcoralbean.vercel.app from other devices.

## Root Cause

- Environment variable named `VTTE_API_BASE_URL` (incorrect)
- Next.js only sends `NEXT_PUBLIC_*` prefixed variables to the browser build
- Frontend couldn't find backend URL, defaulted to localhost:8080 (doesn't exist remotely)

## Solution Applied

### 1. ✅ Fixed Environment Variables

**File**: `.env`

```
# Before (WRONG):
VTTE_API_BASE_URL="https://piratesofcoralbean.onrender.com"

# After (CORRECT):
NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"  # for local dev
```

### 2. ✅ Optimized CORS Headers

**File**: `backend/main.py`

- Removed redundant wildcard `"*"` from `allow_origins`
- Added explicit origins for Vercel and localhost
- Added proper `allow_credentials` and `max_age` settings
- Set correct preflight headers (GET, POST, PUT, DELETE, OPTIONS)

### 3. ✅ Improved Error Messages

**File**: `frontend/lib/api.ts`

- Added 30-second timeout detection
- Shows which API URL frontend is trying to reach
- Lists 3 common causes of connection failure
- Returns error response instead of throwing (no more generic errors)

### 4. ✅ Enhanced Error Display in UI

**File**: `frontend/components/ChatInterface.tsx`

- Error messages now display in red box with mono font
- Multi-line errors preserved and readable
- Shows "⚠️ Connection Error" header

### 5. ✅ Created Deployment Documentation

**Files**:

- `DEPLOYMENT.md` - Full deployment guide with troubleshooting
- `.env.example` - Template showing all required environment variables
- `vercel.json` - Vercel configuration with env var requirements

## How It Works Now

### Development (localhost)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
→ Frontend fetches from local backend (same machine)
```

### Production (Vercel)

```
Vercel Dashboard Settings → Environment Variables
NEXT_PUBLIC_API_BASE_URL=https://piratesofcoralbean.onrender.com
↓
Vercel builds with this URL baked into JavaScript
↓
Browser fetches from remote backend (other devices work!)
```

## For Sharing with Other Developers

1. **Copy `.env.example` to `.env`**

   ```bash
   cp .env.example .env
   ```

2. **For local dev**: Keep `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`

3. **For Vercel deployment**:
   - Set `NEXT_PUBLIC_API_BASE_URL` in Vercel dashboard before deploying
   - Don't commit production URLs to `.env` files

## Testing the Fix

### Local Test

```bash
# Terminal 1: Backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8080

# Terminal 2: Frontend
npm run dev

# Browser: http://localhost:3000
# Should fetch from http://localhost:8080 ✓
```

### Remote Test (on another device)

```
https://piratesofcoralbean.vercel.app
# Should fetch from https://piratesofcoralbean.onrender.com ✓
# No "Failed to fetch" error
```

## Architecture Diagram

```
┌──────────────────────────────────────────┐
│         User on Any Device               │
│  https://piratesofcoralbean.vercel.app   │
└────────────┬─────────────────────────────┘
             │
             │ Browser reads NEXT_PUBLIC_API_BASE_URL
             │ from next.js build (baked in at build time)
             │
             ▼
┌──────────────────────────────────────────┐
│     Vercel (Static Hosting)              │
│  - Serves frontend JS/HTML               │
│  - NEXT_PUBLIC_API_BASE_URL: loaded      │
│  - CORS: allows vercel.app origin        │
└────────────┬─────────────────────────────┘
             │
             │ POST /analyze to NEXT_PUBLIC_API_BASE_URL
             │
             ▼
┌──────────────────────────────────────────┐
│  Render (Backend API)                    │
│  https://piratesofcoralbean.onrender.com │
│  - Accepts from piratesofcoralbean.vercel.app
│  - Returns: deals + documents + slack    │
└──────────────────────────────────────────┘
```

## Key Files Modified

| File                                    | Changes                                                  |
| --------------------------------------- | -------------------------------------------------------- |
| `.env`                                  | Renamed `VTTE_API_BASE_URL` → `NEXT_PUBLIC_API_BASE_URL` |
| `backend/main.py`                       | Removed `"*"` wildcard, added explicit CORS origins      |
| `frontend/lib/api.ts`                   | Added timeout + helpful error messages + error handling  |
| `frontend/components/ChatInterface.tsx` | Styled error display with red box and mono font          |

## New Files

| File            | Purpose                                     |
| --------------- | ------------------------------------------- |
| `.env.example`  | Template for all required env variables     |
| `DEPLOYMENT.md` | Detailed deployment guide                   |
| `vercel.json`   | Vercel config documenting required env vars |

## Next Steps for Full Release

1. Set `NEXT_PUBLIC_API_BASE_URL` in Vercel dashboard
2. Trigger Vercel redeploy (push to main branch)
3. Test from multiple devices → should work now!
4. Share `.env.example` with team → they'll know what to set
5. Update README with deployment section link to DEPLOYMENT.md
