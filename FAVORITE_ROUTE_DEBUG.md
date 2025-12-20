# 🔍 Favorite Route 404 Debug Guide

## Route Registration

The favorite route is correctly defined in `backend/routes/ideas.js`:

```javascript
// Line 457 - MUST come before /:id route
router.put('/:id/favorite', requireAuth, async (req, res) => {
  // ... handler code
});

// Line 514 - General update route
router.put('/:id', requireAuth, async (req, res) => {
  // ... handler code
});
```

## Route Order ✅

The route order is **correct** - `/:id/favorite` comes before `/:id`, which is essential for Express routing.

## Common Causes of 404

### 1. Backend Not Running (Local)
**Solution**: Restart backend server
```bash
cd backend
npm run dev
```

### 2. Vercel Not Deployed (Production)
**Solution**: 
- Check Vercel dashboard for deployment status
- Wait for auto-deployment after git push (~2-3 minutes)
- Verify deployment logs show no errors

### 3. Route Not Registered
**Check**: Verify `backend/server.js` includes:
```javascript
app.use('/api/ideas', require('./routes/ideas'));
```

### 4. Express Route Matching Issue
**Test**: Try accessing the route directly:
```bash
# Local
curl -X PUT http://localhost:3001/api/ideas/<idea-id>/favorite \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Production
curl -X PUT https://focus-psi-one.vercel.app/api/ideas/<idea-id>/favorite \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

## Debugging Steps

1. **Check Backend Logs**:
   - Look for `[Toggle Favorite] Request received for idea <id>`
   - If not present, route isn't being hit

2. **Verify API Endpoint**:
   - Frontend calls: `PUT /api/ideas/:id/favorite`
   - Backend route: `PUT /:id/favorite`
   - Combined: `PUT /api/ideas/:id/favorite` ✅

3. **Check Request Headers**:
   - Ensure `Authorization: Bearer <token>` is present
   - Verify token is valid

4. **Test Route Directly**:
   - Use Postman or curl to test the endpoint
   - Check if 404 persists

## Expected Behavior

When working correctly:
- Backend logs: `[Toggle Favorite] Request received for idea <id>`
- Response: 200 OK with updated idea object
- Frontend: Favorite status toggles successfully

## If Still 404

1. **Restart Backend** (local)
2. **Check Vercel Deployment** (production)
3. **Verify Route Registration** in `server.js`
4. **Check Express Version** - ensure compatibility
5. **Review Deployment Logs** for errors



