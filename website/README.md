# Focus Circle Landing Page

Modern, dark-themed landing page inspired by saner.ai, built with vanilla HTML/CSS/JS for fast loading and easy deployment.

## Features

- ✅ Dark theme with gradient accents
- ✅ Smooth scroll animations
- ✅ Mobile-responsive design
- ✅ Single HTML file (no dependencies)
- ✅ Fast loading (optimized)
- ✅ SEO-friendly

## Files

- `index.html` - Main landing page
- `privacy-policy.html` - Privacy policy page
- `vercel.json` - Vercel configuration for routing

## Deployment to Vercel

### Option 1: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import repository: `professorcathk-art/focus`
4. **Set Root Directory**: `website`
5. **Framework Preset**: Other (or Static Site)
6. **Build Command**: (leave empty - static HTML)
7. **Output Directory**: `.` (current directory)
8. Click "Deploy"

### Option 2: Vercel CLI

```bash
cd website
vercel
```

## Customization

- Update App Store link in `index.html` (search for "apps.apple.com")
- Update company information
- Update contact emails
- Modify colors in CSS variables at top of `<style>` tag
- Add/remove testimonials as needed

## Notes

- This is a static HTML site (no Next.js needed)
- All CSS and JS is embedded in HTML for fast loading
- Privacy policy is a separate HTML file
- Vercel will serve these files as static assets
