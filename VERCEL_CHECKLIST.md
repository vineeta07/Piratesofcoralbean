# Vercel Deployment Checklist

## Pre-Deployment (Local Testing)

- [ ] Backend running locally: `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8080`
- [ ] Frontend running locally: `npm run dev`
- [ ] Test query at http://localhost:3000 returns data from http://localhost:8080
- [ ] No console errors in browser DevTools
- [ ] `.env` has `NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"` for local dev

## Deploy Backend to Render/Heroku

- [ ] Push backend code to GitHub
- [ ] Connect Render/Heroku to GitHub repository
- [ ] Deploy backend
- [ ] Verify backend is live: `curl https://your-backend-url.herokuapp.com/api/health`
- [ ] Note the backend URL (e.g., `https://your-backend.herokuapp.com`)

## Configure Vercel Environment Variables

- [ ] Open [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Select your project (piratesofcoralbean)
- [ ] Go to Settings → Environment Variables
- [ ] Add new environment variable:
  - **Name**: `NEXT_PUBLIC_API_BASE_URL`
  - **Value**: `https://your-backend-url.herokuapp.com` (from Render/Heroku)
  - **Environments**: Production, Preview, Development
- [ ] Click "Save"
- [ ] **Important**: Do NOT add `GROQ_API_KEY` to Vercel (it's client-side and should stay local)

## Deploy Frontend to Vercel

### Option A: Automatic (Recommended)

- [ ] Push to GitHub main branch
- [ ] Vercel auto-deploys within seconds
- [ ] Check Deployments tab for "Ready" status

### Option B: Manual Redeploy

- [ ] Go to Vercel Dashboard → Deployments
- [ ] Click "Redeploy" on latest deployment
- [ ] Wait for "Ready" status

## Post-Deployment Verification

### Test 1: Health Check

```bash
curl https://your-backend-url.herokuapp.com/api/health
# Expected: {"status":"ok"}
```

### Test 2: Frontend Loads

```
https://piratesofcoralbean.vercel.app
# Should load without "Failed to fetch" error
```

### Test 3: Query Works

- [ ] Open https://piratesofcoralbean.vercel.app
- [ ] Type query: "Show risky deals"
- [ ] Submit and wait for response
- [ ] Should see deals with risk levels
- [ ] **Check browser Network tab**: POST request to backend should succeed (200 OK)

### Test 4: Test from Another Device

- [ ] Open https://piratesofcoralbean.vercel.app on phone/different computer
- [ ] Test query (same as Test 3)
- [ ] Should work without any "Failed to fetch" errors

### Test 5: Document Downloads

- [ ] Query with "report" in it or wait for full analysis
- [ ] Scroll to bottom of chat response
- [ ] Should see DOCX and PPTX download buttons
- [ ] Click and verify files download

## Troubleshooting

### "Failed to fetch" Error Still Appears

1. [ ] Check Vercel build logs (Deployments → Build logs)
   - Search for "NEXT_PUBLIC_API_BASE_URL"
   - Should see your backend URL in build output
2. [ ] Clear browser cache (Ctrl+Shift+Delete)
3. [ ] Verify `NEXT_PUBLIC_API_BASE_URL` is set in Vercel dashboard
4. [ ] Redeploy frontend (see Deploy Frontend section)

### CORS Error in Browser Console

1. [ ] Verify `allowed_origins` in `backend/main.py` includes `https://piratesofcoralbean.vercel.app`
2. [ ] Restart backend after modifying CORS
3. [ ] Clear browser cache

### Backend Returns 404 or Timeout

1. [ ] Verify backend is running: `curl {backend_url}/api/health`
2. [ ] Check backend URL matches exactly (no trailing slash)
3. [ ] Verify Vercel env var has no typos

### Documents Don't Download

1. [ ] Check backend logs for `/outputs/` requests
2. [ ] Verify `backend/outputs/` directory exists with generated files
3. [ ] Check file permissions

## Communication with Team

When sharing the deployment:

1. **Share the Vercel URL**: `https://piratesofcoralbean.vercel.app`
2. **Share `.env.example`**: So developers know what to configure locally
3. **Important Warning**:
   - ⚠️ **Never commit `.env` with `NEXT_PUBLIC_API_BASE_URL` to GitHub**
   - Different environments (local, dev, prod) need different URLs
   - Vercel env vars handle production automatically

## Environment Variable Reference

| Variable                   | Local Dev               | Vercel                               | Notes                                |
| -------------------------- | ----------------------- | ------------------------------------ | ------------------------------------ |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | `https://your-backend.herokuapp.com` | **MUST be set before Vercel builds** |
| `GROQ_API_KEY`             | Set in `.env`           | ❌ Don't set                         | Used only on backend                 |

## Files Modified for This Fix

- `.env` - Updated env var name
- `backend/main.py` - Fixed CORS configuration
- `frontend/lib/api.ts` - Added better error handling
- `frontend/components/ChatInterface.tsx` - Enhanced error display
- `.env.example` - New template file
- `DEPLOYMENT.md` - New deployment guide
- `vercel.json` - New Vercel configuration

## Success Criteria

✅ **Deployment is successful when:**

1. https://piratesofcoralbean.vercel.app loads without errors
2. Querying returns results without "Failed to fetch"
3. Works from multiple devices (not just your local machine)
4. DOCX/PPTX documents can be downloaded
5. Browser Network tab shows 200 OK responses

---

**Last Updated**: [Current Session]
**Status**: Ready for deployment ✓
