# 🧪 Complete Testing Guide

## 🚀 Quick Start - Test with Vercel Backend (Recommended)

### Step 1: Update Frontend to Use Vercel Backend

Create/update `.env` file in project root:
```env
EXPO_PUBLIC_API_URL=https://focus-psi-one.vercel.app/api
EXPO_PUBLIC_SUPABASE_URL=https://wqvevludffkemgicrfos.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1
```

### Step 2: Start Frontend Only

**Terminal:**
```bash
npm start
```

**No backend needed!** Vercel is hosting your backend.

### Step 3: Open App

- **iOS Simulator**: Press `i` in the terminal
- **Physical iPhone**: Scan QR code with Expo Go app
- **Web Browser**: Press `w` (limited features)

---

## 🏠 Option 2: Test Locally (Development)

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

**✅ Verify**: Visit http://localhost:3001/api/health
- Should return: `{"status":"ok","timestamp":"..."}`

### Step 2: Configure Frontend for Local Backend

**For iOS Simulator/Web:**
Create `.env` file:
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_SUPABASE_URL=https://wqvevludffkemgicrfos.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1
```

**For Physical Device:**
1. Find your local IP:
   ```bash
   ipconfig getifaddr en0  # Mac
   # Example: 192.168.0.223
   ```

2. Update `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.0.223:3001/api
   EXPO_PUBLIC_SUPABASE_URL=https://wqvevludffkemgicrfos.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1
   ```

### Step 3: Start Frontend

**Terminal 2:**
```bash
npm start
```

**Options:**
- **iOS Simulator**: Press `i`
- **Physical iPhone**: Scan QR code with Expo Go app
- **Web Browser**: Press `w`

---

## ✅ Testing Checklist

### 🔐 Authentication Tests

- [ ] **Sign Up with Email**
  1. Open app → Tap "Sign Up"
  2. Enter email and password
  3. Tap "Sign Up"
  4. ✅ Should show "Check your email" message
  5. ✅ Check email for verification link
  6. ✅ Click link → Should verify and sign in

- [ ] **Sign In with Email**
  1. Open app → Tap "Sign In"
  2. Enter email and password
  3. Tap "Sign In"
  4. ✅ Should sign in successfully
  5. ✅ Profile tab shows your email

- [ ] **Sign In with Google**
  1. Open app → Tap "Sign In"
  2. Tap "Continue with Google"
  3. ✅ Should redirect to Google sign-in
  4. ✅ Sign in with Google account
  5. ✅ Should redirect back to app
  6. ✅ Should be signed in

- [ ] **Sign Out**
  1. Go to Profile tab
  2. Tap "Sign Out"
  3. ✅ Should sign out successfully
  4. ✅ Should return to Sign In screen

### 📝 Record Tab Tests

- [ ] **Type and Save Idea**
  1. Go to Record tab
  2. Type an idea in the text box
  3. (Optional) Select a category
  4. Tap "Save"
  5. ✅ Idea should save successfully
  6. ✅ Should appear in "Recent Ideas" section

- [ ] **Select Category**
  1. Type an idea
  2. Tap "📁 Category (Optional)"
  3. ✅ Should show category picker modal
  4. Select a category (e.g., "Business")
  5. ✅ Category should be selected
  6. Save idea
  7. ✅ Idea should be assigned to category

- [ ] **Auto-Categorization**
  1. Type an idea without selecting category
  2. Tap "Save"
  3. ✅ Backend should auto-categorize
  4. ✅ Idea should appear in a category
  5. ✅ Or show "Suggested Category" modal

- [ ] **View Recent Ideas**
  1. Save multiple ideas
  2. ✅ Should see up to 3 recent ideas
  3. ✅ Should see "View All" button if more than 3
  4. Tap "View All"
  5. ✅ Should show all ideas
  6. ✅ Should see category badges next to ideas

- [ ] **Edit Idea**
  1. Tap on a recent idea
  2. ✅ Should open idea detail page
  3. Tap edit icon
  4. ✅ Should allow editing text
  5. ✅ Should allow changing category
  6. Save changes
  7. ✅ Changes should be saved

### 📁 Notes Tab Tests

- [ ] **View Categories**
  1. Go to Notes tab
  2. ✅ Should see all categories
  3. ✅ Should see idea count for each category

- [ ] **View Ideas in Category**
  1. Tap on a category
  2. ✅ Should show all ideas in that category
  3. ✅ Should be able to tap idea to view details

- [ ] **Create New Category**
  1. Go to Notes tab
  2. Tap "+" or "Create Category"
  3. Enter category name
  4. ✅ Should create category
  5. ✅ Should appear in list

- [ ] **Change Category**
  1. Open an idea
  2. Tap category selector
  3. Select different category
  4. ✅ Should update category
  5. ✅ Idea should move to new category

### 🔍 Search Tab Tests

- [ ] **Semantic Search**
  1. Go to Search tab
  2. Type a search query (e.g., "business ideas")
  3. Tap "Search"
  4. ✅ Should show relevant ideas
  5. ✅ Results should match meaning, not just keywords

- [ ] **AI Fallback**
  1. Search for something that doesn't exist
  2. ✅ Should show AI-generated answer
  3. ✅ Answer should be relevant to your notes

- [ ] **Date-Based Queries**
  1. Search "what did I record yesterday?"
  2. ✅ Should show ideas from yesterday
  3. ✅ Or AI answer about recent ideas

### ✅ To-Do Tab Tests

- [ ] **Add Todo**
  1. Go to To-Do tab
  2. Type a task
  3. Tap "Add" or press Enter
  4. ✅ Should add task to list
  5. ✅ Should show progress bar

- [ ] **Complete Todo**
  1. Tap checkbox next to task
  2. ✅ Should mark as completed
  3. ✅ Progress bar should update

- [ ] **Delete Todo**
  1. Swipe left on task (or tap delete)
  2. ✅ Should remove task
  3. ✅ Progress bar should update

- [ ] **Reset Today**
  1. Complete some tasks
  2. Tap "Reset Today"
  3. ✅ Should reset all tasks to incomplete
  4. ✅ Progress bar should reset

### 👤 Profile Tab Tests

- [ ] **View Profile**
  1. Go to Profile tab
  2. ✅ Should show email address
  3. ✅ Should show sign out button

- [ ] **View Stats** (if implemented)
  1. Check Profile tab
  2. ✅ Should show idea count
  3. ✅ Should show category count

---

## 🐛 Troubleshooting

### Backend Issues

**"Port 3001 already in use":**
```bash
lsof -ti:3001 | xargs kill -9
cd backend && npm run dev
```

**"Network request failed" (Local):**
- Check backend is running: `curl http://localhost:3001/api/health`
- Check `.env` has correct `EXPO_PUBLIC_API_URL`
- For physical device, use IP address instead of `localhost`

