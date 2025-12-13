# 📱 Expo Go OAuth Setup

## 🔍 Important: Expo Go vs Native App

When testing with **Expo Go**, deep linking works differently than a native app:

- **Expo Go:** Uses `exp://` scheme (e.g., `exp://192.168.0.223:8081/--/(auth)/signin`)
- **Native App:** Uses `focus://` scheme (e.g., `focus:///(auth)/signin`)

---

## ✅ Configuration for Expo Go

### Step 1: Supabase Redirect URLs

Add **both** URLs to Supabase:

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Click **"Authentication"** → **"URL Configuration"**
3. Under **"Redirect URLs"**, add:
   ```
   exp://192.168.0.223:8081/--/(auth)/signin
   ```
   (Replace `192.168.0.223` with your actual IP address)

4. Also add (for when you build native app):
   ```
   focus:///(auth)/signin
   ```

5. Click **"Save"**

### Step 2: Google Cloud Console

Add the **Expo URL** to Google's authorized redirect URIs:

1. Go to: https://console.cloud.google.com/
2. **APIs & Services** → **Credentials**
3. Edit your **Web OAuth Client**
4. Under **"Authorized redirect URIs"**, add:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
   (This is what Supabase uses - Google redirects here first)

5. Click **"Save"**

---

## 🔄 How It Works with Expo Go

1. **User clicks "Continue with Google"**
   - App generates OAuth URL with `exp://` redirect
   - Browser opens

2. **User signs in with Google**
   - Google redirects to Supabase callback
   - Supabase processes OAuth

3. **Supabase redirects**
   - Tries to redirect to `exp://192.168.0.223:8081/--/(auth)/signin`
   - Expo Go should intercept this and open the app

4. **App receives deep link**
   - Deep link handler processes the callback
   - Session is detected
   - User signed in ✅

---

## 🐛 If Deep Link Doesn't Work in Expo Go

### Option 1: Manual App Opening

1. After Google sign-in, Supabase callback page shows success
2. **Manually open Expo Go app**
3. App should detect session automatically
4. User signed in ✅

### Option 2: Use Supabase Callback Page

1. Let it redirect to Supabase callback page
2. Page shows "Email confirmed" or success message
3. **Manually open Expo Go app**
4. Check auth state - should be signed in

---

## 📋 For Production (Native App)

When you build a native app with EAS Build:

1. **Remove Expo URLs** from Supabase redirect URLs
2. **Keep only:** `focus:///(auth)/signin`
3. **Update Google Cloud Console** if needed
4. Deep linking will work automatically

---

## ✅ Current Setup (Works with Expo Go)

**Code automatically detects:**
- Expo Go → Uses `exp://` scheme
- Native app → Uses `focus://` scheme

**You just need to:**
1. Add Expo URL to Supabase redirect URLs
2. Make sure Google Cloud Console has callback URL
3. Test!

---

## 🧪 Test Flow

1. **Add redirect URLs** in Supabase (Expo URL)
2. **Reload app** in Expo Go
3. **Click "Continue with Google"**
4. **Sign in with Google**
5. **If app doesn't open automatically:**
   - Manually open Expo Go
   - Should be signed in ✅

---

## 💡 Why This Happens

**Expo Go:**
- Not a "real" installed app
- Uses `exp://` scheme
- Deep linking works but might need manual app opening

**Native App:**
- Properly installed app
- Uses `focus://` scheme
- Deep linking works automatically

The code now handles both automatically! Just make sure to add the Expo URL to Supabase redirect URLs.

