# How to Get Google OAuth Client Secret

## 🔐 Step-by-Step Guide

### Step 1: Go to Google Cloud Console

1. **Visit Google Cloud Console**:
   - Go to: https://console.cloud.google.com/
   - Sign in with your Google account

### Step 2: Select or Create a Project

1. **Click the project dropdown** (top left, next to "Google Cloud")
2. **Either**:
   - Select an existing project, OR
   - Click "New Project"
     - Project name: "Focus App" (or any name)
     - Click "Create"
     - Wait for project creation (takes a few seconds)

### Step 3: Enable APIs (If Needed)

1. **Go to APIs & Services**:
   - Click the hamburger menu (☰) → "APIs & Services" → "Library"
   - Or go directly: https://console.cloud.google.com/apis/library

2. **Enable Google+ API** (if not already enabled):
   - Search for "Google+ API"
   - Click on it
   - Click "Enable"

### Step 4: Configure OAuth Consent Screen

**⚠️ Important**: You must configure this BEFORE creating OAuth credentials!

1. **Go to OAuth Consent Screen**:
   - Click "APIs & Services" → "OAuth consent screen"
   - Or go directly: https://console.cloud.google.com/apis/credentials/consent

2. **Choose User Type**:
   - **External** (for public users) - Recommended
   - **Internal** (only if you have Google Workspace)
   - Click "Create"

3. **Fill in App Information**:
   - **App name**: `Focus` (or any name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
   - Click "Save and Continue"

4. **Add Scopes** (if prompted):
   - Click "Add or Remove Scopes"
   - Select:
     - `email`
     - `profile`
     - `openid`
   - Click "Update"
   - Click "Save and Continue"

5. **Add Test Users** (if in Testing mode):
   - Add your email address
   - Click "Save and Continue"

6. **Review and Submit**:
   - Review the summary
   - Click "Back to Dashboard"

### Step 5: Create OAuth 2.0 Credentials

1. **Go to Credentials**:
   - Click "APIs & Services" → "Credentials"
   - Or go directly: https://console.cloud.google.com/apis/credentials

2. **Create OAuth Client ID**:
   - Click "Create Credentials" (top of page)
   - Select "OAuth client ID"

3. **If prompted about consent screen**:
   - Click "Configure Consent Screen" and complete Step 4 above
   - Then come back to this step

4. **Select Application Type**:
   - Choose: **Web application** (for Supabase)
   - Click "Create"

5. **Configure Web Application**:
   - **Name**: `Focus Web (Supabase)` (or any name)
   - **Authorized redirect URIs**: Click "Add URI"
     - Add: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
     - Click "Add"
   - Click "Create"

### Step 6: Copy Your Credentials

**🎉 You'll see a popup with your credentials:**

```
OAuth client created

Your Client ID
xxxxx-xxxxx.apps.googleusercontent.com

Your Client Secret
GOCSPX-xxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANT**: 
- **Copy both immediately** - you won't see the Client Secret again!
- If you close this popup, you'll need to create new credentials

**What to Copy:**

1. **Client ID** (for OAuth):
   - Format: `xxxxx-xxxxx.apps.googleusercontent.com`
   - This is your **Client ID**

2. **Client Secret** (for OAuth):
   - Format: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`
   - This is your **Client Secret** ⬅️ **This is what you're looking for!**

### Step 7: Add to Supabase

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
   - Navigate to: **Authentication** → **Providers**

2. **Enable Google Provider**:
   - Find **Google** in the list
   - Toggle it to **Enabled**

3. **Add Credentials**:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret ⬅️ **This is it!**
   - Click "Save"

## ✅ Done!

Your Google OAuth is now configured. Users can sign in with Google!

---

## 🔍 Can't Find Your Client Secret?

### If You Already Created Credentials:

1. **Go to Credentials page**:
   - https://console.cloud.google.com/apis/credentials

2. **Find your OAuth 2.0 Client ID**:
   - Look for the one you created (name: "Focus Web (Supabase)")

3. **Click on it**:
   - You'll see the Client ID
   - **But Client Secret is hidden** (for security)

4. **To See Client Secret Again**:
   - ⚠️ **You can't!** Google doesn't show it again for security
   - **Solution**: Create a new OAuth client ID
   - Or reset the secret (if available)

### Reset Client Secret:

1. **Click on your OAuth Client ID**
2. **Click "Reset Secret"** (if available)
3. **Copy the new secret immediately**

---

## 📝 Quick Checklist

- [ ] Google Cloud Console account created
- [ ] Project created/selected
- [ ] OAuth consent screen configured
- [ ] Web application OAuth client created
- [ ] Redirect URI added: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
- [ ] **Client ID copied**
- [ ] **Client Secret copied** ⬅️ **This is what you need!**
- [ ] Credentials added to Supabase
- [ ] Google provider enabled in Supabase

---

## 🎯 Summary

**Client Secret Location:**
- **Source**: Google Cloud Console
- **Path**: APIs & Services → Credentials → OAuth 2.0 Client IDs
- **When**: Right after creating the OAuth client (in popup)
- **Format**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`

**Important**: Copy it immediately - you won't see it again!