**"Network request failed" (Vercel):**
- Check Vercel deployment is successful
- Visit: https://focus-psi-one.vercel.app/api/health
- Should return: `{"status":"ok"}`
- If not, check Vercel dashboard for errors

**"Invalid or expired token":**
- Sign out and sign back in
- Check Supabase Auth is configured correctly
- Check backend has correct `SUPABASE_SERVICE_ROLE_KEY`

### Frontend Issues

**"Cannot connect to Expo":**
- Make sure phone and computer on same WiFi
- Check firewall isn't blocking port 8081
- Try manual connection: `exp://YOUR_IP:8081`

**"App crashes on startup":**
- Check Metro bundler logs for errors
- Try clearing cache: `npx expo start -c`
- Check all environment variables are set

**"Keyboard doesn't hide":**
- Tap outside the text input
- Tap the keyboard icon button
- Press "Done" on keyboard

### Authentication Issues

**"Invalid credentials":**
- Check email/password are correct
- Try signing up again
- Check Supabase Auth logs

**"Google OAuth keeps loading":**
- Check Google OAuth is configured in Supabase
- Check redirect URLs are correct
- Try signing out and signing in again

**"Email verification link doesn't work":**
- Check email spam folder
- Check Supabase email templates
- Try requesting new verification email

---

## 📊 Expected Behavior

### Successful Flow:

```
1. Open App
   ↓
2. Sign In (Email or Google)
   ↓
3. Record Tab → Type Idea → Save
   ↓
4. Idea Auto-Categorized or Manual Category Selected
   ↓
5. Notes Tab → See Idea in Category
   ↓
6. Search Tab → Find Idea by Meaning
   ↓
7. To-Do Tab → Add Tasks → Complete Tasks
   ↓
8. Profile Tab → View Stats → Sign Out
```

---

## 🎯 Quick Test Commands

```bash
# Test Vercel backend health
curl https://focus-psi-one.vercel.app/api/health

# Test local backend health
curl http://localhost:3001/api/health

# Check if ports are in use
lsof -i :3001  # Backend
lsof -i :8081  # Expo/Metro

# Restart everything
# Terminal 1 (Backend - if testing locally):
cd backend && npm run dev

# Terminal 2 (Frontend):
npm start
```

---

## ✅ Success Indicators

You'll know everything works when:

1. ✅ App opens without errors
2. ✅ Can sign in (email or Google)
3. ✅ Can create ideas
4. ✅ Ideas are auto-categorized
5. ✅ Can search and find ideas
6. ✅ Can edit ideas and change categories
7. ✅ To-do list works
8. ✅ Profile shows correct email

---

## 📝 Notes

- **Voice Recording**: Currently hidden (Phase 2)
- **Production Backend**: https://focus-psi-one.vercel.app
- **Local Backend**: http://localhost:3001
- **Supabase**: https://wqvevludffkemgicrfos.supabase.co

---

## 🆘 Need Help?

1. Check backend logs (Terminal 1)
2. Check frontend logs (Terminal 2)
3. Check Vercel deployment logs
4. Check Supabase Auth logs
5. Check browser console (if testing on web)
