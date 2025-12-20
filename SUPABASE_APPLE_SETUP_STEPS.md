# Supabase Apple Sign-In Setup - Final Steps

## ✅ What You Have

- **JWT Token**: Generated (see below)
- **Team ID**: `YUNUL5V5R6`
- **Key ID**: `U3ZQ3S6AK6`
- **Service ID**: `com.focuscircle.signin`

## 📋 Your Generated JWT Token

Copy this entire token (it's long, make sure you get it all):

```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlUzWlEzUzZBSzYifQ.eyJpc3MiOiJZVU5VTDVWNVI2IiwiaWF0IjoxNzY2MDY1MzA0LCJleHAiOjE3ODE2MTczMDQsImF1ZCI6Imh0dHBzOi8vYXBwbGVpZC5hcHBsZS5jb20iLCJzdWIiOiJjb20uZm9jdXNjaXJjbGUuc2lnbmluIn0.wbwc74x3uRwaX6YU1beiCFZlAUgertYxUhdaMiGZzfqE4lOt3PdYqeYJs69ybB2CIz88nF7nbcPiZS-5GNaxnA
```

**⏰ Expires**: June 16, 2026 (180 days from now)

---

## 🚀 Step-by-Step: Configure Supabase

### Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Sign in if needed

### Step 2: Navigate to Apple Provider

1. Click **"Authentication"** in the left sidebar
2. Click **"Providers"** tab
3. Scroll down to find **"Apple"** provider
4. Click the toggle to **Enable** it (or click on it to open settings)

### Step 3: Fill in Apple Credentials

Fill in these fields:

**Client ID (Service ID)**:
```
com.focuscircle.signin
```

**Secret Key (JWT)**:
```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlUzWlEzUzZBSzYifQ.eyJpc3MiOiJZVU5VTDVWNVI2IiwiaWF0IjoxNzY2MDY1MzA0LCJleHAiOjE3ODE2MTczMDQsImF1ZCI6Imh0dHBzOi8vYXBwbGVpZC5hcHBsZS5jb20iLCJzdWIiOiJjb20uZm9jdXNjaXJjbGUuc2lnbmluIn0.wbwc74x3uRwaX6YU1beiCFZlAUgertYxUhdaMiGZzfqE4lOt3PdYqeYJs69ybB2CIz88nF7nbcPiZS-5GNaxnA
```

**Team ID**:
```
YUNUL5V5R6
```

**Key ID**:
```
U3ZQ3S6AK6
```

### Step 4: Save Configuration

1. Click **"Save"** button
2. You should see a success message

---

## ✅ Verify Service ID Configuration

Before testing, make sure your Service ID is configured correctly:

### Check Service ID Return URLs

1. Go to: https://developer.apple.com/account
2. Navigate to: **Certificates, Identifiers & Profiles** → **Identifiers**
3. Find your Service ID: `com.focuscircle.signin`
4. Click on it to edit
5. Under **"Sign in with Apple"**, click **"Configure"**
6. Verify **Return URLs** includes:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
7. If not, add it and **Save**

---

## ✅ Verify Supabase Redirect URLs

**Important**: Supabase only accepts HTTP/HTTPS URLs, not app scheme URLs like `focus://` or `exp://`.

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Under **"Redirect URLs"**, add only:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
   (This is for email confirmation and Google OAuth)

3. **Do NOT add** `focus://` or `exp://` URLs - Supabase will reject them with "Please provide a valid URL" error

4. **Why Apple Sign-In doesn't need deep link URLs:**
   - Apple Sign-In uses **native iOS authentication** (no browser redirect)
   - The app receives the identity token directly from Apple
   - The app sends the token to Supabase using `signInWithIdToken`
   - No redirect URLs are needed for Apple Sign-In flow

---

## 🧪 Test Apple Sign-In

### On iOS Device (Physical Device Required)

1. Make sure you're signed in with an Apple ID on your device
2. Open your app (Expo Go or native build)
3. Go to Sign In or Sign Up screen
4. Tap **"Continue with Apple"** button
5. You should see Apple Sign-In prompt
6. Authenticate with Face ID/Touch ID or password
7. Should redirect back to app and sign you in ✅

### Troubleshooting

**"Sign in with Apple is not available"**
- Make sure you're signed in with Apple ID on device (Settings → Sign in to your iPhone)

**"Invalid client"**
- Verify Service ID matches exactly: `com.focuscircle.signin`
- Check that Service ID has "Sign in with Apple" enabled

**"Invalid secret key"**
- Make sure you pasted the entire JWT token (it's very long)
- Verify no extra spaces or line breaks
- Check that JWT hasn't expired

**App doesn't receive callback**
- Verify Supabase redirect URLs are configured
- Check that deep linking is working (`focus://` scheme)

---

## 📝 Summary Checklist

- [x] Generated JWT token
- [ ] Configured Supabase Apple provider with:
  - [ ] Client ID: `com.focuscircle.signin`
  - [ ] Secret Key: (JWT token)
  - [ ] Team ID: `YUNUL5V5R6`
  - [ ] Key ID: `U3ZQ3S6AK6`
- [ ] Verified Service ID Return URL is configured
- [ ] Verified Supabase Redirect URLs are configured
- [ ] Tested Apple Sign-In on iOS device

---

## 🔄 Future: Regenerate JWT

**Important**: This JWT expires on **June 16, 2026**. Before then:

1. Run `node generate-apple-jwt.js` again
2. Copy the new JWT
3. Update it in Supabase → Authentication → Providers → Apple → Secret Key
4. Save

Set a reminder for **June 1, 2026** to regenerate!

---

## 🎉 You're Done!

Once you've configured Supabase with the credentials above, Apple Sign-In should work in your app!

