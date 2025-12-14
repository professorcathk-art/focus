# Vercel Debugging Guide

## How to Check Vercel Logs for Favorite Route

### Method 1: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on **"Deployments"** tab
4. Click on the latest deployment
5. Click on **"Functions"** tab
6. Click on **"View Function Logs"** or **"Runtime Logs"**
7. Search for: `favorite` or `FAVORITE ROUTE` or `PUT`

### Method 2: Vercel CLI
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# View logs
vercel logs --follow
```

### Method 3: Search in Logs
Look for these log messages:
- `[FAVORITE ROUTE] ✅ PUT /:id/favorite MATCHED` - Route is working
- `[ROUTER DEBUG] PUT request: path=...` - Request reached router
- `[404] Route not found: PUT /api/ideas/.../favorite` - Route not found
- `[SERVER] Registered route: PUT /:id/favorite` - Route registered correctly

## Why You're Seeing Old Code

The errors show:
1. **Transcription**: Still using OpenAI (old code)
   - Should see: `[Upload Audio] Calling AIMLAPI nova-3 endpoint`
   - Actually seeing: `[Upload Audio] Using OpenAI for Whisper transcription`

2. **Favorite Route**: HTML error (Express default 404)
   - Should see: JSON error from our custom 404 handler
   - Actually seeing: HTML `<!DOCTYPE html>...Cannot PUT...`

**This means Vercel hasn't deployed the latest code yet!**

## How to Force Vercel to Redeploy

### Option 1: Wait for Auto-Deploy
- Vercel should auto-deploy when you push to GitHub
- Check deployment status in Vercel dashboard
- Look for "Building..." or "Ready" status

### Option 2: Manual Redeploy
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments" tab
4. Click "..." on latest deployment
5. Click "Redeploy"

### Option 3: Trigger via Git
```bash
# Make a small change to trigger deployment
git commit --allow-empty -m "Trigger Vercel redeploy"
git push
```

## What to Check After Deployment

1. **Check Deployment Status**
   - Should show "Ready" (green)
   - Should show latest commit hash

2. **Check Logs for Route Registration**
   - Look for: `[SERVER] Registered route: PUT /:id/favorite`
   - This confirms the route is loaded

3. **Test Favorite Toggle**
   - Should see: `[FAVORITE ROUTE] ✅ PUT /:id/favorite MATCHED`
   - Should NOT see HTML errors

4. **Test Transcription**
   - Should see: `[Upload Audio] Calling AIMLAPI nova-3 endpoint`
   - Should NOT see OpenAI messages

## Current Code Status

✅ **Code is correct in repo:**
- Favorite route: Line 111, before `PUT /:id` (line 513)
- Transcription: Uses AIMLAPI nova-3 only (no OpenAI)
- Route registration logging added

❌ **Vercel is running old code:**
- Still using OpenAI for transcription
- Favorite route not matching (HTML 404 error)

## Next Steps

1. **Wait for Vercel to finish deploying** (check dashboard)
2. **Check logs** using methods above
3. **Test again** after deployment completes
4. **If still broken**, check logs for route registration messages
