# Google Cloud Console OAuth Setup

## Authorized Redirect URI

In Google Cloud Console, you need to add **ONE** authorized redirect URI:

```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

## Why This URI?

The OAuth flow works like this:

1. **App** → Opens browser with Google OAuth
2. **Google** → User signs in
3. **Google** → Redirects to **Supabase callback URL** (this is what you configure in Google Cloud Console)
4. **Supabase** → Processes the OAuth response
5. **Supabase** → Redirects back to your app via deep link (`focus://` or `exp://`)

**Important**: Google Cloud Console only needs the Supabase callback URL. Google doesn't know about your app's deep link scheme (`focus://`). That's handled by Supabase after Google redirects back.

## Step-by-Step Setup

### 1. Go to Google Cloud Console
https://console.cloud.google.com/

### 2. Select Your Project
- Create a new project or select existing one

### 3. Enable Google+ API
- Go to **APIs & Services** → **Library**
- Search for "Google+ API"
- Click **Enable**

### 4. Create OAuth 2.0 Credentials
- Go to **APIs & Services** → **Credentials**
- Click **Create Credentials** → **OAuth 2.0 Client ID**
- Application type: **Web application**
- Name: "Focus App" (or any name)

### 5. Add Authorized Redirect URI
In the **Authorized redirect URIs** section, click **Add URI** and add:

```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

**Important Notes:**
- ✅ Use HTTPS (required)
- ✅ Include the full path `/auth/v1/callback`
- ✅ No trailing slash
- ✅ Exact match required (case-sensitive)

### 6. Copy Credentials
After creating, you'll see:
- **Client ID**: Copy this
- **Client Secret**: Copy this

### 7. Add to Supabase
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Navigate to **Authentication** → **Providers**
3. Find **Google** provider
4. Enable it
5. Paste:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
6. Save

## Complete OAuth Flow

```
User clicks "Continue with Google"
    ↓
App opens browser → Google OAuth page
    ↓
User signs in with Google
    ↓
Google redirects to: https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
    ↓
Supabase processes OAuth response
    ↓
Supabase redirects to: focus:///(auth)/signin (deep link)
    ↓
App receives deep link and completes authentication
```

## Multiple Environments?

If you have multiple Supabase projects (dev/staging/prod), add each callback URL:

```
https://your-dev-project.supabase.co/auth/v1/callback
https://your-prod-project.supabase.co/auth/v1/callback
```

## Troubleshooting

**Error: "redirect_uri_mismatch"**
- Check that the URI in Google Cloud Console matches exactly
- Must be HTTPS
- No trailing slash
- Full path: `/auth/v1/callback`

**Error: "invalid_client"**
- Verify Client ID and Secret are correct in Supabase
- Make sure Google OAuth is enabled in Supabase

**App doesn't receive callback**
- Check Supabase redirect URLs configuration
- Verify deep linking is working (`focus://` scheme)
