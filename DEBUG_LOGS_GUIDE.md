# 🔍 Debug Logs Guide - Where to Find Error Logs

## 📍 Where to Find Logs

### 1. **Frontend Logs (Most Important for Auth)**

**Location:** Terminal where you run `npm start`

**What to look for:**
```
[Auth] Sign in successful with Supabase
[Auth] Auth state changed: SIGNED_IN
Sign in error: [Error message]
```

**How to view:**
```bash
# Start frontend with verbose logging
npm start

# Look for:
# - "[Auth]" prefixed messages
# - "Sign in error:" messages
# - "Sign up error:" messages
# - "Google sign in error:" messages
```

**Enable More Logging:**
- Open React Native Debugger
- Check browser console (if testing on web)
- Check Expo Go app logs (shake device → "Show Dev Menu" → "Debug")

---

### 2. **Vercel Backend Logs**

**Location:** Vercel Dashboard

**How to access:**
1. Go to: https://vercel.com/dashboard
2. Click on your project: **focus-psi-one**
3. Click on **"Deployments"** tab
4. Click on the latest deployment
5. Click on **"Functions"** tab
6. Click on any function (e.g., `api/health`)
7. Scroll down to see **"Logs"** section

**Or use Vercel CLI:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# View logs
vercel logs focus-psi-one --follow
```

**What to look for:**
- API request logs
- Error messages
- Database connection errors
- AIMLAPI errors

**Note:** Auth routes (`/api/auth/signin`, `/api/auth/signup`) are deprecated and won't show auth errors since frontend uses Supabase Auth directly.

---

### 3. **Supabase Auth Logs** (Most Important for Login Issues)

**Location:** Supabase Dashboard

**How to access:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"Authentication"** in left sidebar
4. Click **"Logs"** tab

**What to look for:**
- Sign-in attempts
- Sign-up attempts
- OAuth redirects
- Email confirmation events
- Error messages

**Filter by:**
- Event type (SIGN_IN, SIGN_UP, TOKEN_REFRESHED)
- User email
- Time range

---

### 4. **Local Backend Logs** (If Testing Locally)

**Location:** Terminal where you run `cd backend && npm run dev`

**What to look for:**
```
🚀 Focus API server running on port 3001
📡 Environment: development
✅ Supabase connected
✅ AIMLAPI configured
```

**Enable More Logging:**
- Check `backend/server.js` for console.log statements
- Check route files for error logs

---

### 5. **Browser Console** (If Testing on Web)

**How to access:**
1. Open app in browser (`npm start` → press `w`)
2. Press `F12` or `Cmd+Option+I` (Mac)
3. Go to **"Console"** tab

**What to look for:**
- JavaScript errors
- Network request failures
- Supabase Auth errors
- React errors

---

### 6. **React Native Debugger** (For Mobile)

**How to access:**
1. Shake device (or press `Cmd+D` in simulator)
2. Select **"Debug"**
3. Browser DevTools will open
4. Check **"Console"** tab

**Or use Flipper:**
- Install Flipper: https://fbflipper.com/
- Connect device/simulator
- View logs in real-time

---

## 🐛 Common Login Errors & Where to Find Them

### Error: "Invalid credentials"

**Where to check:**
1. **Frontend logs** (Terminal): `Sign in error: Invalid login credentials`
2. **Supabase Auth Logs**: Check for failed sign-in attempts
3. **Browser Console**: Check for network errors

**Possible causes:**
- Wrong email/password
- Email not confirmed (check Supabase Auth Logs)
- User doesn't exist

---

### Error: "No session received"

**Where to check:**
1. **Frontend logs** (Terminal): `Sign up error: No session received`
2. **Supabase Auth Logs**: Check if user was created but email confirmation is pending

**Possible causes:**
- Email confirmation required (check email)
- Supabase email confirmation disabled but session not returned

---

### Error: "Google OAuth keeps loading"

**Where to check:**
1. **Frontend logs** (Terminal): `[Auth] Google sign in initiated`
2. **Browser Console**: Check for redirect errors
3. **Supabase Auth Logs**: Check for OAuth redirect events

**Possible causes:**
- Redirect URL mismatch
- Google OAuth not configured correctly
- Deep linking not working

---

### Error: "Network request failed"

**Where to check:**
1. **Frontend logs** (Terminal): Network errors
2. **Browser Console**: Failed fetch requests
3. **Vercel Logs**: Check if backend is down

**Possible causes:**
- Backend not running (if local)
- Wrong API URL in `.env`
- CORS issues
- Network connectivity

---

## 🔧 Enable Debug Logging

### Add More Logging to Auth Store

The auth store already has logging, but you can add more:

**File:** `src/store/auth-store.ts`

Look for:
- `console.log("[Auth] ...")` - Success messages
- `console.error("Sign in error:", error)` - Error messages

### Add Logging to Supabase Client

**File:** `src/lib/supabase.ts`

Add:
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase Auth] Event:', event);
  console.log('[Supabase Auth] Session:', session ? 'exists' : 'null');
});
```

