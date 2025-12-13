# Quick Start Guide - Testing Focus App

## 🚀 Step-by-Step Testing Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including Expo, React Native, and NativeWind.

### 2. Create Placeholder Assets (Required)

The app needs icon and splash screen files. For now, you can use Expo's default assets or create simple placeholders:

**Option A: Use Expo's asset generation (Recommended)**
```bash
npx expo install expo-asset
```

Then create simple placeholder files, or temporarily comment out the asset references in `app.json`.

**Option B: Create minimal placeholder images**
- `assets/icon.png` - 1024x1024px (can be a solid color image)
- `assets/splash.png` - 1242x2436px (can be a solid color image)
- `assets/adaptive-icon.png` - 1024x1024px
- `assets/favicon.png` - 48x48px

### 3. Start the Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Show a QR code in your terminal
- Open Expo DevTools in your browser

### 4. Run on iOS Simulator

**Option A: From the terminal**
```bash
npm run ios
```

**Option B: From Expo DevTools**
- Press `i` in the terminal where `npm start` is running
- Or click "Run on iOS simulator" in the browser DevTools

**Prerequisites:**
- Xcode installed (from Mac App Store)
- iOS Simulator available (comes with Xcode)
- At least one iOS simulator set up

### 5. Run on Physical iPhone (Optional)

1. Install **Expo Go** app from the App Store on your iPhone
2. Make sure your iPhone and computer are on the same WiFi network
3. Scan the QR code from the terminal with your iPhone camera
4. Open in Expo Go app

### 6. Run on Web Browser (For Quick Testing)

```bash
npm run web
```

This will open the app in your default browser. Note: Some features (like voice recording) won't work on web.

---

## ✅ What Works Right Now

Since this is the skeleton app, here's what you can test:

### ✅ UI & Navigation
- **4-tab navigation** - All tabs are accessible
- **Authentication screens** - Sign in/Sign up UI (won't actually authenticate without backend)
- **Dark mode** - Toggle system dark mode to see it in action
- **Navigation flow** - Tap through screens, use back buttons

### ✅ Visual Design
- **iOS-native styling** - Proper spacing, colors, typography
- **Safe area handling** - Works on all iPhone models
- **Animations** - Smooth transitions between screens

### ⚠️ What Doesn't Work Yet (Needs Backend)

- **Sign in/Sign up** - Will show errors (expected, no backend connected)
- **Recording ideas** - Button works but won't save (no backend)
- **Viewing ideas** - Empty states will show (no data)
- **Search** - Won't return results (no backend)
- **Profile stats** - Will show loading/error (no backend)

---

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules
npm install
```

### Metro bundler cache issues
```bash
npm start -- --clear
```

### iOS Simulator not opening
- Make sure Xcode is installed: `xcode-select --print-path`
- Open Xcode once to accept license agreements
- Try: `open -a Simulator` then `npm run ios`

### Port already in use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
npm start
```

### NativeWind styles not working
```bash
# Clear cache and restart
npm start -- --clear
```

---

## 📱 Testing Checklist

- [ ] App launches without errors
- [ ] Can navigate between all 4 tabs
- [ ] Sign in screen displays correctly
- [ ] Sign up screen displays correctly
- [ ] Record tab shows the red button
- [ ] Inbox shows empty state
- [ ] Search shows empty state
- [ ] Profile shows stats section
- [ ] Dark mode works (toggle in iOS Settings)
- [ ] Back buttons work on detail screens
- [ ] No console errors (check Metro bundler output)

---

## 🎯 Next Steps After Testing UI

1. **Set up Backend API** (Vercel + Supabase)
   - Create Supabase project
   - Set up database schema
   - Create Vercel API routes
   - Update `src/config/api.ts` with your API URL

2. **Implement Voice Recording**
   - Wire up expo-av for recording
   - Add audio upload functionality
   - Connect to transcription API

3. **Add AI Features**
   - OpenAI Whisper for transcription
   - Vector embeddings for semantic search
   - Clustering algorithm

4. **Test End-to-End**
   - Record an idea
   - Verify it appears in Inbox
   - Test semantic search
   - Check auto-clustering

---

## 💡 Tips

- **Hot Reload**: Changes auto-reload in simulator (no need to restart)
- **Debugging**: Use React Native Debugger or Chrome DevTools
- **Console Logs**: Check Metro bundler terminal for logs
- **Performance**: Use React DevTools Profiler for performance testing

