# Local Testing Guide - Google OAuth Setup

## 🚀 Quick Start Testing

### Step 1: Start Backend Server

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Expected Output:**
```
🚀 Focus API server running on port 3001
📡 Environment: development
✅ Supabase connected
✅ AIMLAPI configured
```

**✅ Check**: Visit http://localhost:3001/api/health
- Should return: `{"status":"ok","timestamp":"..."}`

---

### Step 2: Start Frontend

**Terminal 2:**
```bash
npm start
```

**Expected Output:**
```
Metro waiting on exp://192.168.0.223:8081
› Press i │ open iOS simulator
› Press w │ open web
› Scan QR code above with Expo Go
```

**Options:**
- **iOS Simulator**: Press `i`
- **Physical iPhone**: Scan QR code with Expo Go app
- **Web Browser**: Press `w` (limited features)

---

### Step 3: Test Google OAuth

1. **Open the app** (simulator or Expo Go)

2. **Go to Sign In page**:
   - Should see "Continue with Google" button

3. **Tap "Continue with Google"**:
   - Should redirect to Google sign-in page
   - Sign in with your Google account
   - Should redirect back to app
   - Should be signed in successfully

4. **Verify Sign In**:
   - Check Profile tab shows your email
   - Should be able to create ideas
   - Should be able to access all features

---

## ✅ Testing Checklist

### Backend Tests:
- [ ] Backend server starts without errors
- [ ] Health endpoint works: `http://localhost:3001/api/health`
- [ ] Supabase connection successful
- [ ] No CORS errors in console

### Frontend Tests:
- [ ] App opens in simulator/Expo Go
- [ ] Sign In page loads
- [ ] "Continue with Google" button visible
- [ ] Google OAuth redirect works
- [ ] Sign in successful
- [ ] User email displayed in Profile
- [ ] Can create ideas
- [ ] Can record voice (if testing on device)
- [ ] Can search ideas
- [ ] Can edit notes

### Google OAuth Tests:
- [ ] Google sign-in page appears
- [ ] Can select Google account
- [ ] Redirects back to app after sign-in
- [ ] Session persists (app remembers you)
- [ ] Can sign out and sign back in

---

## 🐛 Troubleshooting

### Backend Issues

**"Port 3001 already in use":**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
# Or change port in backend/.env
PORT=3002
```

**"Supabase connection error":**
- Check `backend/.env` has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify Supabase project is active

**"AIMLAPI error":**
- Check `backend/.env` has `AIML_API_KEY`
- Verify API key is valid

### Frontend Issues

**"Network request failed":**
- Check backend is running
- Check `.env` has correct `EXPO_PUBLIC_API_URL`
- For physical device, use IP address: `http://YOUR_IP:3001/api`

**"Cannot connect to Expo":**
- Make sure phone and computer on same WiFi
- Check firewall isn't blocking port 8081
- Try manual connection: `exp://YOUR_IP:8081`

### Google OAuth Issues

**"redirect_uri_mismatch":**
- Check Google Cloud Console → OAuth Client → Redirect URIs
- Must include: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`

**"invalid_client":**
- Check Supabase → Authentication → Providers → Google
- Verify Client ID and Secret are correct
- Make sure using **Web** client credentials (not iOS/Android)

**"App doesn't redirect back":**
- Check Supabase → Authentication → URL Configuration
- Redirect URLs should include: `focus://auth/v1/callback`
- Check deep linking is enabled in `app/_layout.tsx`

**"Google sign-in page doesn't appear":**
- Check Google OAuth consent screen is configured
- Check app is in "Testing" mode (add test users)
- Or publish app for production use

---

## 📱 Testing on Physical Device

### Step 1: Find Your Local IP

**Mac:**
```bash
ipconfig getifaddr en0
# Or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Example Output:** `192.168.0.223`

### Step 2: Update Frontend `.env`

Create/update `.env` file in project root:
```env
EXPO_PUBLIC_API_URL=http://192.168.0.223:3001/api
EXPO_PUBLIC_SUPABASE_URL=https://wqvevludffkemgicrfos.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1
```

**Replace `192.168.0.223` with your actual IP**

### Step 3: Restart Frontend

```bash
# Stop current server (Ctrl+C)
npm start
```

### Step 4: Connect Device

- Make sure phone and computer on same WiFi
- Scan QR code with Expo Go app
- Or enter manually: `exp://192.168.0.223:8081`

---

## 🧪 Test Scenarios

### Scenario 1: New User Sign Up with Google
1. Open app
2. Tap "Sign Up"
3. Tap "Continue with Google"
4. Sign in with Google
5. ✅ Should create account and sign in

### Scenario 2: Existing User Sign In with Google
1. Open app
2. Tap "Sign In"
3. Tap "Continue with Google"
4. Sign in with same Google account
5. ✅ Should sign in successfully

### Scenario 3: Email/Password Sign In
1. Open app
2. Enter email and password
3. Tap "Sign In"
4. ✅ Should sign in successfully

### Scenario 4: Create Idea After Google Sign In
1. Sign in with Google
2. Go to Record tab
3. Type an idea
4. Tap "Save"
5. ✅ Should save idea successfully

---

## 📊 Expected Behavior

### Successful Google OAuth Flow:

```
App → "Continue with Google" 
  → Google Sign-In Page 
  → User Signs In 
  → Redirect to Supabase Callback 
  → Supabase Processes OAuth 
  → Redirect Back to App (focus://auth/v1/callback)
  → App Detects Session 
  → User Signed In ✅
```

### If Something Goes Wrong:

1. **Check browser console** (if testing on web)
2. **Check Metro bundler logs** (terminal where `npm start` runs)
3. **Check backend logs** (terminal where `npm run dev` runs)
4. **Check Supabase logs**: Dashboard → Logs → Auth Logs

---

## 🎯 Quick Test Commands

```bash
# Test backend health
curl http://localhost:3001/api/health

# Test backend with authentication (will fail without token)
curl http://localhost:3001/api/ideas

# Check if ports are in use
lsof -i :3001  # Backend
lsof -i :8081  # Expo/Metro

# Restart everything
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
npm start
```

---

## ✅ Success Indicators

You'll know everything works when:

1. ✅ Backend starts without errors
2. ✅ Frontend connects to backend
3. ✅ Google sign-in button appears
4. ✅ Clicking Google button opens Google sign-in
5. ✅ After signing in, you're redirected back to app
6. ✅ App shows you're signed in (check Profile tab)
7. ✅ You can create ideas, search, etc.

---

## 📝 Notes

- **First time**: Google OAuth may take a few seconds to redirect
- **Testing mode**: If app is in "Testing" mode, only added test users can sign in
- **Deep linking**: Make sure deep linking works (already configured in `app/_layout.tsx`)
- **Session persistence**: App should remember you after closing and reopening

