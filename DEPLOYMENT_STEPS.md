# Quick Deployment Steps

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `focus` (or your preferred name)
3. Description: "ADHD-friendly idea capture app"
4. Choose Public or Private
5. **DO NOT** check "Initialize with README"
6. Click "Create repository"

## Step 2: Connect and Push to GitHub

Run these commands in your terminal:

```bash
cd /Users/mickeylau/focus

# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Focus app with backend API"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/focus.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Click "Add New Project"**
3. **Import Git Repository**:
   - Select your GitHub account
   - Find and select `focus` repository
   - Click **"Import"**

4. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `backend` ⚠️ **IMPORTANT!**
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

5. **Environment Variables**:
   Click "Environment Variables" and add these:

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

   **⚠️ Replace these with your actual values:**
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `JWT_SECRET` - A random secret string (e.g., `openssl rand -hex 32`)

6. **Deploy**: Click "Deploy"

7. **Get Your URL**: After deployment, you'll get a URL like:
   - `https://focus-backend-abc123.vercel.app`
   - Your API will be at: `https://focus-backend-abc123.vercel.app/api`

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd backend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? focus-backend
# - Directory? ./
# - Override settings? No
```

## Step 4: Update Frontend

After deployment, update your frontend to use the Vercel URL:

**Option 1: Environment Variable (Recommended)**

Create `.env` file in project root:
```env
EXPO_PUBLIC_API_URL=https://your-project-name.vercel.app/api
```

**Option 2: Update Config File**

Edit `src/config/api.ts`:
```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://your-project-name.vercel.app/api";
```

## Step 5: Test Deployment

1. **Health Check**:
   ```bash
   curl https://your-project-name.vercel.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test in App**:
   - Sign up/Sign in
   - Create an idea
   - Add a todo
   - Test search

## Troubleshooting

### Build Fails
- ✅ Check Root Directory is set to `backend`
- ✅ Verify all environment variables are set
- ✅ Check Vercel build logs

### 404 Errors
- ✅ Verify deployment URL is correct
- ✅ Check `vercel.json` is in `backend` directory
- ✅ Ensure routes are properly configured

### Database Errors
- ✅ Verify Supabase env vars are correct
- ✅ Check all SQL schemas have been run
- ✅ Verify RLS policies are set up

## Continuous Deployment

Once connected, Vercel automatically deploys:
- ✅ Every push to `main` = Production
- ✅ Every PR = Preview deployment

## Useful Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Redeploy
vercel --prod

# Check environment variables
vercel env ls
```

