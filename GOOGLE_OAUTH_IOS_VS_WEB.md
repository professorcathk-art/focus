# Google OAuth: iOS App vs Web Application

## Current Setup: Web Application ✅

Your app currently uses **Web application** type in Google Cloud Console, which is **correct** for Expo/React Native apps.

### Why Web Application is Correct:

1. **Expo OAuth Flow**: Expo uses browser-based OAuth flow
   - Opens browser for Google sign-in
   - Supabase handles the callback
   - Redirects back to app via deep link (`focus://` or `exp://`)

2. **Works for Both Expo Go and Native Builds**:
   - Expo Go: Uses `exp://` scheme
   - Native builds: Uses `focus://` scheme
   - Both go through the same browser OAuth flow

3. **Supabase Integration**: Supabase expects web OAuth flow
   - Supabase callback URL: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
   - This is configured in Google Cloud Console as a web redirect URI

## iOS App Type (Alternative)

If you want to use **iOS app** type instead, you would need:

1. **Google Sign-In SDK**: Install `@react-native-google-signin/google-signin`
2. **Native Module**: Requires native iOS code changes
3. **Different Flow**: Direct Google Sign-In SDK instead of browser OAuth
4. **More Complex**: Requires additional setup and configuration

### When to Use iOS App Type:

- ✅ You want native Google Sign-In UI (not browser)
- ✅ You want faster sign-in (no browser redirect)
- ✅ You're building a production native app
- ❌ More complex setup
- ❌ Requires native code changes
- ❌ Doesn't work with Expo Go (needs custom dev client)

## Current Configuration ✅

### Google Cloud Console:
- **Application Type**: Web application
- **Authorized Redirect URI**: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`

### Supabase:
- **Google Provider**: Enabled
- **Client ID**: From Google Cloud Console
- **Client Secret**: From Google Cloud Console
- **Redirect URLs**: Configured for deep linking

## OAuth Flow (Current Setup):

```
1. User clicks "Continue with Google"
   ↓
2. App opens browser → Google OAuth page
   ↓
3. User signs in with Google
   ↓
4. Google redirects to: https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ↓
5. Supabase processes OAuth response
   ↓
6. Supabase redirects to: focus:///(auth)/signin (deep link)
   ↓
7. App receives deep link and completes authentication
```

## Common Issues & Solutions

### Issue: Redirect URI Mismatch
**Error**: `redirect_uri_mismatch`

**Solution**: 
- Verify Google Cloud Console has exact callback URL
- Check Supabase redirect URLs configuration
- Ensure no trailing slashes

### Issue: App Doesn't Receive Callback
**Error**: Browser redirects but app doesn't authenticate

**Solution**:
- Check deep linking is configured (`focus://` scheme)
- Verify Supabase redirect URLs include your app scheme
- Test deep linking manually: `focus:///(auth)/signin`

### Issue: Browser Opens But Doesn't Redirect Back
**Error**: Stuck on Google sign-in page

**Solution**:
- Check Google Cloud Console redirect URI matches Supabase callback
- Verify Supabase Google provider is enabled
- Check network connectivity

## Recommendation

**Keep using Web Application type** because:
1. ✅ Works with Expo Go (development)
2. ✅ Works with native builds (production)
3. ✅ Simpler setup and maintenance
4. ✅ Standard Expo/React Native pattern
5. ✅ Well-documented and supported

**Only switch to iOS App type if**:
- You need native Google Sign-In UI
- You want to avoid browser redirects
- You're building a production app with custom dev client
- You're comfortable with native code changes

## Testing OAuth

1. **Test in Expo Go**: Should work with `exp://` scheme
2. **Test in Native Build**: Should work with `focus://` scheme
3. **Check Logs**: Look for redirect URL in console
4. **Verify Deep Linking**: Test `focus:///(auth)/signin` manually

## Next Steps

If OAuth is not working:
1. ✅ Verify Google Cloud Console redirect URI
2. ✅ Check Supabase Google provider settings
3. ✅ Test deep linking configuration
4. ✅ Check app logs for redirect URL
5. ✅ Verify network connectivity

If you want to switch to iOS App type:
1. Install `@react-native-google-signin/google-signin`
2. Configure Google Sign-In SDK
3. Update `signInWithGoogle` function
4. Test thoroughly in native build


