# Where to Use Supabase Callback URL

## 🔗 The Callback URL

```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

## 📍 Where to Add This URL

### Location: Google Cloud Console

**Step-by-Step:**

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Navigate to Credentials**:
   - Click "APIs & Services" → "Credentials"
   - Or go directly: https://console.cloud.google.com/apis/credentials

3. **Create OAuth 2.0 Client ID** (or edit existing):
   - Click "Create Credentials" → "OAuth client ID"
   - OR click on an existing OAuth client to edit it

4. **Select Application Type**:
   - Choose: **Web application**

5. **Add Authorized Redirect URI**:
   - Find the field: **"Authorized redirect URIs"**
   - Click **"Add URI"** button
   - Paste this URL:
     ```
     https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
     ```
   - Click **"Add"** (or "Done")

6. **Save**:
   - Click "Create" (if creating new) or "Save" (if editing)

## 🎯 Visual Guide

```
Google Cloud Console
└── APIs & Services
    └── Credentials
        └── OAuth 2.0 Client IDs
            └── [Your OAuth Client]
                └── Authorized redirect URIs
                    └── [Add URI Button]
                        └── Paste: https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

## ✅ Complete Setup Checklist

When creating Google OAuth credentials, you need:

1. **Application Type**: Web application ✅
2. **Name**: "Focus Web (Supabase)" ✅
3. **Authorized redirect URIs**: 
   - ✅ `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
4. **Client ID**: Copy this ✅
5. **Client Secret**: Copy this ✅

## 🔄 How It Works

1. **User clicks "Sign in with Google"** in your app
2. **App redirects to Google** for authentication
3. **User signs in with Google**
4. **Google redirects back** to Supabase callback URL:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
5. **Supabase processes** the OAuth response
6. **Supabase redirects** back to your app (via deep link)

## ⚠️ Important Notes

### Must Match Exactly:
- The URL in Google Cloud Console **must match exactly** what Supabase expects
- No trailing slashes
- Must be `https://` (not `http://`)
- Must include `/auth/v1/callback` path

### Multiple Redirect URIs:
You can add multiple redirect URIs if needed:
- `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback` (for production)
- `http://localhost:3000/auth/v1/callback` (for local testing, if needed)

### For Your App:
Since you're using Supabase Auth, you only need:
- ✅ `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`

## 🐛 Troubleshooting

**"redirect_uri_mismatch" error:**
- Check that the URL in Google Cloud Console matches exactly
- No extra spaces or characters
- Must be `https://` (not `http://`)
- Must end with `/auth/v1/callback`

**"invalid_client" error:**
- Make sure you're using the correct OAuth client (Web application type)
- Check that redirect URI is added to the same client you're using

## 📝 Summary

**Where**: Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs

**What to add**: 
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

**When**: When creating/editing Google OAuth credentials for Supabase

**Why**: So Google knows where to redirect users after they sign in

