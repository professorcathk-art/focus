# ✅ App Store Submission Checklist

Quick checklist to ensure everything is ready for App Store submission.

## Pre-Submission Checklist

### Apple Developer Account
- [ ] Enrolled in Apple Developer Program ($99/year)
- [ ] Can access https://appstoreconnect.apple.com
- [ ] Verified email and account status

### App Store Connect Setup
- [ ] Created new app in App Store Connect
- [ ] Bundle ID matches: `com.focus.app`
- [ ] App name: "Focus"
- [ ] Primary language selected

### App Metadata
- [ ] App description written (up to 4,000 characters)
- [ ] Keywords added (100 characters max)
- [ ] Subtitle added (30 characters max)
- [ ] Support URL provided
- [ ] Marketing URL (optional)

### Screenshots
- [ ] iPhone 6.7" screenshots (1290 x 2796 px) - at least 1
- [ ] iPhone 6.5" screenshots (1242 x 2688 px) - at least 1
- [ ] iPhone 5.5" screenshots (1242 x 2208 px) - at least 1
- [ ] iPad Pro screenshots (if supporting iPad)
- [ ] Screenshots show real app content (not mockups)

### App Icon
- [ ] Icon is 1024 x 1024 px
- [ ] PNG format (no transparency)
- [ ] No rounded corners (Apple adds them)
- [ ] Looks good at small sizes

### Privacy Policy
- [ ] Privacy policy created
- [ ] Hosted at publicly accessible URL
- [ ] URL added to App Store Connect
- [ ] Policy covers data collection, storage, third-party services

### App Configuration
- [ ] `app.json` version: `1.0.0`
- [ ] `app.json` buildNumber: `1`
- [ ] Bundle ID: `com.focus.app`
- [ ] App name: "Focus"
- [ ] All permissions have descriptions

### Build
- [ ] Production build created: `eas build --platform ios --profile production`
- [ ] Build completed successfully
- [ ] Build uploaded to App Store Connect
- [ ] Build status: "Ready to Submit"

### Testing
- [ ] App tested on physical device
- [ ] All features work correctly
- [ ] No crashes or bugs
- [ ] Login/signup works
- [ ] Ideas can be saved
- [ ] Search works
- [ ] Categories work
- [ ] To-do list works

### App Review Information
- [ ] Contact email provided
- [ ] Demo account created (if app requires login)
- [ ] Demo account credentials provided
- [ ] Review notes added (if needed)

### Pricing & Availability
- [ ] Price set (Free or paid)
- [ ] Availability selected (all countries or specific)
- [ ] Release date set (automatic or scheduled)

## Submission Checklist

- [ ] All metadata complete
- [ ] All screenshots uploaded
- [ ] Privacy policy URL added
- [ ] App icon uploaded
- [ ] Build uploaded and ready
- [ ] Age rating completed
- [ ] Export compliance answered
- [ ] Ready to submit

## After Submission

- [ ] Monitor App Store Connect for status updates
- [ ] Check email for review notifications
- [ ] Respond to any review questions
- [ ] Prepare for potential rejection (have fixes ready)

## Post-Approval

- [ ] App appears in App Store
- [ ] Monitor downloads and reviews
- [ ] Respond to user reviews
- [ ] Track analytics
- [ ] Plan first update

---

## Quick Commands

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# Check build status
eas build:list
```

---

**Status**: ⏳ Ready to start submission process

