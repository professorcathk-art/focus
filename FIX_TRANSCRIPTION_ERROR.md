# Fix Transcription Error - OPENAI_API_KEY

## 🐛 Error Message

```
Failed to transcribe audio: Unauthorized. Make sure OPENAI_API_KEY is set correctly.
```

## 🔍 Root Cause

1. **AIMLAPI nova-3 doesn't support audio transcription** (it's a text model)
2. Code falls back to **OpenAI Whisper**
3. **OPENAI_API_KEY is missing or invalid** in `backend/.env`

## ✅ Solution

### Step 1: Add OpenAI API Key to Backend

**Edit `backend/.env` file:**

```env
# Add or update this line:
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Where to get OpenAI API Key:**
1. Go to: https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to `backend/.env`

### Step 2: Restart Backend

```bash
# Stop current backend
lsof -ti:3001 | xargs kill -9

# Start backend again
cd backend
npm run dev
```

### Step 3: Test Recording

1. Open app
2. Sign in
3. Record a short audio (2-3 seconds)
4. Should transcribe successfully ✅

## 📋 Your Backend .env Should Have:

```env
# Supabase
SUPABASE_URL=https://wqvevludffkemgicrfos.supabase.co
SUPABASE_ANON_KEY=sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1
SUPABASE_SERVICE_ROLE_KEY=sb_secret_ibfITkcedN5ttOZNu_579w_wEG3VBbl

# AIMLAPI (for embeddings and chat)
AIML_API_KEY=ad38269d7b464f7bb460be2d4c8213b3
AIML_API_BASE_URL=https://api.aimlapi.com/v1

# OpenAI (for Whisper transcription - REQUIRED for voice recording)
OPENAI_API_KEY=sk-your-key-here

# Server
PORT=3001
NODE_ENV=development
```

## 🔄 Why OpenAI is Needed

- **AIMLAPI**: Used for text embeddings and chat (works great!)
- **OpenAI Whisper**: Used for audio transcription (AIMLAPI doesn't support this)
- **Fallback**: If AIMLAPI fails, tries OpenAI

## 💡 Alternative: Use Only OpenAI

If you prefer to use OpenAI for everything:

1. **Get OpenAI API key** (same as above)
2. **Add to backend/.env**: `OPENAI_API_KEY=sk-...`
3. **Keep AIML_API_KEY** for now (used for embeddings)
4. **Recording will use OpenAI Whisper** ✅

## ⚠️ Important Notes

- **OPENAI_API_KEY is required** for voice recording
- **AIMLAPI nova-3** doesn't support audio (it's text-only)
- **Backend must be restarted** after changing `.env`
- **Keep API keys secret** - never commit `.env` to git

## 🧪 Test After Fix

```bash
# Test backend health
curl http://localhost:3001/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

Then try recording in the app - should work! ✅

