# Vercel Static Site Setup

## Problem
Vercel is detecting Next.js files and trying to build as a Next.js app instead of serving static HTML.

## Solution

### Option 1: Vercel Dashboard Settings (Recommended)

1. Go to your Vercel project → **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Configure:
   - **Framework Preset**: `Other` (NOT Next.js)
   - **Build Command**: (leave empty)
   - **Output Directory**: `.` (current directory)
   - **Install Command**: (leave empty - no build needed)
4. **Save** and **Redeploy**

### Option 2: Use vercel.json (Already configured)

The `vercel.json` file is already configured to:
- Disable build command (`buildCommand: null`)
- Set output directory to current directory (`.`)
- Set framework to null
- Handle routing for privacy policy

### Option 3: Remove Next.js Files (If still not working)

If Vercel still tries to build Next.js, you can temporarily rename the Next.js files:

```bash
cd website
mv app app.backup
mv next.config.js next.config.js.backup
mv package.json package.json.backup
```

Then redeploy. The static HTML files will be served directly.

## Verify Deployment

After redeploying, check:
1. Visit your Vercel URL
2. Should see the dark-themed landing page
3. Check browser console for any errors
4. Test `/privacy-policy` route

## Current Files Structure

```
website/
├── index.html          ← Main landing page (served at /)
├── privacy-policy.html ← Privacy policy (served at /privacy-policy)
├── vercel.json         ← Vercel config (forces static serving)
└── .vercelignore      ← Ignores Next.js files
```

The Next.js files (`app/`, `next.config.js`, etc.) are ignored by `.vercelignore` but kept in repo for reference.

