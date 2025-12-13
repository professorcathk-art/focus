# Deployment Guide for Focus App

This guide will help you deploy the Focus app backend to Vercel and set up GitHub.

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Supabase project set up
- All environment variables ready

## Step 1: GitHub Setup

### 1.1 Initialize Git Repository (if not already done)

```bash
cd /Users/mickeylau/focus
git init
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `focus` (or your preferred name)
3. **Don't** initialize with README, .gitignore, or license (we already have these)

### 1.3 Connect Local Repository to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/focus.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/focus.git
```

### 1.4 Stage and Commit All Changes

```bash
# Stage all changes
git add .

# Commit
git commit -m "Initial commit: Focus app with backend API"

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Vercel Deployment

### 2.1 Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### 2.2 Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click **"Add New Project"**
3. Import your GitHub repository:
   - Select your GitHub account
   - Find and select the `focus` repository
   - Click **"Import"**

### 2.3 Configure Project Settings

**Root Directory:** Set to `backend` (important!)

**Framework Preset:** Other

**Build Command:** Leave empty (or `npm install`)

**Output Directory:** Leave empty

**Install Command:** `npm install`

### 2.4 Set Environment Variables

In Vercel project settings, add these environment variables:

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

**Important:** Replace `your_openai_api_key_here` and `your_jwt_secret_here` with actual values!

### 2.5 Deploy

Click **"Deploy"** and wait for the build to complete.

### 2.6 Get Your Deployment URL

After deployment, Vercel will give you a URL like:
- `https://your-project-name.vercel.app`

Your API will be available at:
- `https://your-project-name.vercel.app/api/health`

## Step 3: Update Frontend API URL

### 3.1 Update Frontend Configuration

Update `src/config/api.ts` or create `.env` file:

```bash
# For production
EXPO_PUBLIC_API_URL=https://your-project-name.vercel.app/api
```

Or update `src/config/api.ts`:

```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://your-project-name.vercel.app/api";
```

## Step 4: Database Setup

Make sure you've run all SQL schemas in Supabase:

1. `backend/supabase-schema.sql` - Main schema
2. `backend/supabase-auth-setup.sql` - Auth triggers
3. `backend/todos-schema.sql` - Todos table

## Step 5: Test Deployment

1. Test health endpoint:
   ```bash
   curl https://your-project-name.vercel.app/api/health
   ```

2. Test authentication:
   - Try signing up in the app
   - Try signing in

3. Test todos:
   - Add a todo
   - Toggle completion
   - Delete a todo

## Troubleshooting

### Build Fails

- Check that `Root Directory` is set to `backend`
- Verify all environment variables are set
- Check Vercel build logs for errors

### API Returns 404

- Verify the deployment URL is correct
- Check that routes are properly configured in `server.js`
- Ensure `vercel.json` is in the `backend` directory

### Database Errors

- Verify Supabase environment variables are correct
- Check that all SQL schemas have been run
- Verify RLS policies are set up correctly

## Continuous Deployment

Once connected to GitHub, Vercel will automatically deploy:
- Every push to `main` branch = Production deployment
- Every pull request = Preview deployment

## Useful Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Redeploy
vercel --prod
```

