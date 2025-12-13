# Debug Recording & Backend Logs

## 🔧 Fixes Applied

### 1. ✅ Fixed Logout Issue
- **Before**: Recording errors forced logout
- **After**: Shows error message only, doesn't force logout
- **File**: `app/(tabs)/record.tsx`

### 2. ✅ Removed Dark Mode Option
- Removed appearance settings from profile page
- **File**: `app/(tabs)/profile.tsx`

## 📋 How to See Backend Logs

### Option 1: Restart Backend in Foreground

**Stop current backend** (if running in background):
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
```

**Start backend with visible logs**:
```bash
cd backend
npm run dev
```

You'll see logs like:
```
🚀 Focus API server running on port 3001
[Upload Audio] File size: 12345 bytes, type: audio/m4a
[Upload Audio] Attempting transcription with AIMLAPI nova-3 model
[Upload Audio] Calling AIMLAPI: https://api.aimlapi.com/v1/audio/transcriptions
...
```

### Option 2: Check Backend Logs in Real-Time

If backend is running, you can check logs:
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# View process logs (if you know the process ID)
ps aux | grep "node.*backend"
```

## 🐛 Common Recording Issues

### Issue: "Authentication Required" After Recording

**Possible Causes:**
1. **Token expired** - Supabase session expired
2. **Token not sent** - Authorization header missing
3. **Backend auth error** - Token validation failed

**Debug Steps:**

1. **Check if you're signed in**:
   - Go to Profile tab
   - Should see your email
   - If not, sign in again

2. **Check backend logs**:
   ```bash
   cd backend
   npm run dev
   ```
   Look for:
   - `[Upload Audio]` logs
   - `Auth middleware error` messages
   - `Invalid or expired token` errors

3. **Check frontend logs**:
   - Open Expo DevTools (press `j` in terminal)
   - Check console for errors
   - Look for "Error stopping recording" messages

### Issue: Recording Fails Silently

**Check:**
1. **Backend is running**: `curl http://localhost:3001/api/health`
2. **Network connection**: Check `.env` has correct `EXPO_PUBLIC_API_URL`
3. **Backend logs**: Look for error messages

### Issue: Transcription Fails

**Check backend logs for:**
- `[Upload Audio] AIMLAPI transcription failed`
- `[Upload Audio] OpenAI transcription error`
- API key errors
- Network errors

## 🔍 Debug Checklist

When recording fails:

- [ ] Backend server is running (`curl http://localhost:3001/api/health`)
- [ ] You're signed in (check Profile tab)
- [ ] Backend logs show the request received
- [ ] No authentication errors in backend logs
- [ ] No API key errors (AIMLAPI/OpenAI)
- [ ] Network request succeeds (check frontend logs)

## 📝 What to Look For in Backend Logs

### Successful Recording:
```
[Upload Audio] File size: 12345 bytes, type: audio/m4a
[Upload Audio] Attempting transcription with AIMLAPI nova-3 model
[Upload Audio] ✅ Success with AIMLAPI nova-3: "transcript text..."
[Upload Audio] ✅ Final transcript (AIMLAPI nova-3): "..."
```

### Authentication Error:
```
Auth middleware error: Invalid or expired token
[Upload Audio] Error: Authentication required
```

### Transcription Error:
```
[Upload Audio] AIMLAPI transcription failed, will try OpenAI fallback
[Upload Audio] OpenAI transcription error: ...
```

## 🚀 Quick Test

1. **Start backend** (with logs visible):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend**:
   ```bash
   npm start
   ```

3. **Record a test**:
   - Sign in
   - Go to Record tab
   - Hold record button
   - Release after 2-3 seconds
   - Watch backend logs for errors

4. **Check logs**:
   - Backend terminal: Should show transcription process
   - Frontend: Should show "Idea saved!" message

## 💡 Tips

- **Keep backend terminal visible** to see errors immediately
- **Check both frontend and backend logs** for complete picture
- **Test with short recordings first** (2-3 seconds)
- **Verify you're signed in** before recording

