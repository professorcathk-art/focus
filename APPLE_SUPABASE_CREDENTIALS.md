# Apple Sign-In Credentials for Supabase

## What Supabase Needs

Supabase asks for:
- **Client ID** → This is your **Service ID**
- **Secret Key** → This is a **JWT (JSON Web Token)** generated from your Private Key

But you also need:
- **Team ID** → Your Apple Developer Team ID
- **Key ID** → The ID of the key you created
- **Private Key** → The .p8 file (used to generate the JWT)

## Step-by-Step: Where to Get Each Value

### 1. Service ID (Client ID in Supabase)

**Location**: Apple Developer Portal → Identifiers → Services IDs

1. Go to: https://developer.apple.com/account
2. Navigate to: **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click **"+"** to create new identifier
4. Select **"Services IDs"** → Continue
5. Fill in:
   - **Description**: `Focus Circle Sign In`
   - **Identifier**: Try one of these (in order):
     - `com.focuscircle.applesignin` ⭐ (recommended - try this first)
     - `com.focuscircle.signin.service`
     - `signin.focuscircle.com`
     - `applesignin.focuscircle.com`
   
   **Note**: If you get "identifier not available", try the next one. Apple may restrict identifiers similar to existing App IDs.
6. Enable **"Sign in with Apple"**
7. Click **"Configure"** next to "Sign in with Apple"
8. **Primary App ID**: Select `com.focuscircle` (your App ID)
9. **Return URLs**: Add:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
10. Click **"Save"** → **"Continue"** → **"Register"**

**✅ Service ID**: Use whichever identifier worked (e.g., `com.focuscircle.applesignin`) ← This is your "Client ID" for Supabase

---

### 2. Team ID

**Location**: Apple Developer Portal → Membership

1. Go to: https://developer.apple.com/account
2. Look at the **top right corner** of the page
3. You'll see your **Team ID** (10-character string, e.g., `ABC123DEF4`)

**✅ Team ID**: `ABC123DEF4` (your actual Team ID)

---

### 3. Key ID and Private Key

**Location**: Apple Developer Portal → Keys

1. Go to: https://developer.apple.com/account
2. Navigate to: **Certificates, Identifiers & Profiles** → **Keys**
3. Click **"+"** to create new key
4. Fill in:
   - **Key Name**: `Focus Circle Sign In Key`
   - Enable **"Sign in with Apple"**
5. Click **"Continue"** → **"Register"**
6. **⚠️ IMPORTANT**: Download the key file (.p8) - **You can only download once!**
7. **Note the Key ID** shown on the page (10-character string)

**✅ Key ID**: `XYZ789GHI0` (your actual Key ID)
**✅ Private Key**: Contents of the downloaded `.p8` file

---

### 4. Private Key Format

The `.p8` file contains your private key. **Save this file securely** - you'll need it to generate the JWT.

**⚠️ Important**: You don't paste the private key directly into Supabase. Instead, you need to generate a JWT from it.

---

### 5. Generate JWT Secret Key

**⚠️ Important**: Supabase needs a **JWT (JSON Web Token)**, not the raw private key!

You need to generate a JWT using your private key. Here are options:

#### Option A: Use Online Tool (Easiest)

1. Go to: https://appleid.apple.com/signinwithapple/jwt-generator
2. Or use: https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
3. Fill in:
   - **Team ID**: Your Team ID
   - **Client ID**: Use your Service ID (e.g., `com.focuscircle.applesignin` or whichever one worked)
   - **Key ID**: Your Key ID
   - **Private Key**: Upload or paste your .p8 file
4. Generate JWT
5. Copy the generated JWT token

#### Option B: Use Node.js Script (Recommended)

Create a file `generate-apple-jwt.js`:

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Your credentials
const teamId = 'YOUR_TEAM_ID'; // e.g., ABC123DEF4
const clientId = 'com.focuscircle.signin'; // Your Service ID
const keyId = 'YOUR_KEY_ID'; // e.g., XYZ789GHI0
const privateKeyPath = './AuthKey_XYZ789GHI0.p8'; // Path to your .p8 file

// Read private key
const privateKey = fs.readFileSync(privateKeyPath);

