# Apple Sign In - Requirements

## Short Answer
**No, you cannot add Apple Sign In without a paid Apple Developer account.**

## Why?

Apple Sign In requires:
1. **Apple Developer Program membership** ($99/year)
2. **App ID with Sign in with Apple capability**
3. **Provisioning profiles** with the capability enabled
4. **Entitlements** that are only available to paid accounts

## What You CAN Do Without Paid Account

### Option 1: Test in Expo Go (Development Only)
- You can test Apple Sign In in Expo Go during development
- Use `expo-apple-authentication` package
- **Limitation**: Cannot build for production or TestFlight/App Store

### Option 2: Use Alternative Authentication
- **Email/Password** (already implemented ✅)
- **Google OAuth** (can be fixed - see GOOGLE_OAUTH_FIX.md)
- **Magic Link** (email-based, no password)
- **Phone Number** (SMS verification)

### Option 3: Wait Until You Have Paid Account
- Implement Apple Sign In later when you're ready to publish
- The code structure is already in place
- Just need to add the capability when you have the account

## Current Status

Your app currently supports:
- ✅ Email/Password authentication
- ⚠️ Google OAuth (needs Supabase configuration - see GOOGLE_OAUTH_FIX.md)
- ❌ Apple Sign In (requires paid Apple Developer account)

## Recommendation

1. **Fix Google OAuth first** - It's free and works without paid accounts
2. **Use Email/Password as primary** - Most reliable option
3. **Add Apple Sign In later** - When you're ready to publish to App Store

## If You Want to Add Apple Sign In Later

When you have a paid Apple Developer account:

1. Install package:
   ```bash
   npx expo install expo-apple-authentication
   ```

2. Configure in `app.json`:
   ```json
   {
     "expo": {
       "ios": {
         "usesAppleSignIn": true
       }
     }
   }
   ```

3. Add to Supabase:
   - Go to Authentication → Providers
   - Enable Apple provider
   - Configure with your Apple Developer credentials

4. Implement in `src/store/auth-store.ts`:
   - Similar to `signInWithGoogle` but using Apple authentication

## Cost Comparison

- **Email/Password**: Free ✅
- **Google OAuth**: Free ✅
- **Apple Sign In**: Requires $99/year Apple Developer account ❌
