# Update Frontend to Use Vercel Backend

## Step 1: Get Your Vercel URL

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your `focus` project
3. Find your deployment URL (it will look like `https://focus-abc123.vercel.app`)
4. Copy the full URL

## Step 2: Update Frontend Configuration

### Option A: Update .env File (Recommended)

Edit the `.env` file in the project root:

```env
# Backend API URL - Vercel Production
EXPO_PUBLIC_API_URL=https://your-vercel-url.vercel.app/api

# Supabase (already configured)
EXPO_PUBLIC_SUPABASE_URL=https://wqvevludffkemgicrfos.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1
```

**Replace `your-vercel-url.vercel.app` with your actual Vercel URL!**

### Option B: Update src/config/api.ts Directly

If you prefer, you can update `src/config/api.ts`:

```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://your-vercel-url.vercel.app/api";
```

## Step 3: Restart Expo

After updating the configuration:

```bash
# Stop the current Expo server (Ctrl+C)
# Then restart:
npm start
```

## Step 4: Test Connection

1. Open the app in Expo Go
2. Try signing in or creating an idea
3. Check that it connects to your Vercel backend

## Troubleshooting

### Still connecting to localhost?
- Make sure you restarted Expo after changing `.env`
- Check that `.env` file is in the project root (not in `backend/`)
- Verify the URL format: `https://your-app.vercel.app/api` (with `/api` at the end)

### Network errors?
- Verify your Vercel deployment is live
- Test the health endpoint: `curl https://your-vercel-url.vercel.app/api/health`
- Check Vercel logs for any errors

### Want to switch back to local development?
Change `.env` back to:
```env
EXPO_PUBLIC_API_URL=http://192.168.0.223:3001/api
```
(Replace with your local IP if different)

