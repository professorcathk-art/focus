# 🔧 Supabase Redirect URL Setup for Mobile OAuth

## ❌ Problem

Supabase's redirect URL field only accepts **HTTP/HTTPS URLs**, not app schemes like `focus://`.

## ✅ Solution: Use Supabase Callback URL

### Step 1: Add Supabase Callback URL

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Click **"Authentication"** → **"URL Configuration"**
3. Under **"Redirect URLs"**, add:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
4. Click **"Save"**

**Note:** This URL is usually already configured by Supabase, but verify it's in the list.

### Step 2: Configure Site URL (Optional but Recommended)

1. In the same **"URL Configuration"** page
2. Set **"Site URL"** to:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
   Or leave it as default Supabase URL

3. Click **"Save"**

---

## 🔄 How It Works

1. **User clicks "Continue with Google"**
   - OAuth URL uses Supabase callback: `https://...supabase.co/auth/v1/callback`
   - Browser opens for Google sign-in

2. **User signs in with Google**
   - Google redirects to Supabase callback URL
   - Supabase processes OAuth and creates session

3. **Supabase redirects**
   - Supabase callback page shows success message
   - The callback URL includes tokens in the URL
   - User manually opens app (or we can improve this)

4. **App detects session**
   - When app opens, it checks for session
   - Session is already created by Supabase
   - User is signed in

---

## 🚀 Better Solution: Custom Redirect Page

If you want automatic redirect to app, host a redirect page:

### Option 1: Host on Vercel/Netlify

1. **Deploy the redirect page** (`public/oauth-redirect.html`) to:
   - Vercel
   - Netlify
   - Or any web hosting

2. **Add redirect URL in Supabase:**
   ```
   https://yourdomain.com/oauth-redirect.html
   ```

3. **Update code to use custom redirect:**
   ```typescript
   redirectTo: "https://yourdomain.com/oauth-redirect.html"
   ```

### Option 2: Use Supabase Callback (Current)

- Works but requires manual app opening
- Simpler setup
- Good for testing

---

## 📋 Current Setup (Recommended for Now)

**What to add in Supabase:**
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

**How it works:**
1. Google → Supabase callback (web page)
2. Supabase processes OAuth
3. Shows success page
4. User opens app manually
5. App detects session ✅

---

## 🔧 Alternative: Configure Site URL

Some users report that setting **Site URL** to the app scheme works:

1. Go to **"URL Configuration"**
2. Set **"Site URL"** to: `focus://`
3. Try adding redirect URL: `focus:///(auth)/signin`

**Note:** This might not work as Supabase validates URLs strictly.

---

## ✅ Recommended Approach

**For now, use Supabase callback URL:**

1. ✅ Add `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback` to redirect URLs
2. ✅ User signs in → Redirects to callback page
3. ✅ Callback page shows success
4. ✅ User opens app → Session detected ✅

**For better UX later:**
- Host custom redirect page
- Automatically redirects to app
- Seamless experience

---

## 🧪 Test

1. Add callback URL to Supabase
2. Try Google sign-in
3. Should redirect to Supabase callback page (not localhost)
4. Open app manually
5. Should be signed in

