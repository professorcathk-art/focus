# 📧 Feedback Feature Setup Guide

The feedback feature allows users to send feedback directly from the app to `professor.cat.hk@gmail.com`.

## Backend Setup

### 1. Install Nodemailer

The `nodemailer` package has been added to `backend/package.json`. Install it:

```bash
cd backend
npm install
```

### 2. Configure Gmail SMTP

To send emails from Gmail, you need to set up an App Password:

#### Step 1: Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security**
3. Enable **2-Step Verification** (if not already enabled)

#### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "Focus App Backend"
5. Click **Generate**
6. Copy the 16-character password (no spaces)

#### Step 3: Add to Backend Environment Variables

Add these to your `backend/.env` file:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=professor.cat.hk@gmail.com
SMTP_PASSWORD=your-16-character-app-password-here
```

**Important**: Replace `your-16-character-app-password-here` with the actual App Password from Step 2.

### 3. For Vercel Deployment

If deploying to Vercel, add these environment variables in Vercel Dashboard:

1. Go to your project in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `professor.cat.hk@gmail.com`
   - `SMTP_PASSWORD` = `[Your App Password]`

## Testing

### Test Locally

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Test the endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/feedback \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "subject": "Test Feedback",
       "message": "This is a test message",
       "type": "General"
     }'
   ```

### Test in App

1. Open the Focus app
2. Go to **Profile** tab
3. Tap **Send Feedback**
4. Fill in the form and send

## Email Format

Feedback emails will be sent to `professor.cat.hk@gmail.com` with:
- **From**: Focus App (professor.cat.hk@gmail.com)
- **Reply-To**: User's email address
- **Subject**: Feedback type and subject (if provided)
- **Body**: HTML formatted email with user details and message

## Troubleshooting

### "Email service not configured"
- Check that `SMTP_PASSWORD` is set in `.env`
- Verify the App Password is correct (16 characters, no spaces)

### "Email authentication failed"
- Verify 2-Step Verification is enabled
- Regenerate the App Password
- Ensure `SMTP_USER` matches the Gmail account

### Emails not received
- Check spam/junk folder
- Verify SMTP credentials are correct
- Check backend logs for errors

## Alternative: Use Email Service

If Gmail SMTP doesn't work, you can use services like:
- **Resend** (recommended): https://resend.com
- **SendGrid**: https://sendgrid.com
- **Mailgun**: https://mailgun.com

Update `backend/routes/feedback.js` to use the service's API instead of SMTP.

## Security Notes

- Never commit `.env` file with real credentials
- Use App Passwords, not your main Gmail password
- Rotate App Passwords periodically
- Consider rate limiting for feedback endpoint

