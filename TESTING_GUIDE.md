# Testing Guide - How to Test Your App Now

## 🚀 Quick Start Testing

### Option 1: Test Locally (No GitHub/Vercel Needed)

**For Local Testing:**

1. **Start Backend Server** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   - Server runs on: `http://localhost:3001`
   - ✅ No GitHub/Vercel needed for local testing

2. **Start Frontend** (Terminal 2):
   ```bash
   npm start
   ```
   - Opens Expo DevTools
   - Shows QR code

3. **Test on Device**:
   - **iOS Simulator**: Press `i` in terminal
   - **Physical iPhone**: Scan QR code with Expo Go app
   - **Web Browser**: Press `w` in terminal

**Important**: For physical devices, update `.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001/api
# Example: EXPO_PUBLIC_API_URL=http://192.168.0.223:3001/api
```

### Option 2: Test with Vercel Backend (Production)

**If you want to test with deployed backend:**

1. **Check if backend is deployed**:
   - Visit: https://focus-psi-one.vercel.app/api/health
   - Should return: `{"status":"ok"}`

2. **Update `.env` file**:
   ```env
   EXPO_PUBLIC_API_URL=https://focus-psi-one.vercel.app/api
   ```

3. **Start frontend**:
   ```bash
   npm start
   ```

## 📋 Do You Need GitHub/Vercel?

### ✅ **NO** - For Local Development
- Backend runs locally on `localhost:3001`
- Frontend runs locally via Expo
- No GitHub/Vercel needed
- **Best for**: Development, debugging, testing new features

### ✅ **YES** - For Production Testing
- Backend deployed on Vercel
- Frontend uses Vercel backend URL
- **Best for**: Testing production environment, sharing with others

## 🔄 How Vercel Deployment Works

### Current Setup:
- **Backend**: Already deployed to Vercel
- **URL**: `https://focus-psi-one.vercel.app`
- **Auto-deploy**: Vercel watches your GitHub repo

### To Update Backend:

1. **Commit changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin main
   ```

2. **Vercel automatically deploys**:
   - Vercel detects push to GitHub
   - Automatically rebuilds and deploys
   - Usually takes 1-2 minutes

3. **Check deployment status**:
   - Go to: https://vercel.com/dashboard
   - See deployment logs

### To Update Frontend:

**Frontend doesn't deploy to Vercel!**
- Frontend is a **mobile app**, not a website
- It runs on your phone via Expo Go (development)
- Or as a native app via EAS Build (production)

**To update frontend:**
- Just restart Expo: `npm start`
- Changes are hot-reloaded automatically
- No deployment needed for development

## 🧪 Testing Checklist

### Local Testing (Recommended for Development):
- [ ] Backend running: `cd backend && npm run dev`
- [ ] Frontend running: `npm start`
- [ ] Backend accessible: `http://localhost:3001/api/health`
- [ ] App opens in Expo Go or simulator
- [ ] Can sign up / sign in
- [ ] Can create ideas
- [ ] Can record voice
- [ ] Can search ideas

### Production Testing:
- [ ] Backend deployed: `https://focus-psi-one.vercel.app/api/health`
- [ ] `.env` points to Vercel URL
- [ ] App connects to Vercel backend
- [ ] All features work with production backend

## 📱 Testing on Physical Device

### Step 1: Find Your Local IP
```bash
# Mac
ipconfig getifaddr en0

# Or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Step 2: Update `.env`
```env
EXPO_PUBLIC_API_URL=http://YOUR_IP:3001/api
# Example: EXPO_PUBLIC_API_URL=http://192.168.0.223:3001/api
```

### Step 3: Start Backend
```bash
cd backend
npm run dev
```

### Step 4: Start Frontend
```bash
npm start
```

### Step 5: Connect Phone
- Make sure phone and computer on same WiFi
- Scan QR code with Expo Go app
- Or enter URL manually: `exp://YOUR_IP:8081`

## 🎯 Quick Test Commands

```bash
# Test backend health
curl http://localhost:3001/api/health

# Test Vercel backend
curl https://focus-psi-one.vercel.app/api/health

# Start everything locally
cd backend && npm run dev &  # Run in background
npm start                     # Run in foreground
```

## ⚠️ Common Issues

**"Network request failed":**
- Check backend is running
- Check `.env` has correct API URL
- For physical device, use IP address, not `localhost`

**"Cannot connect to Expo":**
- Check phone and computer on same WiFi
- Check firewall isn't blocking port 8081
- Try manual connection: `exp://YOUR_IP:8081`

**Backend not updating:**
- Restart backend: `cd backend && npm run dev`
- Check for errors in backend terminal
- Verify environment variables are set

## 📝 Summary

- **Local Testing**: No GitHub/Vercel needed ✅
- **Production Testing**: Use Vercel backend ✅
- **Frontend**: Never deploys to Vercel (it's a mobile app) ✅
- **Backend Updates**: Push to GitHub → Vercel auto-deploys ✅

