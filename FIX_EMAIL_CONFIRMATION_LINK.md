# 🔗 Fix Email Confirmation Link Not Opening

## 🔍 Problem

When clicking the email confirmation link, Safari shows:
```
Safari can't open the page because it couldn't connect to the server.
```

## 🎯 Root Cause

The email confirmation link uses a development Expo URL (`exp://192.168.0.223:8081/--/(auth)/signin`) which:
- ❌ Only works when Expo dev server is running
- ❌ Safari can't open `exp://` URLs
- ❌ Not accessible from email links

## ✅ Solution: Configure Supabase Redirect URLs

### Step 1: Add Redirect URLs in Supabase

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Click **"Authentication"** → **"URL Configuration"**
3. Under **"Redirect URLs"**, add:
   - `focus:///(auth)/signin`
   - `exp://192.168.0.223:8081/--/(auth)/signin` (for development)
   - `exp://localhost:8081/--/(auth)/signin` (for local testing)

4. Click **"Save"**

### Step 2: Update Supabase Auth Settings

1. Go to: **Authentication** → **Settings**
2. Scroll to **"Email Auth"** section
3. Under **"Redirect URLs"**, make sure:
   - `focus:///(auth)/signin` is listed
   - Site URL is set to: `https://wqvevludffkemgicrfos.supabase.co`

### Step 3: Test Email Confirmation

1. Sign up again
2. Check email for confirmation link
3. Click the link
4. ✅ Should redirect to app (if installed) or show success page

---

## 🔧 Alternative Solution: Use Web Redirect

If deep links don't work, use a web redirect:

### Option 1: Create a Web Redirect Page

Create a simple HTML page that redirects to the app:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Confirmed</title>
  <script>
    // Try to open app
    window.location.href = 'focus:///(auth)/signin';
    
    // Fallback: redirect to app store or show message
    setTimeout(function() {
      document.body.innerHTML = '<h1>Email Confirmed!</h1><p>You can now sign in to the Focus app.</p>';
    }, 2000);
  </script>
</head>
<body>
  <p>Redirecting to app...</p>
</body>
</html>
```

Host this page and use its URL as the redirect URL.

### Option 2: Use Supabase Callback URL

1. Use Supabase's callback URL: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
2. Configure Supabase to redirect to app after callback
3. Handle the session in the app

---

## 📱 For Production: Use Universal Links (iOS) / App Links (Android)

### iOS Universal Links

1. Configure in `app.json`:
```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:yourapp.com"]
    }
  }
}
```

2. Create `apple-app-site-association` file on your website
3. Use web URL in email: `https://yourapp.com/auth/confirm`

### Android App Links

1. Configure in `app.json`:
```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "yourapp.com",
              "pathPrefix": "/auth"
            }
          ]
        }
      ]
    }
  }
}
```

---

## 🚀 Quick Fix for Development

**For now, the easiest solution:**

1. **Disable email confirmation** (for testing):
   - Go to: **Authentication** → **Settings**
   - Turn OFF "Enable email confirmations"
   - Users sign in immediately after sign-up

2. **Or manually confirm**:
   - Go to: **Authentication** → **Users**
   - Find your user
   - Click "Confirm Email"

---

## 🔍 Verify Deep Linking Works

### Test Deep Link:

1. **On iOS Simulator:**
   ```bash
   xcrun simctl openurl booted "focus:///(auth)/signin"
   ```

2. **On Physical Device:**
   - Open Safari
   - Type: `focus:///(auth)/signin`
   - Should open the app

3. **Check if app scheme is registered:**
   - Check `app.json` has `"scheme": "focus"`
   - Rebuild app if needed

---

## 📋 Checklist

- [ ] Add redirect URLs in Supabase Dashboard
- [ ] Update email redirect URL in code
- [ ] Test deep link opens app
- [ ] Test email confirmation link
- [ ] For production: Set up universal links/app links

---

## 🆘 Still Not Working?

### Check These:

1. **App Scheme Registered:**
   - Verify `app.json` has `"scheme": "focus"`
   - Rebuild app if changed

2. **Supabase Redirect URLs:**
   - Check URLs are added in Dashboard
   - No typos in URLs

3. **Email Link Format:**
   - Check email link includes correct redirect URL
   - Verify Supabase is using the redirect URL

4. **Deep Link Handling:**
   - Check `app/_layout.tsx` handles deep links
   - Verify `Linking.addEventListener` is set up

---

## 💡 Recommended Approach

**For Development:**
- ✅ Disable email confirmation
- ✅ Faster testing workflow

**For Production:**
- ✅ Use universal links/app links
- ✅ Or use web redirect page
- ✅ Better user experience

