# Focus Circle Landing Page

Modern, dark-themed landing page built with Next.js for easy form integration and lead capture.

## Features

- ✅ Dark theme with gradient accents
- ✅ Smooth scroll animations
- ✅ Mobile-responsive design
- ✅ Next.js framework (ready for forms/surveys)
- ✅ SEO-friendly
- ✅ Fast loading

## Why Next.js?

Next.js is perfect for adding:
- **Lead capture forms** - Easy form handling with API routes
- **Surveys/Questionnaires** - Server-side form processing
- **Email integration** - Send form submissions to email services
- **Database integration** - Store leads in Supabase or other databases
- **Analytics** - Track form submissions and conversions

## Files Structure

```
website/
├── app/
│   ├── page.tsx          ← Main landing page
│   ├── layout.tsx        ← Root layout
│   ├── globals.css       ← Global styles
│   └── privacy-policy/
│       └── page.tsx      ← Privacy policy page
├── package.json          ← Dependencies
├── next.config.js        ← Next.js config
└── vercel.json           ← Vercel routing
```

## Local Development

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Option 1: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import repository: `professorcathk-art/focus`
4. **Set Root Directory**: `website`
5. **Framework Preset**: Next.js (auto-detected)
6. Click "Deploy"

### Option 2: Vercel CLI

```bash
cd website
vercel
```

## Adding Forms/Surveys (Future)

When you're ready to add lead capture:

1. Create form component in `app/components/LeadForm.tsx`
2. Create API route in `app/api/submit-lead/route.ts`
3. Integrate with email service (SendGrid, Resend, etc.) or Supabase
4. Add form to landing page

Example API route structure:
```typescript
// app/api/submit-lead/route.ts
export async function POST(request: Request) {
  const data = await request.json();
  // Process form data
  // Send email or save to database
  return Response.json({ success: true });
}
```

## Customization

- Update App Store link in `app/page.tsx`
- Modify colors in `app/globals.css` (CSS variables)
- Add/remove sections as needed
- Update company information
