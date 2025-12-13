# Frontend Hosting Explanation

## Quick Answer

**Your frontend is NOT "hosted" anywhere - it's a mobile app that runs on your phone!**

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR SETUP                            │
└─────────────────────────────────────────────────────────┘

📱 FRONTEND (Mobile App)
   ├─ Code Location: /Users/mickeylau/focus (on your PC)
   ├─ Development: Expo Go connects to your PC's dev server
   ├─ Production: Built app runs directly on your phone
   └─ NOT hosted - runs natively on device

🌐 BACKEND (API Server)
   ├─ Hosted on: Vercel
   ├─ URL: https://focus-psi-one.vercel.app
   └─ Always online, accessible from anywhere
```

## Detailed Explanation

### 1. Frontend Code (Source Files)

**Location:** `/Users/mickeylau/focus` (on your PC)

- ✅ All your React Native code is here
- ✅ You edit code here
- ✅ Git repository is here
- ✅ This is NOT "hosted" - it's just files on your computer

### 2. Development Mode (Expo Go)

**How it works:**
```
Your Phone (Expo Go app)
    ↓ connects to
Your PC (Expo Dev Server: npm start)
    ↓ makes API calls to
Vercel (Backend API)
```

- **Expo Dev Server:** Runs on your PC when you do `npm start`
- **Your Phone:** Connects to your PC via Expo Go app
- **Code:** Still on your PC, served to your phone

### 3. Production Mode (EAS Build)

**How it works:**
```
Your Phone (Native iOS/Android app)
    ↓ makes API calls to
Vercel (Backend API)
```

- **App:** Built into native iOS/Android app
- **Installation:** Installed directly on your phone
- **No Server Needed:** App runs natively on device
- **Code:** Still on your PC for editing

## Key Differences from Web Apps

### Web App (Traditional):
- Frontend HTML/CSS/JS → Hosted on server (e.g., Vercel, Netlify)
- User visits URL → Downloads frontend → Runs in browser

### Mobile App (Your Setup):
- Frontend React Native code → Built into native app
- User installs app → App runs natively on device
- **No hosting needed** - app is self-contained

## Where Things Are

| Component | Location | Purpose |
|-----------|----------|---------|
| **Frontend Code** | Your PC (`/Users/mickeylau/focus`) | Editing & development |
| **Frontend App** | Your Phone | Runs natively |
| **Backend API** | Vercel (`focus-psi-one.vercel.app`) | Server-side logic |
| **Database** | Supabase | Data storage |

## Development Workflow

1. **Edit Code:** On your PC (`/Users/mickeylau/focus`)
2. **Test Locally:** 
   - Run `npm start` on your PC
   - Connect via Expo Go on your phone
3. **Build for Production:**
   - `eas build` creates native app
   - Install on phone via TestFlight/App Store
4. **Update:**
   - Edit code on PC
   - Rebuild and resubmit

## Important Points

✅ **Frontend code stays on your PC** - you edit it locally
✅ **Frontend app runs on your phone** - not "hosted" anywhere
✅ **Backend is hosted on Vercel** - always accessible
✅ **You can develop offline** - app works without internet (except API calls)

## Summary

- **Frontend Code:** On your PC (for editing)
- **Frontend App:** On your phone (runs natively)
- **Backend API:** Hosted on Vercel (always online)
- **No frontend hosting needed** - mobile apps don't need hosting!

