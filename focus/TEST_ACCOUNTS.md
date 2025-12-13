# 🧪 Test Accounts & Development Mode

## Development Mode (No Backend Required)

The app now has a **development mode** that allows you to test the UI without a backend!

### How to Use:

**Any email and password will work!** Just enter:
- **Email**: `test@example.com` (or any email)
- **Password**: `password` (or any password)

The app will automatically create a mock user and sign you in.

### Test Accounts (Development Mode):

You can use any of these:

1. **Email**: `test@example.com`  
   **Password**: `password123`

2. **Email**: `demo@focus.app`  
   **Password**: `demo`

3. **Email**: `user@test.com`  
   **Password**: `test`

**All of these will work!** The app creates a mock user automatically.

---

## 🚀 Quick Test:

1. Run the app: `npx expo start`
2. Go to Sign In screen
3. Enter any email (e.g., `test@example.com`)
4. Enter any password (e.g., `password`)
5. Click "Sign In"
6. ✅ You'll be signed in and can explore the app!

---

## 📝 Notes:

- **Development mode is ON by default** in `__DEV__` mode
- No backend connection needed
- Mock user data is created automatically
- Perfect for testing UI and navigation
- When you set up your backend, update `src/config/api.ts` with your API URL

---

## 🔧 Disable Development Mode:

To require real backend authentication, set in `.env`:
```
EXPO_PUBLIC_DEV_MODE=false
```

Or update `src/config/api.ts` to disable `DEV_MODE`.