---

## 📊 Real-Time Log Monitoring

### Option 1: Use Multiple Terminals

**Terminal 1:** Backend logs
```bash
cd backend && npm run dev
```

**Terminal 2:** Frontend logs
```bash
npm start
```

**Terminal 3:** Vercel logs (if using Vercel)
```bash
vercel logs focus-psi-one --follow
```

### Option 2: Use Log Aggregation

**For local development:**
```bash
# Combine both logs in one terminal
(npm start & cd backend && npm run dev) | tee combined.logs
```

---

## 🎯 Quick Debugging Steps

1. **Check Frontend Logs First**
   - Most auth errors appear here
   - Look for `[Auth]` prefixed messages

2. **Check Supabase Auth Logs**
   - Shows what Supabase sees
   - Most reliable for auth issues

3. **Check Browser Console** (if web)
   - Shows JavaScript errors
   - Shows network request details

4. **Check Vercel Logs** (if production)
   - Shows backend API calls
   - Shows database errors

5. **Check Network Tab** (Browser DevTools)
   - See actual HTTP requests
   - See request/response data
   - See error status codes

---

## 🔍 Example: Debugging "Invalid Credentials"

**Step 1:** Check frontend logs
```
Sign in error: Invalid login credentials
```

**Step 2:** Check Supabase Auth Logs
- Go to Supabase Dashboard → Authentication → Logs
- Look for failed sign-in attempt
- Check error message

**Step 3:** Check if email is confirmed
- Supabase Dashboard → Authentication → Users
- Find user by email
- Check "Email Confirmed" status

**Step 4:** Try signing up again
- If user doesn't exist, sign up
- Check email for confirmation link
- Confirm email
- Try signing in again

---

## 📝 Log Format Reference

### Frontend Auth Logs:
```
[Auth] Sign in successful with Supabase
[Auth] Sign up successful - email confirmation required
[Auth] Google sign in initiated, redirect URL: focus:///(auth)/signin
[Auth] Auth state changed: SIGNED_IN
Sign in error: Invalid login credentials
Sign up error: Account created! Please check your email...
```

### Backend Logs:
```
🚀 Focus API server running on port 3001
📡 Environment: development
✅ Supabase connected
✅ AIMLAPI configured
Error: [error message]
```

### Supabase Auth Logs:
- Event: `SIGN_IN`, `SIGN_UP`, `TOKEN_REFRESHED`, `SIGNED_OUT`
- Status: `SUCCESS`, `FAILURE`
- Error: Error message if failed

---

## 🆘 Still Can't Find the Error?

1. **Enable verbose logging:**
   - Add `console.log` statements in auth store
   - Check browser console for detailed errors

2. **Test with a simple request:**
   ```bash
   curl https://focus-psi-one.vercel.app/api/health
   ```

3. **Check environment variables:**
   - Verify `.env` file exists
   - Verify Supabase URL and keys are correct

4. **Check Supabase project status:**
   - Go to Supabase Dashboard
   - Verify project is active
   - Check for any service outages

