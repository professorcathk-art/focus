# 🚀 App Store Submission Guide

Complete guide to launch **Focus** on the Apple App Store.

## Prerequisites Checklist

- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect access
- [ ] App screenshots (required)
- [ ] App description and metadata
- [ ] Privacy policy URL (required for apps with user accounts)
- [ ] Production build ready

---

## Step 1: Apple Developer Account Setup

### 1.1 Enroll in Apple Developer Program

1. Go to https://developer.apple.com/programs/
2. Click **"Enroll"**
3. Sign in with your Apple ID
4. Complete enrollment:
   - **Individual**: $99/year
   - **Organization**: $99/year (requires D-U-N-S number)
5. Wait for approval (usually 24-48 hours)

### 1.2 Verify Enrollment

- Check email for confirmation
- Log in to https://developer.apple.com/account
- Verify you can access **Certificates, Identifiers & Profiles**

---

## Step 2: App Store Connect Setup

### 2.1 Access App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Click **"My Apps"** → **"+"** → **"New App"**

### 2.2 Create New App

Fill in the required information:

- **Platform**: iOS
- **Name**: Focus
- **Primary Language**: English (or your preferred language)
- **Bundle ID**: `com.focus.app` (must match `app.json`)
- **SKU**: `focus-app-001` (unique identifier, can be anything)
- **User Access**: Full Access (or Limited Access if you have a team)

Click **"Create"**

---

## Step 3: Prepare App Metadata

### 3.1 App Information

**Name**: Focus (30 characters max)

**Subtitle**: Capture, organize, and find your ideas (30 characters max)

**Category**:
- **Primary**: Productivity
- **Secondary**: Utilities (optional)

**Privacy Policy URL**: 
- **Required** for apps with user accounts
- Create a simple privacy policy page (can host on GitHub Pages, Vercel, etc.)
- Example: `https://yourdomain.com/privacy-policy`

### 3.2 App Description

**Description** (up to 4,000 characters):

```
Focus is a powerful app designed for ADHD users to capture, organize, and find ideas effortlessly.

✨ Key Features:
• Voice & Text Recording - Capture ideas instantly with voice or text
• Smart Categorization - AI automatically organizes your ideas into categories
• Semantic Search - Find ideas using natural language, not just keywords
• To-Do List - Manage daily tasks and stay organized
• Secure Storage - Your ideas are encrypted and stored securely

Perfect for:
• Students managing study notes
• Professionals organizing work ideas
• Anyone who wants to capture thoughts quickly

Stay focused. Stay organized. Stay productive.
```

**Keywords** (100 characters max, comma-separated):
```
productivity,notes,ideas,adhd,organization,voice,recording,search,to-do,tasks
```

**Support URL**: `https://yourdomain.com/support` (or GitHub issues page)

**Marketing URL** (optional): `https://yourdomain.com`

---

## Step 4: App Screenshots (Required)

### 4.1 Required Sizes

You need screenshots for **all** supported device sizes:

- **iPhone 6.7" Display** (iPhone 14 Pro Max, 15 Pro Max): 1290 x 2796 px
- **iPhone 6.5" Display** (iPhone 11 Pro Max, XS Max): 1242 x 2688 px
- **iPhone 5.5" Display** (iPhone 8 Plus, 7 Plus): 1242 x 2208 px
- **iPad Pro (12.9-inch)** (3rd generation): 2048 x 2732 px
- **iPad Pro (12.9-inch)** (2nd generation): 2048 x 2732 px

**Minimum**: 1 screenshot per device size
**Recommended**: 3-5 screenshots per device size

### 4.2 Screenshot Content Suggestions

1. **Home/Record Screen** - Show the main idea capture interface
2. **Notes/Inbox** - Display categorized ideas
3. **Search** - Show semantic search functionality
4. **To-Do List** - Display task management
5. **Profile** - Show user settings

### 4.3 How to Capture Screenshots

