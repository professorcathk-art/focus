# 🚀 Quick Start: App Store Submission

Get your app on the App Store in 5 steps!

## Step 1: Apple Developer Account (5 minutes)

1. Go to https://developer.apple.com/programs/
2. Click **"Enroll"** → Sign in with Apple ID
3. Pay $99/year → Wait for approval (24-48 hours)

## Step 2: Create App in App Store Connect (5 minutes)

1. Go to https://appstoreconnect.apple.com
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Name**: Focus
   - **Bundle ID**: `com.focus.app`
   - **SKU**: `focus-app-001`
   - **Language**: English
4. Click **"Create"**

## Step 3: Prepare Screenshots (30 minutes)

**Required sizes**:
- iPhone 6.7": 1290 x 2796 px
- iPhone 6.5": 1242 x 2688 px  
- iPhone 5.5": 1242 x 2208 px

**How to capture**:
```bash
# Start iOS Simulator
npm run ios

# In Simulator: Cmd + S to take screenshot
# Or: Device → Screenshot
```

**Screenshot suggestions**:
1. Record page (main screen)
2. Notes/Inbox (categorized ideas)
3. Search page
4. To-do list
5. Profile page

## Step 4: Host Privacy Policy (10 minutes)

**Option A: GitHub Pages** (easiest)
1. Create `docs/privacy-policy.md` (copy from `PRIVACY_POLICY.md`)
2. Enable GitHub Pages in repo settings
3. URL: `https://yourusername.github.io/focus/privacy-policy`

**Option B: Vercel**
1. Create `public/privacy-policy.html`
2. Deploy to Vercel
3. URL: `https://yourdomain.vercel.app/privacy-policy`

**Update `PRIVACY_POLICY.md`**:
- Replace `[your-email@example.com]` with your email
- Replace `[Your address]` if required

## Step 5: Build & Submit (30 minutes)

```bash
# 1. Login to EAS
eas login

# 2. Build production version
eas build --platform ios --profile production

# 3. Wait for build (~15-30 minutes)
# Monitor: https://expo.dev/accounts/chrislau/projects/focus/builds

# 4. Submit to App Store
eas submit --platform ios
```

## Step 6: Complete App Store Listing

In App Store Connect:

1. **App Information**:
   - Upload screenshots (all sizes)
   - Add description (see `APP_STORE_SUBMISSION_GUIDE.md`)
   - Add keywords: `productivity,notes,ideas,adhd,organization`
   - Add privacy policy URL

2. **App Review**:
   - Contact email: Your email
   - Demo account (if needed): Create test account

3. **Pricing**: Set to Free

4. **Submit**: Click "Submit for Review"

## Timeline

- **Build**: 15-30 minutes
- **Review**: 24-48 hours
- **Live**: Within 24 hours after approval

## Need Help?

- **Full Guide**: See `APP_STORE_SUBMISSION_GUIDE.md`
- **Checklist**: See `APP_STORE_CHECKLIST.md`
- **Privacy Policy**: See `PRIVACY_POLICY.md`

## Current Status

✅ App configured (`app.json`)  
✅ EAS configured (`eas.json`)  
✅ Production environment variables set  
⏳ Ready to start submission!

---

**Next Step**: Enroll in Apple Developer Program → https://developer.apple.com/programs/

