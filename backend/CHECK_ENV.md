# 🔍 Environment Variables Check

## Current Status

✅ **AIML_API_KEY** is found in `backend/.env`

## How to Verify/Set AIML_API_KEY

### 1. Check Current Value
```bash
cd backend
grep AIML_API_KEY .env
```

### 2. If Not Set or Empty
Edit `backend/.env` and add/update:
```bash
AIML_API_KEY=your_actual_aiml_api_key_here
```

### 3. Required Environment Variables

Make sure these are set in `backend/.env`:

```bash
# AIMLAPI Configuration (for Deepgram Nova-3 transcription)
AIML_API_KEY=your_aiml_api_key_here
AIML_API_BASE_URL=https://api.aimlapi.com/v1

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Secret
JWT_SECRET=your_jwt_secret
```

### 4. Restart Backend After Changes
After updating `.env`, restart the backend server:
```bash
cd backend
npm run dev
```

## Getting Your AIML API Key

1. Go to https://aimlapi.com
2. Sign up or log in
3. Navigate to API Keys section
4. Copy your API key
5. Add it to `backend/.env` as `AIML_API_KEY=your_key_here`

## Verification

To verify the key is loaded correctly:
```bash
cd backend
node -e "require('dotenv').config(); console.log('AIML_API_KEY:', process.env.AIML_API_KEY ? 'Set (' + process.env.AIML_API_KEY.substring(0, 10) + '...)' : 'NOT SET');"
```

## Troubleshooting

- **Key not working?** Make sure there are no extra spaces or quotes around the value
- **Still getting errors?** Check backend logs for detailed error messages
- **Production (Vercel)?** Set environment variables in Vercel dashboard, not in `.env` file

