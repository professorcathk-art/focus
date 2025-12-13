# Google OAuth Setup Guide

## 📱 Bundle ID / Package Name (繫結編號)

**For iOS:**
- **Bundle Identifier**: `com.focus.app`
- **Location**: `app.json` → `ios.bundleIdentifier`

**For Android:**
- **Package Name**: `com.focus.app`
- **Location**: `app.json` → `android.package`

## 🔧 Step-by-Step Google OAuth Setup

### Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project** (or select existing):
   - Click "Select a project" → "New Project"
   - Name: "Focus App" (or any name)
   - Click "Create"

3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure OAuth consent screen first:
     - User Type: External (or Internal if using Google Workspace)
     - App name: "Focus"
     - User support email: Your email
     - Developer contact: Your email
     - Click "Save and Continue"
     - Scopes: Add `email`, `profile`, `openid`
     - Click "Save and Continue"
     - Test users: Add your email (if in testing mode)
     - Click "Save and Continue"

5. **Create OAuth Client ID**:
   - Application type: **iOS** (for iOS app)
   - Name: "Focus iOS"
   - **Bundle ID**: `com.focus.app` ⬅️ **This is your 繫結編號**
   - Click "Create"
   - **Save the Client ID** (you'll need this)

6. **Create Another OAuth Client ID for Android**:
   - Application type: **Android**
   - Name: "Focus Android"
   - **Package name**: `com.focus.app` ⬅️ **This is your 繫結編號**
   - **SHA-1 certificate fingerprint**: (Optional for now, needed for production)
   - Click "Create"
   - **Save the Client ID**

7. **Create Web Client ID** (for Supabase):
   - Application type: **Web application**
   - Name: "Focus Web (Supabase)"
   - **Authorized redirect URIs**: Add:
     ```
     https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
     ```
   - Click "Create"
   - **Save both Client ID and Client Secret** ⬅️ **You need these for Supabase**

### Step 2: Supabase Dashboard Setup

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
   - Navigate to **Authentication** → **Providers**

2. **Enable Google Provider**:
   - Find **Google** in the providers list
   - Toggle it to **Enabled**

3. **Add Google Credentials**:
   - **Client ID (for OAuth)**: Paste the **Web Client ID** from Google Cloud Console
   - **Client Secret (for OAuth)**: Paste the **Client Secret** from Google Cloud Console
   - Click "Save"

4. **Configure Redirect URLs**:
   - Go to **Authentication** → **URL Configuration**
   - **Site URL**: `focus://`
   - **Redirect URLs**: Add these:
     ```
     focus://auth/v1/callback
     exp://192.168.0.223:8081
     ```

### Step 3: Test Google OAuth

1. **Start your app**:
   ```bash
   npm start
   ```

2. **Open in Expo Go**:
   - Scan QR code with your phone
   - Or press `i` for iOS simulator

3. **Test Google Login**:
   - Go to Sign In or Sign Up page
   - Tap "Continue with Google"
   - Should redirect to Google sign-in
   - After signing in, should redirect back to app

## ✅ Testing Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] iOS OAuth client created with Bundle ID `com.focus.app`
- [ ] Android OAuth client created with Package `com.focus.app`
- [ ] Web OAuth client created with redirect URI
- [ ] Supabase Google provider enabled
- [ ] Client ID and Secret added to Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Tested Google login in app

## 🐛 Troubleshooting

**"redirect_uri_mismatch" error:**
- Make sure redirect URI in Google Cloud Console matches exactly: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`

**"invalid_client" error:**
- Check that Client ID and Secret are correct in Supabase
- Make sure you're using the **Web** client credentials, not iOS/Android

**App doesn't redirect back:**
- Check that redirect URLs are configured in Supabase
- Make sure deep linking is set up (already done in `app/_layout.tsx`)

## 📝 Notes

- **Bundle ID / Package Name** (`com.focus.app`) is used for:
  - iOS app identification
  - Android app identification
  - Google OAuth client configuration
  - App Store / Play Store submission

- The **Web Client ID** is what Supabase uses, not the iOS/Android client IDs
- iOS/Android client IDs are used when building native apps with EAS Build