**Option 1: iOS Simulator**
```bash
# Start iOS Simulator
npm run ios

# In Simulator: Device → Screenshot
# Or: Cmd + S
```

**Option 2: Physical Device**
- Take screenshots: Power + Volume Up
- Screenshots saved to Photos app

### 4.4 Screenshot Tips

- ✅ Show real app content (not mockups)
- ✅ Use actual user data (or realistic examples)
- ✅ Highlight key features
- ✅ Keep text readable
- ❌ Don't include status bar (iOS removes it automatically)
- ❌ Don't use placeholder text

---

## Step 5: App Icon

### 5.1 Icon Requirements

- **Size**: 1024 x 1024 px
- **Format**: PNG (no transparency)
- **No rounded corners** (Apple adds them automatically)
- **No alpha channel**

### 5.2 Current Icon

Your icon is at: `assets/icon.png`

**Verify it's 1024x1024**:
```bash
# Check icon dimensions
file assets/icon.png
```

If it's not 1024x1024, resize it:
```bash
# Using ImageMagick (if installed)
convert assets/icon.png -resize 1024x1024 assets/icon-1024.png
```

---

## Step 6: Privacy Policy (Required)

### 6.1 Why It's Required

Apple requires a privacy policy for apps that:
- Collect user data (emails, ideas, audio recordings)
- Use authentication (Supabase Auth)
- Store user content

### 6.2 Create Privacy Policy

Create a simple HTML page or Markdown file:

**Example Privacy Policy** (`PRIVACY_POLICY.md`):

```markdown
# Privacy Policy for Focus

**Last Updated**: [Date]

## Data Collection

Focus collects the following data:
- Email address (for account creation)
- Ideas and notes (stored securely)
- Audio recordings (transcribed and deleted after processing)

## Data Storage

- Data is stored securely using Supabase (encrypted database)
- Audio recordings are processed and deleted immediately after transcription
- Ideas are stored in your personal account

## Third-Party Services

- **Supabase**: User authentication and database storage
- **AIMLAPI**: AI-powered categorization and search

## Your Rights

You can:
- Delete your account at any time
- Export your data
- Request data deletion

## Contact

For privacy concerns, contact: [your-email@example.com]
```

### 6.3 Host Privacy Policy

**Option 1: GitHub Pages**
1. Create `docs/privacy-policy.md` in your repo
2. Enable GitHub Pages in repo settings
3. URL: `https://yourusername.github.io/focus/privacy-policy`

**Option 2: Vercel**
1. Create `public/privacy-policy.html`
2. Deploy to Vercel
3. URL: `https://yourdomain.vercel.app/privacy-policy`

**Option 3: Simple HTML Page**
- Host anywhere publicly accessible
- Add URL to App Store Connect

---

## Step 7: Build Production Version

### 7.1 Update Version Number

Before building, ensure version is correct in `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    }
  }
}
```

### 7.2 Build for App Store

```bash
# Make sure you're logged in
eas login

# Build production version
eas build --platform ios --profile production
```

**This will**:
- Build a production-ready iOS app
- Sign with your Apple Developer certificate
- Create an `.ipa` file ready for App Store

**Build time**: ~15-30 minutes

### 7.3 Monitor Build

- Watch progress in terminal
- Or check: https://expo.dev/accounts/chrislau/projects/focus/builds

---

## Step 8: Submit to App Store

### 8.1 Using EAS Submit (Recommended)

```bash
# Submit the latest production build
eas submit --platform ios
```

**EAS will**:
- Find your latest production build
- Upload to App Store Connect
- Handle all submission steps

### 8.2 Manual Submission (Alternative)

1. **Download Build**:
   ```bash
   eas build:list
   # Download the .ipa file
   ```

2. **Upload via Transporter**:
   - Download Transporter app from Mac App Store
   - Open Transporter
   - Drag `.ipa` file
   - Click **"Deliver"**

