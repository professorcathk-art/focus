# Fix 404 Error on Vercel

## The Problem

Your build log shows:
```
Running "vercel build"
Build Completed in /vercel/output [50ms]
```

This is too fast - a Next.js build should take much longer. Vercel isn't detecting Next.js because you selected "Other" as the framework.

## Solution: Reconfigure Project Framework

### Option 1: Reconnect Project (Recommended)

1. Go to Vercel Dashboard
2. Click on your project **Settings**
3. Scroll down to **General** section
4. Find **Framework Preset**
5. Change it from **Other** to **Next.js**
6. Click **Save**
7. Go to **Deployments** tab
8. Click **Redeploy** on the latest deployment

### Option 2: Delete and Reimport

1. Go to Vercel Dashboard
2. Click on your project **Settings**
3. Scroll to the bottom
4. Click **Delete Project** (don't worry, you can reimport)
5. Go to **Add New Project**
6. Import from GitHub: `professorcathk-art/sito`
7. **IMPORTANT:** When configuring:
   - Framework Preset: Select **Next.js**
   - Root Directory: Leave as `.` (root)
   - Build Command: Should auto-fill as `npm run build`
   - Output Directory: Should auto-fill as `.next`
8. Add all environment variables
9. Click **Deploy**

## Verify Correct Configuration

After reconfiguring, your build log should show:
```
Running "npm run build"
Creating an optimized production build ...
✓ Compiled successfully
```

Instead of:
```
Running "vercel build"
Build Completed in /vercel/output [50ms]
```

## Environment Variables Checklist

Make sure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

## After Fixing

Once you've changed the framework to Next.js and redeployed, the site should work correctly!

