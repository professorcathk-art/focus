# Focus Circle Landing Page

This is the marketing website for Focus Circle app, separate from the main app codebase.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Vercel** - Hosting and deployment

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your repository (or connect GitHub)
4. Set **Root Directory** to `website`
5. Framework Preset: **Next.js**
6. Click "Deploy"

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from website directory)
cd website
vercel

# Deploy to production
vercel --prod
```

## Important Notes

- This website is **completely separate** from the main app code
- It's in the `website/` directory to keep it isolated
- The privacy policy is at `/privacy-policy`
- Update the App Store link once your app is live

## Customization

- Update App Store link in `app/page.tsx` (search for "apps.apple.com")
- Update company information in `app/page.tsx` and `app/privacy-policy/page.tsx`
- Update contact emails in privacy policy
- Add screenshots/mockups to the features section
- Customize colors in `app/globals.css`

