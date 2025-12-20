/**
 * Generate Apple Sign-In JWT for Supabase
 * 
 * Usage:
 * 1. Install dependencies: npm install jsonwebtoken
 * 2. Update the credentials below
 * 3. Run: node generate-apple-jwt.js
 * 4. Copy the generated JWT to Supabase
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Your Apple Sign-In credentials
const TEAM_ID = 'YUNUL5V5R6'; // Your Team ID
// For native iOS apps, use App ID; for web OAuth, use Service ID
const CLIENT_ID = 'com.focuscircle'; // App ID for native apps (matches token audience)
// Alternative: 'com.focuscircle.applesignin' (Service ID for web OAuth)
const KEY_ID = 'U3ZQ3S6AK6'; // Your Key ID
const PRIVATE_KEY_PATH = '/Users/mickeylau/Downloads/AuthKey_U3ZQ3S6AK6.p8'; // Path to your .p8 file

// Read private key
let privateKey;
try {
  privateKey = fs.readFileSync(PRIVATE_KEY_PATH);
} catch (error) {
  console.error('❌ Error reading private key file:', error.message);
  console.error('Make sure the .p8 file is in the same directory as this script');
  console.error('Or update PRIVATE_KEY_PATH to the correct path');
  process.exit(1);
}

// Generate JWT
// JWT is valid for 180 days (6 months) - Apple's requirement
const now = Math.floor(Date.now() / 1000);
const expiration = now + (180 * 24 * 60 * 60); // 180 days in seconds

const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: now,
    exp: expiration,
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      kid: KEY_ID,
      alg: 'ES256'
    }
  }
);

console.log('\n✅ Generated Apple Sign-In JWT:\n');
console.log(token);
console.log('\n📋 Copy this JWT and paste it into Supabase → Authentication → Providers → Apple → Secret Key\n');
console.log(`⏰ This JWT expires in 180 days (${new Date(expiration * 1000).toLocaleDateString()})`);
console.log('💡 Set a reminder to regenerate it before expiration!\n');