3. **Or via Xcode**:
   - Open Xcode → Window → Organizer
   - Select your app
   - Click **"Distribute App"**
   - Follow wizard

---

## Step 9: Complete App Store Listing

### 9.1 In App Store Connect

Go to your app → **App Store** tab:

1. **Screenshots**: Upload all required screenshots
2. **Description**: Paste your app description
3. **Keywords**: Add your keywords
4. **Support URL**: Add support URL
5. **Privacy Policy URL**: Add privacy policy URL
6. **App Icon**: Upload 1024x1024 icon
7. **App Preview** (optional): Video demo

### 9.2 App Information

- **Age Rating**: Complete questionnaire
- **App Review Information**:
  - **Contact Information**: Your email
  - **Demo Account** (if required): Test account credentials
  - **Notes**: Any special instructions for reviewers

### 9.3 Pricing and Availability

- **Price**: Free (or set price)
- **Availability**: All countries (or select specific)
- **Release Date**: Automatic (or schedule)

---

## Step 10: Submit for Review

### 10.1 Final Checklist

Before submitting:

- [ ] All screenshots uploaded
- [ ] Description complete
- [ ] Privacy policy URL added
- [ ] App icon uploaded
- [ ] Build uploaded successfully
- [ ] Version and build number correct
- [ ] Test account provided (if app requires login)

### 10.2 Submit

1. In App Store Connect, go to your app
2. Click **"Submit for Review"**
3. Answer any final questions
4. Click **"Submit"**

**Status**: "Waiting for Review"

---

## Step 11: App Review Process

### 11.1 Timeline

- **Initial Review**: 24-48 hours
- **Re-review** (if rejected): 24-48 hours after resubmission

### 11.2 Common Rejection Reasons

1. **Missing Privacy Policy**: Ensure URL is accessible
2. **Crashing**: Test thoroughly before submission
3. **Incomplete Functionality**: All features must work
4. **Misleading Content**: Screenshots must match app
5. **Missing Permissions**: Ensure all permission descriptions are clear

### 11.3 If Rejected

1. Read rejection reason carefully
2. Fix issues
3. Update build if needed
4. Resubmit

---

## Step 12: After Approval

### 12.1 App Goes Live

- App appears in App Store within 24 hours
- Users can download immediately
- You'll receive email notification

### 12.2 Monitor

- **App Store Connect**: View downloads, ratings, reviews
- **Analytics**: Set up App Store Connect Analytics
- **Reviews**: Respond to user reviews

---

## Quick Reference Commands

```bash
# Login to EAS
eas login

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Update app version (before building)
# Edit app.json: version and buildNumber
```

---

## Troubleshooting

### Build Fails

```bash
# Check build logs
eas build:view [build-id]

# Common issues:
# - Missing environment variables
# - Invalid app.json
# - Certificate issues
```

### Submission Fails

```bash
# Check submission status in App Store Connect
# Verify build is "Ready to Submit"
# Ensure all metadata is complete
```

### App Rejected

1. Read rejection email carefully
2. Check App Store Connect for details
3. Fix issues
4. Rebuild if needed: `eas build --platform ios --profile production`
5. Resubmit: `eas submit --platform ios`

---

## Next Steps After Launch

1. ✅ **Monitor Reviews**: Respond to user feedback
2. ✅ **Track Analytics**: Use App Store Connect Analytics
3. ✅ **Plan Updates**: Regular updates improve visibility
4. ✅ **Marketing**: Share on social media, website
5. ✅ **Iterate**: Use feedback to improve app

---

## Resources

- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer**: https://developer.apple.com
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS Submit Docs**: https://docs.expo.dev/submit/introduction/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/

---

## Support

If you encounter issues:

1. Check EAS build logs
2. Review App Store Connect status
3. Check Expo Discord: https://discord.gg/expo
4. Review Apple Developer Forums

---

**Good luck with your App Store submission! 🚀**

