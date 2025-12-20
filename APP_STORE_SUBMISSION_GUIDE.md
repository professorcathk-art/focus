# App Store Submission Guide - Focus Circle

## Prerequisites Checklist ✅

Before submitting to the App Store, ensure you have:

- [ ] Apple Developer Account (paid membership: $99/year)
- [ ] App Store Connect access
- [ ] App icons and screenshots ready
- [ ] Privacy policy URL
- [ ] App description and keywords prepared
- [ ] Production build tested thoroughly

## Step 1: Apple Developer Account Setup

### 1.1 Enroll in Apple Developer Program
1. Go to [developer.apple.com](https://developer.apple.com)
2. Click **Enroll** → **Start Your Enrollment**
3. Complete enrollment (requires credit card, $99/year)
4. Wait for approval (usually 24-48 hours)

### 1.2 Verify App ID
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **App IDs**
4. Verify your App ID exists: `com.focuscircle`
5. Ensure **Sign In with Apple** capability is enabled
6. Ensure **Push Notifications** capability is enabled (if needed)

## Step 2: App Store Connect Setup

### 2.1 Create App Record
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Focus Circle (or your preferred name)
   - **Primary Language**: English (or your preferred)
   - **Bundle ID**: `com.focuscircle` (select from dropdown)
   - **SKU**: `focus-circle-ios` (unique identifier, can be anything)
   - **User Access**: Full Access (or Limited Access if using team)
4. Click **Create**

### 2.2 App Information
1. In App Store Connect, go to your app
2. Click **App Information**
3. Fill in:
   - **Category**: 
     - Primary: Productivity (or Lifestyle, Utilities)
     - Secondary: (optional)
   - **Subtitle**: Brief tagline (30 characters max)
   - **Privacy Policy URL**: Your privacy policy URL (required)
   - **Support URL**: Your support/help URL
   - **Marketing URL**: (optional) Your website

### 2.3 Pricing and Availability
1. Click **Pricing and Availability**
2. Set:
   - **Price**: Free (or set price)
   - **Availability**: All countries (or select specific)
   - **Pre-Order**: No (unless doing pre-order)

## Step 3: Prepare App Assets

### 3.1 App Icon
- **Required sizes**:
  - 1024x1024px (PNG, no transparency, no alpha channel)
  - Must be square
  - No rounded corners (iOS will add them)
- **Location**: `assets/icon.png`
- **Format**: PNG, RGB color space

### 3.2 Screenshots
- **Required for iPhone**:
  - 6.7" Display (iPhone 14 Pro Max, 15 Pro Max): 1290 x 2796 pixels
  - 6.5" Display (iPhone 11 Pro Max, XS Max): 1242 x 2688 pixels
  - 5.5" Display (iPhone 8 Plus): 1242 x 2208 pixels
- **Minimum**: At least 3 screenshots required
- **Recommended**: 5-10 screenshots showing key features
- **Tips**:
  - Show your app's best features
  - Use real content (not placeholder text)
  - Include Today page, Record page, Search page
  - Show Apple Sign-In if available

### 3.3 App Preview Video (Optional but Recommended)
- **Format**: MP4 or MOV
- **Duration**: 15-30 seconds
- **Size**: Same as screenshots
- **Content**: Show app in action

### 3.4 Description and Keywords
- **Name**: Focus Circle (30 characters max)
- **Subtitle**: Brief tagline (30 characters max)
- **Description**: 
  - First 3 lines are most important (shown in search)
  - Up to 4000 characters
  - Include key features, benefits
  - Use bullet points for readability
- **Keywords**: 
  - Up to 100 characters
  - Comma-separated
  - Example: "productivity,tasks,todo,notes,ideas,voice recording,AI"

## Step 4: Configure Production Build

### 4.1 Update app.json for Production
Verify these settings in `app.json`:

```json
{
  "expo": {
    "name": "Focus Circle",
    "slug": "focus-circle",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.focuscircle",
      "buildNumber": "1",
      "supportsTablet": true,
      "usesAppleSignIn": true,
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Focus needs access to your microphone to record your ideas.",
        "NSSpeechRecognitionUsageDescription": "Focus uses speech recognition to transcribe your ideas."
      }
    }
  }
}
```

### 4.2 Create/Update eas.json
Create `eas.json` in project root:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "simulator": false
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-vercel-backend.vercel.app/api"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YUNUL5V5R6"
      }
    }
  }
}
```

### 4.3 Set Production Environment Variables
1. Create `.env.production` file:
```env
EXPO_PUBLIC_API_URL=https://your-vercel-backend.vercel.app/api
EXPO_PUBLIC_SUPABASE_URL=https://wqvevludffkemgicrfos.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. Or set in EAS secrets:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-vercel-backend.vercel.app/api
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://wqvevludffkemgicrfos.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-anon-key
```

## Step 5: Build Production App

### 5.1 Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 5.2 Login to EAS
```bash
eas login
```

### 5.3 Configure EAS Build
```bash
eas build:configure
```

### 5.4 Build for Production
```bash
eas build --platform ios --profile production
```

**This will:**
- Build your app in the cloud
- Take 15-30 minutes
- Generate an `.ipa` file
- Upload to App Store Connect automatically (if configured)

### 5.5 Alternative: Build Locally
```bash
eas build --platform ios --profile production --local
```

**Note**: Requires Xcode and signing certificates configured.

## Step 6: App Store Connect Submission

### 6.1 Upload Build
If build didn't auto-upload:
1. Go to App Store Connect → Your App
2. Click **TestFlight** tab
3. Wait for build to appear (may take 10-30 minutes)
4. Once processed, it will appear in **iOS Builds**

### 6.2 Complete App Store Listing
1. Go to **App Store** tab
2. Click **+ Version or Platform** → **iOS App**
3. Fill in:

   **Version Information:**
   - Version: `1.0.0` (must match app.json)
   - Build: Select the build you just uploaded
   - What's New: Release notes (what's new in this version)

   **App Preview and Screenshots:**
   - Upload screenshots for each required device size
   - Upload app preview video (optional)

   **Description:**
   - Paste your app description
   - Add keywords
   - Add support URL
   - Add marketing URL (optional)

   **App Review Information:**
   - **Contact Information**: Your contact details
   - **Demo Account**: Create a test account for reviewers
     - Email: `reviewer@yourdomain.com`
     - Password: `Reviewer123!`
   - **Notes**: Any special instructions for reviewers
   - **Attachments**: (optional) Additional info

   **Version Release:**
   - **Automatically release this version**: Yes (or manual)
   - **Release this version to**: All countries (or specific)

### 6.3 Content Rights
1. Answer questions about:
   - Third-party content
   - Music/audio content
   - User-generated content
   - Age rating

### 6.4 Pricing
1. Set price (Free or paid)
2. Set availability (all countries or specific)

### 6.5 App Privacy
1. Click **App Privacy**
2. Answer questions about data collection:
   - **Name**: Collected
   - **Email**: Collected (for account creation)
   - **User Content**: Collected (ideas, todos, notes)
   - **Audio Data**: Collected (voice recordings)
   - **Usage Data**: Not collected (or collected if you use analytics)
   - **Diagnostics**: Not collected (or collected if you use crash reporting)
3. For each data type:
   - **Purpose**: Select purposes (e.g., App Functionality, Analytics)
   - **Linked to User**: Yes/No
   - **Used for Tracking**: Yes/No
   - **Data Collected**: Yes/No

## Step 7: Submit for Review

### 7.1 Final Checklist
- [ ] App icon uploaded (1024x1024)
- [ ] Screenshots uploaded (all required sizes)
- [ ] Description complete
- [ ] Keywords added
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] Demo account created
- [ ] App Privacy questions answered
- [ ] Build uploaded and selected
- [ ] Version number matches app.json
- [ ] All required fields filled

### 7.2 Submit
1. Click **Add for Review** button (top right)
2. Review all information
3. Click **Submit for Review**

### 7.3 Review Process
- **Timeline**: Usually 24-48 hours (can be up to 7 days)
- **Status**: Check in App Store Connect → **App Review** tab
- **Possible outcomes**:
  - ✅ **Approved**: App goes live automatically (if auto-release enabled)
  - ⚠️ **Rejected**: You'll receive feedback, fix issues, resubmit
  - 📝 **In Review**: Still being reviewed

## Step 8: Post-Submission

### 8.1 Monitor Review Status
- Check App Store Connect daily
- Respond to any reviewer questions quickly
- Fix any issues if rejected

### 8.2 Common Rejection Reasons
- Missing privacy policy
- Missing demo account
- App crashes during review
- Missing required permissions descriptions
- Incomplete app functionality
- Misleading app description

### 8.3 After Approval
- App goes live automatically (if auto-release enabled)
- Monitor App Store Connect for:
  - Downloads
  - Ratings and reviews
  - Crash reports
  - Performance metrics

## Step 9: Update Process (Future Versions)

When updating your app:

1. **Update version** in `app.json`:
   ```json
   "version": "1.0.1"  // Increment version
   "ios": {
     "buildNumber": "2"  // Increment build number
   }
   ```

2. **Build new version**:
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit update**:
   - Go to App Store Connect
   - Click **+ Version**
   - Select new build
   - Update "What's New"
   - Submit for review

## Important Notes

### Bundle ID
- Your bundle ID is: `com.focuscircle`
- Must match exactly in:
  - `app.json`
  - Apple Developer Portal
  - App Store Connect

### Sign In with Apple
- Already configured ✅
- Make sure it's enabled in:
  - Apple Developer Portal (App ID capabilities)
  - Supabase (Authentication → Providers → Apple)

### Google Sign-In
- Uses Supabase OAuth (web flow)
- No additional App Store configuration needed
- Make sure redirect URLs are configured correctly

### Privacy Policy
- **Required** for App Store submission
- Must be publicly accessible URL
- Should cover:
  - Data collection
  - Data usage
  - Third-party services (Supabase, Deepgram, etc.)
  - User rights

### Demo Account
- **Required** for App Store review
- Create a test account reviewers can use
- Include credentials in App Review Information

## Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure build
eas build:configure

# Build for production
eas build --platform ios --profile production

# View build status
eas build:list

# Submit to App Store (if not auto-submitted)
eas submit --platform ios --latest
```

## Timeline Estimate

- **Apple Developer Enrollment**: 24-48 hours
- **App Store Connect Setup**: 1-2 hours
- **Asset Preparation**: 2-4 hours
- **Build Process**: 15-30 minutes per build
- **App Review**: 24-48 hours (can be up to 7 days)
- **Total**: 3-7 days from start to live

## Support Resources

- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo App Store Submission](https://docs.expo.dev/submit/introduction/)

---

**Good luck with your App Store submission! 🚀**
