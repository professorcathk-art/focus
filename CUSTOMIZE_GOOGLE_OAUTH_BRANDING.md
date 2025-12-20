# Customize Google OAuth Consent Screen Branding

## Overview
When users sign in with Google, they see the OAuth consent screen. The domain shown (`wqvevludffkemgicrfos.supabase.co`) is determined by the redirect URI, but you can customize the app name and branding in Google Cloud Console.

## Steps to Customize

### 1. Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one used for Google OAuth)

### 2. Configure OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **User Type**:
   - **Internal**: Only for users in your Google Workspace organization
   - **External**: For all Google users (recommended for public apps)
3. Click **Create** or **Edit**

### 3. Fill in App Information
- **App name**: `Focus Circle` (or `Focus circle`)
- **User support email**: Your email address
- **App logo**: Upload your app icon (optional, but recommended)
- **App domain**: Your domain (if you have one)
- **Application home page**: Your app's website URL
- **Privacy policy link**: Your privacy policy URL
- **Terms of service link**: Your terms of service URL

### 4. Add Scopes (if needed)
- Click **Add or Remove Scopes**
- Select the scopes your app needs:
  - `openid` (default)
  - `email` (default)
  - `profile` (default)
- Click **Update**

### 5. Add Test Users (if app is in Testing mode)
- If your app is in "Testing" mode, add test user emails
- Users not in the list will see a warning

### 6. Publish Your App (if ready)
- Once you've configured everything, click **Publish App**
- This makes your app available to all Google users

## What Users Will See

After configuration, users will see:
- **App name**: "Focus Circle" (instead of generic text)
- **Your logo**: If you uploaded one
- **Domain**: Still shows `wqvevludffkemgicrfos.supabase.co` (this cannot be changed when using Supabase)
- **Message**: "Focus Circle wants to access your Google Account"

## Important Notes

1. **Domain Cannot Be Changed**: The redirect URI domain (`wqvevludffkemgicrfos.supabase.co`) will always appear in the consent screen when using Supabase. This is expected and users understand that Supabase handles authentication.

2. **App Verification**: If you request sensitive scopes or have many users, Google may require app verification.

3. **Branding Impact**: While the domain shows Supabase, a well-configured consent screen with your app name and logo will make it clear that users are signing into YOUR app.

## Current Status

Your Google OAuth is configured to use Supabase's redirect URI:
- Redirect URI: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
- This is registered in Google Cloud Console under **Authorized redirect URIs**

## Verification

After updating the OAuth consent screen:
1. Sign out of your Google account (or use incognito mode)
2. Try signing in with Google in your app
3. You should see "Focus Circle" in the consent screen

## Troubleshooting

If changes don't appear:
- Wait a few minutes for Google to propagate changes
- Clear browser cache
- Try in incognito/private mode
- Check that you're editing the correct Google Cloud project

