# TestFlight Setup Guide

## Can I Update My Code After TestFlight?

**✅ YES!** You can update your app anytime:

1. **Make code changes**
2. **Update version** in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",  // Increment version
       "ios": {
         "buildNumber": "2"  // Increment build number
       }
     }
   }
   ```
3. **Rebuild:** `eas build --platform ios --profile production`
4. **Resubmit:** `eas submit --platform ios`

TestFlight will automatically notify testers of the new version!

## Step 1: Build for Production

Run this command in your terminal (you'll need to enter your Apple ID):

```bash
cd /Users/mickeylau/focus
eas build --platform ios --profile production
```

**What will happen:**
- EAS will ask for your Apple ID and password
- It will create certificates automatically
- Build will take ~10-20 minutes
- You'll get a download link when complete

## Step 2: Submit to TestFlight

After the build completes:

```bash
eas submit --platform ios
```

**What will happen:**
- EAS will upload your app to App Store Connect
- App will appear in TestFlight
- You can add testers via App Store Connect

## Step 3: Add Testers

1. Go to https://appstoreconnect.apple.com
2. Navigate to your app → TestFlight
3. Add internal testers (up to 100)
4. Or add external testers (requires App Review)

## Updating Your App

### Quick Update Process:

```bash
# 1. Make your code changes
# ... edit files ...

# 2. Update version in app.json
# Change version and buildNumber

# 3. Commit changes
git add .
git commit -m "Update: new feature X"

# 4. Rebuild
eas build --platform ios --profile production

# 5. Resubmit
eas submit --platform ios
```

### Version Numbering:

- **Version** (`1.0.0` → `1.0.1`): User-facing version
- **Build Number** (`1` → `2`): Internal build counter

**Rule:** Each TestFlight submission needs a higher build number.

## Requirements

- ✅ Apple Developer Account ($99/year)
- ✅ App Store Connect access
- ✅ EAS Build account (free tier available)

## Benefits of TestFlight

- ✅ Easy distribution to testers
- ✅ Automatic notifications
- ✅ Crash reporting
- ✅ Feedback collection
- ✅ No App Store review needed for internal testers

## Troubleshooting

### "Apple account login failed"
- Check your Apple ID and password
- Enable 2FA if required
- Use App-Specific Password if 2FA is enabled

### "Build failed"
- Check build logs: `eas build:view [build-id]`
- Verify app.json is valid
- Check for missing dependencies

### "Submit failed"
- Ensure build completed successfully
- Verify App Store Connect access
- Check that version/build number increased

## Next Steps

1. **Run the build command** (in your terminal, not through me):
   ```bash
   eas build --platform ios --profile production
   ```

2. **Enter your Apple ID** when prompted

3. **Wait for build** (~10-20 minutes)

4. **Submit to TestFlight:**
   ```bash
   eas submit --platform ios
   ```

5. **Add testers** in App Store Connect

## Remember

- ✅ You can always rebuild and resubmit
- ✅ Each update needs a new build number
- ✅ TestFlight makes updates easy for testers
- ✅ No App Store review needed for internal testers