// Generate JWT
const token = jwt.sign(
  {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 180 * 24 * 60 * 60, // 180 days
    aud: 'https://appleid.apple.com',
    sub: clientId
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      kid: keyId,
      alg: 'ES256'
    }
  }
);

console.log('Generated JWT:');
console.log(token);
```

Run:
```bash
npm install jsonwebtoken
node generate-apple-jwt.js
```

Copy the generated JWT token.

#### Option C: Use Python Script

```python
import jwt
import time

# Your credentials
team_id = 'YOUR_TEAM_ID'
client_id = 'com.focuscircle.signin'
key_id = 'YOUR_KEY_ID'
private_key_path = 'AuthKey_XYZ789GHI0.p8'

# Read private key
with open(private_key_path, 'r') as f:
    private_key = f.read()

# Generate JWT
token = jwt.encode(
    {
        'iss': team_id,
        'iat': int(time.time()),
        'exp': int(time.time()) + 180 * 24 * 60 * 60,  # 180 days
        'aud': 'https://appleid.apple.com',
        'sub': client_id
    },
    private_key,
    algorithm='ES256',
    headers={
        'kid': key_id
    }
)

print('Generated JWT:')
print(token)
```

Run:
```bash
pip install PyJWT cryptography
python generate-apple-jwt.py
```

---

## Configure Supabase

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Navigate to: **Authentication** → **Providers**
3. Find **Apple** provider and click **Enable**
4. Fill in the form:

   **Client ID (Service ID)**:
   ```
   com.focuscircle.signin
   ```

   **Secret Key (JWT)**:
   ```
   eyJraWQiOiJYWVo3ODlHSEkwIiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ...
   ```
   (This is the JWT token you generated, NOT the private key)

   **Team ID**:
   ```
   ABC123DEF4
   ```
   (Your actual Team ID)

   **Key ID**:
   ```
   XYZ789GHI0
   ```
   (Your actual Key ID)

5. Click **"Save"**

---

## ⚠️ Important Notes

### JWT Expiration
- JWTs expire after 180 days (6 months)
- You'll need to regenerate the JWT before it expires
- Set a reminder to update it in Supabase

### Security
- Never commit your .p8 private key file to Git
- Store it securely (password manager)
- The JWT can be regenerated anytime using the private key

---

## Summary: What Goes Where

| Supabase Field | Apple Developer Portal | Example Value |
|---------------|------------------------|---------------|
| **Client ID** | Service ID | `com.focuscircle.signin` |
| **Secret Key** | **JWT** (generated from Private Key) | `eyJraWQiOiJYWVoiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9...` |
| **Team ID** | Membership → Team ID | `ABC123DEF4` |
| **Key ID** | Keys → Key ID | `XYZ789GHI0` |

---

## Troubleshooting

### "Invalid Client ID"
- Make sure Service ID is exactly `com.focuscircle.signin`
- Verify Service ID has "Sign in with Apple" enabled
- Check that Return URL is configured in Service ID

### "Invalid Secret Key" or "Secret key should be a JWT"
- **You need a JWT token, not the raw private key!**
- Generate a JWT using one of the methods above
- Make sure the JWT includes: Team ID, Client ID, Key ID, and expiration
- Verify the JWT is valid (not expired)
- If you pasted the .p8 file directly, that's wrong - generate a JWT instead

### "Invalid Team ID"
- Team ID is case-sensitive
- Make sure you copied all 10 characters
- Check top right of Apple Developer Portal

### "Invalid Key ID"
- Key ID is case-sensitive
- Make sure you copied all 10 characters
- Verify the key has "Sign in with Apple" enabled

---

## Quick Checklist

- [ ] Created Service ID: `com.focuscircle.applesignin` (or alternative that worked)
- [ ] Enabled "Sign in with Apple" on Service ID
- [ ] Added Return URL to Service ID
- [ ] Got Team ID from Apple Developer Portal
- [ ] Created Apple Key with "Sign in with Apple"
- [ ] Downloaded .p8 file (saved securely!)
- [ ] Noted Key ID from the key
- [ ] Configured Supabase with all 4 values
- [ ] Tested Apple Sign-In in app

---

## Security Note

⚠️ **Keep your Private Key (.p8 file) secure!**
- Never commit it to Git
- Store it securely (password manager)
- If compromised, create a new key immediately

