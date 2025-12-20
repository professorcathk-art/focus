# Deploy Focus Circle Website to Vercel

## Quick Deploy

### Option 1: Vercel Dashboard (Easiest)

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub (or create account)

2. **Create New Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository: `professorcathk-art/focus`
   - **Important**: Set **Root Directory** to `website`
   - Framework Preset: **Next.js** (auto-detected)
   - Click "Deploy"

3. **Configure Domain** (Optional)
   - After deployment, go to Project Settings → Domains
   - Add your custom domain (e.g., `focuscircle.app`)

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to website directory
cd website

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Environment Variables

No environment variables needed for the website (it's static).

## After Deployment

1. **Update App Store Link**
   - Once your app is live, update the App Store link in `app/page.tsx`
   - Search for `apps.apple.com/app/focus-circle` and replace with your actual App Store URL

2. **Update Privacy Policy URL**
   - Use your deployed website URL: `https://your-domain.vercel.app/privacy-policy`
   - Add this URL to App Store Connect → App Information → Privacy Policy URL

3. **Test the Website**
   - Visit your deployed URL
   - Test all links
   - Verify privacy policy page loads correctly
   - Check mobile responsiveness

## Custom Domain Setup

1. **In Vercel Dashboard**
   - Go to Project → Settings → Domains
   - Add your domain (e.g., `focuscircle.app`)
   - Follow DNS configuration instructions

2. **DNS Configuration**
   - Add CNAME record pointing to Vercel
   - Or add A record with Vercel's IP (if using apex domain)

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check `next.config.js` is correct

### 404 Errors
- Verify `vercel.json` is configured correctly
- Check routing in Next.js app directory structure

### Privacy Policy Not Found
- Verify `app/privacy-policy/page.tsx` exists
- Check `vercel.json` rewrites are correct

