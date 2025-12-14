# Vercel Deployment Verification Guide

## ✅ Current Status

Both backend files are now **identical and correct**:
- ✅ `backend/routes/ideas.js` - Uses `/v1/audio/transcriptions` with `deepgram-nova-3`
- ✅ `focus/backend/routes/ideas.js` - Uses `/v1/audio/transcriptions` with `deepgram-nova-3`

## 🔍 Verify Vercel Configuration

### Step 1: Check Vercel Root Directory

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Check **Root Directory** setting:
   - Should be: `backend` (not `focus/backend` or empty)
   - If wrong, change it to `backend` and redeploy

### Step 2: Verify Latest Deployment

1. Go to **Deployments** tab
2. Check the latest deployment:
   - Should show commit: `a4d2609` or later
   - Status should be: **Ready** (green)
   - If it shows "Building..." or "Error", wait for it to complete

### Step 3: Check Deployment Logs

1. Click on the latest deployment
2. Go to **Build Logs**
3. Look for:
   - `[SERVER] Registered route: PUT /:id/favorite` ✅
   - Should NOT see: `nova-3/transcribe` ❌
   - Should see: `audio/transcriptions` ✅

### Step 4: Force Redeploy (If Needed)

If deployment seems stuck or using old code:

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait for it to complete

## 🎯 What to Look For After Deployment

### ✅ Correct Logs (New Code):
```
[Upload Audio] Calling AIMLAPI: https://api.aimlapi.com/v1/audio/transcriptions with model: deepgram-nova-3
[SERVER] Registered route: PUT /:id/favorite
```

### ❌ Wrong Logs (Old Code):
```
[Upload Audio] Calling AIMLAPI nova-3 endpoint: https://api.aimlapi.com/nova-3/transcribe
[Upload Audio] Using OpenAI for Whisper transcription
```

## 🔧 If Old Code Persists

### Option 1: Clear Vercel Cache
1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Clear build cache (if available)
4. Redeploy

### Option 2: Check for Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Verify `AIML_API_KEY` is set correctly
3. Make sure it's set for **Production** environment

### Option 3: Verify Git Integration
1. Go to **Settings** → **Git**
2. Verify it's connected to the correct GitHub repo
3. Verify it's watching the `main` branch

## 📝 Summary

**Both files are correct** - the issue is Vercel deployment, not the code.

**Next Steps:**
1. Verify Vercel root directory is `backend`
2. Wait for latest deployment to complete
3. Check logs to confirm new code is running
4. If still old code, force redeploy
