# 🔧 Expo.dev Setup Checklist

What to verify and configure on [expo.dev](https://expo.dev) before App Store submission.

## Your Project Info

- **Project ID**: `ba0a6b0e-1878-4fc4-8957-470a1f15c363`
- **Owner**: `chrislau`
- **Project URL**: https://expo.dev/accounts/chrislau/projects/focus

---

## Step 1: Verify Project Access

1. Go to https://expo.dev
2. Log in with your Expo account
3. Navigate to: **Projects** → **Focus**
4. Verify you can see:
   - Project dashboard
   - Builds history
   - Settings

---

## Step 2: Configure Apple Developer Credentials

### Option A: Let EAS Manage Credentials (Recommended)

When you run `eas build --platform ios --profile production` for the first time, EAS will:

1. **Prompt you to set up credentials**
2. **Ask for Apple Developer account**:
   - Apple ID email
   - App-specific password (if 2FA enabled)
   - Or: Upload your Apple Developer certificate

3. **EAS will automatically**:
   - Create certificates
   - Manage provisioning profiles
   - Handle signing

**You'll be prompted during the build**, but you can also set up in advance:

```bash
eas credentials
# Select: iOS
# Select: Set up credentials for production
# Follow prompts
```

### Option B: Manual Credential Setup (Advanced)

If you prefer to manage credentials yourself:

1. Go to: https://expo.dev/accounts/chrislau/projects/focus/credentials
2. Click **"iOS"** tab
3. Configure:
   - **Distribution Certificate**
   - **Provisioning Profile**
   - **Push Key** (if using push notifications)

---

## Step 3: App Store Connect API Key (For Automated Submission)

**Required for**: `eas submit --platform ios` to work automatically

### 3.1 Create API Key in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click your name (top right) → **"Users and Access"**
3. Go to **"Keys"** tab
4. Click **"+"** to create new key
5. Fill in:
   - **Name**: `EAS Submit Key` (or any name)
   - **Access**: **App Manager** (minimum required)
6. Click **"Generate"**
7. **Download the `.p8` key file** (you can only download once!)
8. **Note the Key ID** (shown after creation)

### 3.2 Add API Key to Expo

**Option A: Via EAS CLI** (Recommended)

```bash
eas credentials
# Select: iOS
# Select: App Store Connect API Key
# Enter:
#   - Key ID (from App Store Connect)
#   - Issuer ID (from App Store Connect → Users and Access → Keys)
#   - Path to .p8 file (or paste contents)
```

**Option B: Via Expo Dashboard**

1. Go to: https://expo.dev/accounts/chrislau/projects/focus/credentials
2. Click **"iOS"** tab
3. Scroll to **"App Store Connect API Key"**
4. Click **"Add"**
5. Enter:
   - **Key ID**
   - **Issuer ID**
   - **Key file** (upload `.p8` file)

**Note**: Without this, you'll need to manually upload builds via Transporter or Xcode.

---

## Step 4: Verify Environment Variables

Your `eas.json` already has environment variables configured:

```json
{
  "production": {
    "env": {
      "EXPO_PUBLIC_API_URL": "https://focus-psi-one.vercel.app/api",
      "EXPO_PUBLIC_SUPABASE_URL": "https://wqvevludffkemgicrfos.supabase.co",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1"
    }
  }
}
```

**Verify on Expo Dashboard**:

1. Go to: https://expo.dev/accounts/chrislau/projects/focus/settings
2. Check **"Environment Variables"** section
3. **Note**: Variables in `eas.json` are used during builds, but you can also set them in the dashboard for easier management

**Optional**: You can add these in the dashboard for easier updates without changing code.

---

## Step 5: Check Build Limits

1. Go to: https://expo.dev/accounts/chrislau/projects/focus/builds
2. Check your **build quota**:
   - **Free tier**: Limited builds per month
   - **Paid tier**: More builds available

**If you hit limits**:
- Wait for quota reset (monthly)
- Upgrade plan: https://expo.dev/accounts/chrislau/settings/billing

---

## Step 6: Verify Project Settings

1. Go to: https://expo.dev/accounts/chrislau/projects/focus/settings
2. Verify:
   - **Project Name**: Focus
   - **Slug**: focus
   - **Owner**: chrislau
   - **Bundle ID**: com.focus.app (should match `app.json`)

---

## Step 7: Test Build (Optional but Recommended)

Before submitting to App Store, test a production build:

```bash
# Build production version
eas build --platform ios --profile production
```

**Monitor build**:
- Terminal output
- Or: https://expo.dev/accounts/chrislau/projects/focus/builds

**Once complete**:
- Download `.ipa` file
- Test on physical device (via TestFlight or direct install)

---

## Step 8: Set Up App Store Connect API Key (For Submission)

**This is required for `eas submit` to work automatically.**

### 8.1 Get Issuer ID

1. Go to https://appstoreconnect.apple.com
2. Click your name → **"Users and Access"**
3. Go to **"Keys"** tab
4. **Issuer ID** is shown at the top (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 8.2 Create API Key

1. In **"Keys"** tab, click **"+"**
2. Name: `EAS Submit Key`
3. Access: **App Manager**
4. Click **"Generate"**
5. **Download `.p8` file** (only available once!)
6. **Note the Key ID**

### 8.3 Configure in EAS

```bash
eas credentials
# Select: iOS
# Select: App Store Connect API Key
# Enter:
#   - Key ID
#   - Issuer ID  
#   - Path to .p8 file
```

**Or via dashboard**:
1. https://expo.dev/accounts/chrislau/projects/focus/credentials
2. iOS → App Store Connect API Key → Add

---

## Quick Checklist

Before launching:

- [ ] Logged into expo.dev
- [ ] Can access project: https://expo.dev/accounts/chrislau/projects/focus
- [ ] Apple Developer credentials configured (via `eas credentials` or during first build)
- [ ] App Store Connect API Key set up (for automated submission)
- [ ] Environment variables verified in `eas.json`
- [ ] Test build completed successfully
- [ ] Build quota sufficient

---

## Common Issues

### "No credentials found"

**Solution**: Run `eas credentials` and set up iOS credentials

### "Build quota exceeded"

**Solution**: 
- Wait for monthly reset
- Or upgrade plan: https://expo.dev/accounts/chrislau/settings/billing

### "App Store Connect API Key not found"

**Solution**: Set up API key (see Step 8 above)

### "Invalid bundle identifier"

**Solution**: Ensure `app.json` → `ios.bundleIdentifier` matches App Store Connect

---

## Next Steps

Once everything is configured:

1. ✅ Build: `eas build --platform ios --profile production`
2. ✅ Submit: `eas submit --platform ios`
3. ✅ Monitor: https://expo.dev/accounts/chrislau/projects/focus/builds

---

## Resources

- **Expo Dashboard**: https://expo.dev/accounts/chrislau/projects/focus
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS Submit Docs**: https://docs.expo.dev/submit/introduction/
- **Credentials Management**: https://docs.expo.dev/app-signing/managed-credentials/

---

**Status**: ⏳ Ready to configure credentials on first build

