# Fix Auth Issues - Google OAuth & Email Signup

## ✅ Fixes Applied

### 1. Voice Transcription - Nova-3 Model
- **Fixed**: Changed back to `nova-3` model (correct for speech-to-text)
- **File**: `backend/routes/ideas.js`
- **Status**: ✅ Complete

### 2. Google OAuth Loading Issue
- **Problem**: OAuth keeps loading, doesn't redirect properly
- **Fix**: 
  - Use `Linking.createURL()` for proper app scheme redirect
  - Improved auth state change listener
  - Better error handling
- **Files**: 
  - `src/store/auth-store.ts`
  - `app/(auth)/signin.tsx`
- **Status**: ✅ Complete

### 3. Email Signup Error
- **Problem**: Signup shows error even when successful
- **Fix**:
  - Better error message handling
  - Clearer instructions for email confirmation
  - Auto-navigate to sign-in after email confirmation message
- **Files**:
  - `src/store/auth-store.ts`
  - `app/(auth)/signup.tsx`
- **Status**: ✅ Complete

## 🔧 What Changed

### Google OAuth Redirect
**Before:**
```typescript
redirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/auth/v1/callback`
```

**After:**
```typescript
const redirectUrl = Linking.createURL('/(auth)/signin');
redirectTo: redirectUrl  // Uses app scheme: focus://
```

### Email Signup Error Handling
**Before:**
- Threw error immediately
- User confused about what to do

**After:**
- Shows clear message: "Account created! Please check your email..."
- Auto-navigates to sign-in page
- Better user experience

## 🧪 Testing

### Test Google OAuth:
1. Tap "Continue with Google"
2. Browser should open for Google sign-in
3. After signing in, should redirect back to app
4. Should be signed in automatically

### Test Email Signup:
1. Enter email and password
2. Tap "Create Account"
3. If email confirmation required:
   - Shows alert: "Check Your Email"
   - Navigates to sign-in page
   - User clicks email link to confirm
   - Then can sign in

## ⚠️ Important: Supabase Configuration

For Google OAuth and email confirmation to work:

### 1. Supabase Dashboard → Authentication → URL Configuration
- **Site URL**: `focus://`
- **Redirect URLs**: Add:
  ```
  focus://
  focus:///(auth)/signin
  exp://192.168.0.223:8081
  ```

### 2. Email Templates
- Go to: Authentication → Email Templates
- Make sure confirmation email includes redirect URL
- Default template should work, but verify

### 3. Google OAuth Provider
- Make sure Google provider is enabled
- Client ID and Secret are set correctly

## 🐛 Troubleshooting

### Google OAuth Still Loading:
- Check Supabase redirect URLs include `focus://`
- Check Google Cloud Console redirect URI matches Supabase callback
- Check browser opens (should open automatically)
- Check app scheme is `focus://` in `app.json`

### Email Signup Still Errors:
- Check Supabase email confirmation is enabled/disabled as needed
- Check email templates in Supabase Dashboard
- Check spam folder for confirmation email
- Try disabling email confirmation temporarily for testing

### Deep Linking Not Working:
- Check `app.json` has `"scheme": "focus"`
- Check Supabase redirect URLs include app scheme
- Restart Expo: `npm start --clear`

## 📝 Notes

- **App Scheme**: `focus://` (defined in `app.json`)
- **OAuth Flow**: App → Browser → Google → Supabase → App
- **Email Flow**: App → Supabase → Email → User clicks link → App
- **Deep Linking**: Handled automatically by `expo-linking` and `app/_layout.tsx`

