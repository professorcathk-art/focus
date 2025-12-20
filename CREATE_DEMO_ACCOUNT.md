# Create Demo Account for App Store Reviewers

## Overview
Apple requires a demo account for App Store reviewers to test your app. This guide helps you create a test account that reviewers can use.

## Method 1: Create via App (Recommended)

### Step 1: Create Account
1. Open your Focus Circle app
2. Go to Sign Up page
3. Create a new account with:
   - **Email**: `appreview@focuscircle.app` (or your domain)
   - **Password**: `Reviewer123!` (or similar secure password)
   - **Name**: `App Reviewer`

### Step 2: Populate with Sample Data
1. Sign in with the demo account
2. Create some sample ideas:
   - Add 3-5 text ideas
   - Record 1-2 voice notes (if possible)
   - Create 2-3 categories
   - Add some todos for today
3. Make sure all features are accessible

### Step 3: Verify Account Works
- Test sign in with the credentials
- Verify all features work
- Make sure there's sample data to explore

## Method 2: Create via Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Users**

### Step 2: Create User
1. Click **Add User** → **Create New User**
2. Fill in:
   - **Email**: `appreview@focuscircle.app`
   - **Password**: `Reviewer123!`
   - **Auto Confirm User**: ✅ (check this)
   - **Send Invite Email**: ❌ (uncheck this)
3. Click **Create User**

### Step 3: Add Sample Data (Optional)
You can manually add sample data via Supabase SQL Editor:

```sql
-- Get the demo user ID
SELECT id FROM auth.users WHERE email = 'appreview@focuscircle.app';

-- Insert sample ideas (replace USER_ID with actual ID)
INSERT INTO public.ideas (user_id, text, category_id, created_at)
VALUES 
  ('USER_ID', 'Sample idea 1: This is a test idea for reviewers', NULL, NOW()),
  ('USER_ID', 'Sample idea 2: Another test idea', NULL, NOW()),
  ('USER_ID', 'Sample idea 3: Testing the app features', NULL, NOW());

-- Insert sample todos
INSERT INTO public.todos (user_id, text, completed, date, created_at)
VALUES 
  ('USER_ID', 'Sample todo 1', false, CURRENT_DATE, NOW()),
  ('USER_ID', 'Sample todo 2', false, CURRENT_DATE, NOW());
```

## Method 3: Create via Backend API (Programmatic)

Create a script `scripts/create-demo-account.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoAccount() {
  const email = 'appreview@focuscircle.app';
  const password = 'Reviewer123!';
  
  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'App Reviewer'
    }
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }

  console.log('✅ Demo account created:', email);
  console.log('User ID:', authData.user.id);
  
  // Optionally add sample data
  // ... (add sample ideas, todos, etc.)
}

createDemoAccount();
```

Run it:
```bash
cd backend
node scripts/create-demo-account.js
```

## App Store Connect Configuration

### Step 1: Add Demo Account Info
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **App Store** → **App Information**
4. Scroll to **App Review Information**
5. Fill in:
   - **Contact Information**: Your contact details
   - **Demo Account**: 
     - Username: `appreview@focuscircle.app`
     - Password: `Reviewer123!`
   - **Notes**: 
     ```
     Demo account credentials:
     Email: appreview@focuscircle.app
     Password: Reviewer123!
     
     This account has sample data including ideas, todos, and categories.
     All features are accessible and ready for testing.
     ```

### Step 2: Additional Notes (Optional)
Add helpful notes for reviewers:
```
App Review Notes:
- Sign in with the provided demo account
- Sample data is pre-populated
- Voice recording feature requires microphone permission
- All features are fully functional
- For any questions, contact: support@focuscircle.app
```

## Security Considerations

1. **Use a Strong Password**: Even for demo accounts, use a secure password
2. **Separate Email**: Use a dedicated email address for reviewers
3. **Monitor Account**: Check the demo account periodically
4. **Reset After Review**: Consider resetting the password after review
5. **Limit Access**: Don't use this account for personal use

## Testing the Demo Account

Before submitting, test the demo account:

- [ ] Can sign in successfully
- [ ] All features are accessible
- [ ] Sample data is visible
- [ ] No errors occur
- [ ] App functions normally

## Troubleshooting

### Issue: Reviewer can't sign in
- Check if email confirmation is required (should be auto-confirmed)
- Verify password is correct
- Check Supabase Auth logs

### Issue: No sample data
- Manually add sample data via Supabase dashboard
- Or use the SQL script above

### Issue: Account doesn't exist
- Create it via Supabase dashboard
- Or use the backend script

## Quick Reference

**Demo Account Credentials:**
- Email: `appreview@focuscircle.app`
- Password: `Reviewer123!`

**App Store Connect Location:**
- App Store → App Information → App Review Information → Demo Account

---

**Note**: Update the email domain (`focuscircle.app`) to match your actual domain if different.

