# 🚀 Vercel Deployment Steps

## Step 4: Deploy to Vercel

### 4.1 Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Sign in with your GitHub account (if not already)

### 4.2 Import Project
1. Click **"Add New Project"** button
2. You'll see your GitHub repositories
3. Find and select **`professorcathk-art/focus`**
4. Click **"Import"**

### 4.3 Configure Project Settings ⚠️ CRITICAL!

**Root Directory:**
- Click **"Edit"** next to Root Directory
- Change from `.` to `backend`
- This tells Vercel where your Node.js server is located

**Framework Preset:**
- Select **"Other"**

**Build Command:**
- Leave empty (or `npm install`)

**Output Directory:**
- Leave empty

**Install Command:**
- `npm install`

### 4.4 Add Environment Variables

Click **"Environment Variables"** and add these one by one:

```
SUPABASE_URL=https://wqvevludffkemgicrfos.supabase.co
SUPABASE_ANON_KEY=sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1
SUPABASE_SERVICE_ROLE_KEY=sb_secret_ibfITkcedN5ttOZNu_579w_wEG3VBbl
AIML_API_KEY=ad38269d7b464f7bb460be2d4c8213b3
AIML_API_BASE_URL=https://api.aimlapi.com/v1
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
PORT=3001
```

**⚠️ Important:**
- Replace `your_openai_api_key_here` with your actual OpenAI API key
- Replace `your_jwt_secret_here` with a random secret (you can generate one with: `openssl rand -hex 32`)

### 4.5 Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 1-2 minutes)
3. You'll see a success message with your deployment URL

### 4.6 Get Your API URL

After deployment, Vercel will give you a URL like:
- `https://focus-abc123.vercel.app`

Your API endpoints will be at:
- `https://focus-abc123.vercel.app/api/health`
- `https://focus-abc123.vercel.app/api/ideas`
- etc.

## Step 5: Update Frontend

After getting your Vercel URL, update the frontend:

**Option 1: Environment Variable (Recommended)**

Create `.env` file in project root:
```env
EXPO_PUBLIC_API_URL=https://your-vercel-url.vercel.app/api
```

**Option 2: Update Config File**

Edit `src/config/api.ts`:
```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://your-vercel-url.vercel.app/api";
```

## Step 6: Test Deployment

1. **Health Check:**
   ```bash
   curl https://your-vercel-url.vercel.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test in App:**
   - Restart Expo app
   - Try signing up/signing in
   - Create an idea
   - Add a todo
   - Test search

## Troubleshooting

### Build Fails
- ✅ Verify Root Directory is set to `backend`
- ✅ Check all environment variables are added
- ✅ View build logs in Vercel dashboard

### 404 Errors
- ✅ Verify deployment URL is correct
- ✅ Check `vercel.json` exists in `backend` directory
- ✅ Ensure routes start with `/api`

### Database Errors
- ✅ Verify Supabase env vars match your project
- ✅ Check all SQL schemas have been run in Supabase
- ✅ Verify RLS policies are enabled

## Continuous Deployment

Once connected, Vercel automatically deploys:
- ✅ Every push to `main` = Production deployment
- ✅ Every pull request = Preview deployment

## Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Update frontend `.env` with Vercel URL
3. ✅ Test app functionality
4. ✅ Share your deployed API URL with team

