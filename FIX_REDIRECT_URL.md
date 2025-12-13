# 🔗 Fix Redirect URL Validation Error

## 🔍 Problem

Supabase redirect URL field shows error:
```
Please enter a valid URL
```
When trying to add: `focus:///(auth)/signin`

## 🎯 Root Cause

Supabase requires **HTTP/HTTPS URLs** for redirect URLs, not custom app schemes like `focus://`.

## ✅ Solution: Use Supabase Callback URL

### Step 1: Configure Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Click **"Authentication"** → **"URL Configuration"**
3. Under **"Redirect URLs"**, add:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
4. Click **"Save"**

**Note:** This is Supabase's default callback URL. It's already configured, but you can verify it's in the list.

### Step 2: How It Works

1. User clicks email confirmation link
2. Supabase processes the confirmation
3. Supabase redirects to: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
4. The callback page shows a success message
5. User can then open the app and sign in

### Step 3: The Code Already Updated

The code now uses Supabase's callback URL automatically. No changes needed!

---

## 🚀 Alternative: Disable Email Confirmation (Easiest for Testing)

If you want to skip email confirmation entirely:

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos/auth/settings
2. Scroll to **"Email Auth"** section
3. Turn OFF **"Enable email confirmations"**
4. Click **"Save"**

**Result:** Users sign in immediately after sign-up (no email needed)

---

## 📱 For Production: Create Web Redirect Page

If you want a better user experience, create a web page that redirects to the app:

### Option 1: Use Your Own Domain

1. Create a web page at: `https://yourapp.com/auth/confirm`
2. Add redirect URLs in Supabase:
   ```
   https://yourapp.com/auth/confirm
   ```
3. The page redirects to app: `focus:///(auth)/signin`

### Option 2: Use Supabase Callback (Current)

- ✅ Already works
- ✅ No additional setup needed
- ✅ Shows success message
- User manually opens app after confirmation

---

## 🔧 How Email Confirmation Works Now

### Flow:

1. **User signs up** → Account created in Supabase
2. **Email sent** → Contains confirmation link
3. **User clicks link** → Opens in browser
4. **Supabase processes** → Confirms email
5. **Redirects to callback** → `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
6. **Shows success page** → "Email confirmed!"
7. **User opens app** → Signs in with email/password
8. **✅ Signed in!**

---

## 📋 Quick Checklist

- [ ] Verify Supabase callback URL is in redirect URLs list
- [ ] Code already updated to use callback URL
- [ ] Test sign-up flow
- [ ] Check email for confirmation link
- [ ] Click link → Should show success page
- [ ] Open app → Sign in → Should work!

---

## 🆘 Still Having Issues?

### Check These:

1. **Redirect URL Format:**
   - Must be HTTP/HTTPS
   - No custom schemes allowed
   - Use Supabase callback URL

2. **Email Confirmation:**
   - Check if enabled in Supabase settings
   - Check email spam folder
   - Verify email address is correct

3. **After Confirmation:**
   - User needs to manually open app
   - Then sign in with email/password
   - Session will be created

---

## 💡 Recommended Approach

**For Development:**
- ✅ Disable email confirmation
- ✅ Faster testing workflow
- ✅ No email setup needed

**For Production:**
- ✅ Use Supabase callback URL (current setup)
- ✅ Or create custom redirect page
- ✅ Better user experience

---

## 🎯 Next Steps

1. **Verify redirect URL** in Supabase Dashboard
2. **Test sign-up** again
3. **Check email** for confirmation link
4. **Click link** → Should show success page
5. **Open app** → Sign in → Should work!

The code is already updated to use the correct URL format. Just make sure Supabase has the callback URL in its allowed redirect URLs list.

