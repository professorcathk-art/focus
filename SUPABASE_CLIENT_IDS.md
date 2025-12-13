# Supabase Client IDs Guide

## 🔑 Two Types of Client IDs

### 1. Supabase's Own API Keys (Already Configured)

These are Supabase's credentials for your project:

**📍 Where to Find:**
- Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
- Navigate to: **Settings** → **API**

**Your Current Keys:**
- **Project URL**: `https://wqvevludffkemgicrfos.supabase.co`
- **Anon/Public Key**: `sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1`
  - ✅ Used in frontend (safe to expose)
  - ✅ Already configured in `src/config/api.ts`
  
- **Service Role Key**: `sb_secret_ibfITkcedN5ttOZNu_579w_wEG3VBbl`
  - ⚠️ Used in backend only (keep secret!)
  - ✅ Already configured in `backend/.env`

**Status**: ✅ Already configured, no action needed

---

### 2. Google OAuth Client IDs (Need to Create)

These are from **Google Cloud Console** and need to be added to Supabase for Google login.

**📍 Where to Get:**
- Go to: https://console.cloud.google.com/
- Create OAuth 2.0 credentials (see `GOOGLE_OAUTH_SETUP.md`)

**What You Need:**
1. **Google Web Client ID** (from Google Cloud Console)
   - Format: `xxxxx.apps.googleusercontent.com`
   - Used by Supabase to authenticate with Google
   
2. **Google Client Secret** (from Google Cloud Console)
   - Format: `GOCSPX-xxxxx`
   - Used by Supabase to authenticate with Google

**📍 Where to Add in Supabase:**
- Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
- Navigate to: **Authentication** → **Providers** → **Google**
- Paste:
  - **Client ID (for OAuth)**: Your Google Web Client ID
  - **Client Secret (for OAuth)**: Your Google Client Secret
- Click "Save"

**Status**: ⚠️ Need to create these in Google Cloud Console first

---

## 📋 Quick Reference

### Supabase API Keys (Already Have):
```
Project URL: https://wqvevludffkemgicrfos.supabase.co
Anon Key: sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1
Service Role Key: sb_secret_ibfITkcedN5ttOZNu_579w_wEG3VBbl
```

### Google OAuth Client IDs (Need to Create):
```
Web Client ID: [Create in Google Cloud Console]
Client Secret: [Create in Google Cloud Console]
```

---

## 🔍 How to Find Your Supabase Keys

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/wqvevludffkemgicrfos

2. **Go to Settings → API**:
   - You'll see:
     - **Project URL**
     - **anon/public key** (for frontend)
     - **service_role key** (for backend - keep secret!)

3. **Copy the keys**:
   - Frontend uses: `anon/public` key
   - Backend uses: `service_role` key

---

## 🎯 Summary

**For Google OAuth Setup:**
- ✅ Supabase keys: Already configured
- ⚠️ Google Client IDs: Need to create in Google Cloud Console
- 📖 See `GOOGLE_OAUTH_SETUP.md` for step-by-step instructions

**For Regular App Usage:**
- ✅ All Supabase keys already configured
- ✅ No additional setup needed
- ✅ App works without Google OAuth

---

## 💡 Important Notes

1. **Supabase Anon Key**: Safe to expose (used in frontend)
2. **Supabase Service Role Key**: Keep secret! (backend only)
3. **Google Client IDs**: Create in Google Cloud Console, then add to Supabase
4. **Google OAuth**: Optional feature - app works without it

