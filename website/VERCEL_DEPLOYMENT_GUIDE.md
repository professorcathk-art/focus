# Vercel Deployment Guide for Focus Circle Website

## Directory Structure

Your repository has this structure:
```
focus/
├── website/          ← Landing page website (use this!)
├── web/              ← Expo web build (don't use for Vercel)
├── app/              ← React Native app code
├── backend/          ← Backend API
└── ...
```

## ✅ Correct Directory for Vercel

**Use: `website/`** (not `web/`)

- `website/` = Next.js landing page (what you want to deploy)
- `web/` = Expo web build output (not for Vercel deployment)

## Step-by-Step Vercel Deployment

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Repository**
   - Click "Add New..." → "Project"
   - Select your repository: `professorcathk-art/focus`

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `website` ← **IMPORTANT: Set this!**
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (1-2 minutes)

5. **Verify**
   - Visit your deployed URL (e.g., `focus-circle.vercel.app`)
   - Check that homepage loads
   - Test `/privacy-policy` page

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to website directory
cd website

# Login
vercel login

# Deploy (will ask for configuration)
vercel

# Deploy to production
vercel --prod
```

**Note**: When using CLI from `website/` directory, Vercel will automatically detect it's a Next.js project.

## Important Settings

### Root Directory
- **Must be**: `website`
- **NOT**: `web` (that's Expo web output)
- **NOT**: `.` (root - would try to build React Native app)

### Build Settings
- **Framework**: Next.js
- **Node Version**: 18.x or 20.x (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## After Deployment

1. **Get Your URL**
   - Vercel will give you: `https://your-project.vercel.app`
   - Or use custom domain if configured

2. **Update App Store Connect**
   - Privacy Policy URL: `https://your-project.vercel.app/privacy-policy`
   - Support URL: `https://your-project.vercel.app`

3. **Update Website Links**
   - Once app is live, update App Store link in `website/app/page.tsx`
   - Search for `apps.apple.com/app/focus-circle` and replace with actual URL

## Troubleshooting

### Build Fails
- **Check**: Root directory is set to `website`
- **Check**: Node.js version (should be 18+)
- **Check**: All dependencies are in `website/package.json`

### 404 Errors
- **Check**: `vercel.json` is in `website/` directory
- **Check**: Routes are correct in Next.js app directory

### Wrong Directory Selected
- If you selected `web/` by mistake:
  1. Go to Project Settings → General
  2. Change "Root Directory" to `website`
  3. Redeploy

## Quick Reference

**Repository**: `professorcathk-art/focus`  
**Root Directory**: `website`  
**Framework**: Next.js  
**Build Command**: `npm run build` (auto)  
**Output**: `.next` (auto)

---

**Remember**: Always use `website/` directory, not `web/`!

