# Supabase Apple Sign-In Configuration

## Supabase Fields

Supabase only requires **2 fields** for Apple Sign-In:

1. **Client ID** (Service ID or App ID)
   - For native iOS apps: `com.focuscircle` (App ID)
   - For web OAuth: `com.focuscircle.applesignin` (Service ID)

2. **Secret Key** (JWT token)
   - Generated from your .p8 private key
   - Must match the Client ID used

## What Supabase Does NOT Have

Supabase does **NOT** have separate fields for:
- ❌ Team ID (not needed in Supabase)
- ❌ Key ID (not needed in Supabase)

These are only used when **generating the JWT**, not when configuring Supabase.

## Current Configuration

### For Native iOS App:
- **Client ID**: `com.focuscircle` (App ID)
- **Secret Key**: JWT with `sub: com.focuscircle`

### JWT Generation:
- Team ID: `YUNUL5V5R6` (used to generate JWT)
- Key ID: `U3ZQ3S6AK6` (used to generate JWT)
- Client ID: `com.focuscircle` (used as `sub` in JWT)

## Summary

**In Supabase Dashboard:**
- Only configure: Client ID and Secret Key
- Team ID and Key ID are NOT Supabase fields

**When Generating JWT:**
- Use Team ID, Key ID, and Client ID to generate the JWT
- Then paste the JWT into Supabase's Secret Key field

