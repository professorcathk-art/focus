# Backend Setup Guide

## Quick Start

### 1. Set Up Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `backend/supabase-schema.sql`
4. Click **Run** to create the tables

**Important:** The schema includes:
- `users` table for authentication
- `ideas` table for storing ideas with embeddings
- `clusters` table for organizing ideas
- Row Level Security (RLS) policies
- Indexes for performance

### 2. Set Up Backend Environment

The `.env` file is already created with your credentials. Verify it contains:

```env
SUPABASE_URL=https://wqvevludffkemgicrfos.supabase.co
SUPABASE_ANON_KEY=sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1
SUPABASE_SERVICE_ROLE_KEY=sb_secret_ibfITkcedN5ttOZNu_579w_wEG3VBbl
AIML_API_KEY=ad38269d7b464f7bb460be2d4c8213b3
AIML_API_BASE_URL=https://api.aimlapi.com/v1
PORT=3001
NODE_ENV=development
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Start Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### 5. Update Frontend API URL

Update `src/config/api.ts` to point to your backend:

```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";
```

Or set environment variable:
```bash
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

### 6. Test the API

Test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

## For Production (Vercel/Netlify)

1. Deploy backend to Vercel or Netlify
2. Set environment variables in your hosting platform
3. Update `EXPO_PUBLIC_API_URL` in frontend to your deployed URL

## Features Implemented

✅ Authentication (signup, signin, signout)
✅ Ideas CRUD (create, read, update, delete)
✅ Audio transcription using AIMLAPI Whisper
✅ Text embeddings using AIMLAPI
✅ Semantic search
✅ Clusters management
✅ User statistics

## Next Steps

1. Implement automatic clustering (using GPT-4o-mini)
2. Add audio file storage to Supabase Storage
3. Implement recent searches tracking
4. Add pagination for large datasets

