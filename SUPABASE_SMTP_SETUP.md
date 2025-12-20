# Supabase SMTP Setup Guide

## Why You Need SMTP

Supabase's default email provider has:
- Rate limits (can't send many emails)
- May not work reliably for production
- No customization options

Setting up custom SMTP gives you:
- ✅ Unlimited emails
- ✅ Better deliverability
- ✅ Custom email templates
- ✅ Professional sender address

---

## Step-by-Step Setup

### Option 1: Gmail SMTP (Free, Easy)

**1. Enable 2-Factor Authentication on Gmail**
   - Go to Google Account → Security
   - Enable 2-Step Verification

**2. Generate App Password**
   - Go to Google Account → Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Supabase" as name
   - Copy the 16-character password

**3. Configure in Supabase**
   - Go to Supabase Dashboard → Project Settings → Auth
   - Scroll to "SMTP Settings"
   - Enable "Enable Custom SMTP"
   - Fill in:
     ```
     Host: smtp.gmail.com
     Port: 587
     Username: your-email@gmail.com
     Password: [paste 16-character app password]
     Sender email: your-email@gmail.com
     Sender name: Focus Circle
     ```

**4. Test Email**
   - Go to Authentication → Email Templates
   - Click "Send test email"
   - Check your inbox

---

### Option 2: SendGrid (Recommended for Production)

**1. Create SendGrid Account**
   - Sign up at https://sendgrid.com (free tier: 100 emails/day)
   - Verify your email

**2. Create API Key**
   - Go to Settings → API Keys
   - Create new API Key
   - Name: "Supabase"
   - Permissions: "Full Access" or "Mail Send"
   - Copy the API key

**3. Verify Sender**
   - Go to Settings → Sender Authentication
   - Add Single Sender Verification
   - Enter your email and verify it

**4. Configure in Supabase**
   - Go to Supabase Dashboard → Project Settings → Auth
   - Scroll to "SMTP Settings"
   - Enable "Enable Custom SMTP"
   - Fill in:
     ```
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: [paste SendGrid API key]
     Sender email: your-verified-email@domain.com
     Sender name: Focus Circle
     ```

**5. Test Email**
   - Go to Authentication → Email Templates
   - Click "Send test email"
   - Check your inbox

---

### Option 3: Resend (Modern, Developer-Friendly)

**1. Create Resend Account**
   - Sign up at https://resend.com (free tier: 3,000 emails/month)
   - Verify your email

**2. Create API Key**
   - Go to API Keys
   - Create new API Key
   - Copy the key

**3. Add Domain (Optional but Recommended)**
   - Go to Domains
   - Add your domain
   - Add DNS records (SPF, DKIM, DMARC)

**4. Configure in Supabase**
   - Go to Supabase Dashboard → Project Settings → Auth
   - Scroll to "SMTP Settings"
   - Enable "Enable Custom SMTP"
   - Fill in:
     ```
     Host: smtp.resend.com
     Port: 587
     Username: resend
     Password: [paste Resend API key]
     Sender email: your-email@yourdomain.com (or onboarding@resend.dev for testing)
     Sender name: Focus Circle
     ```

**5. Test Email**
   - Go to Authentication → Email Templates
   - Click "Send test email"
   - Check your inbox

---

## Verify Email Templates

After SMTP setup, verify email templates:

1. Go to **Authentication → Email Templates**
2. Check these templates are enabled:
   - ✅ **Confirm signup** (for email verification)
   - ✅ **Magic Link** (if using passwordless)
   - ✅ **Change Email Address**
   - ✅ **Reset Password**

3. Customize templates (optional):
   - Click on template
   - Edit HTML/text
   - Use variables: `{{ .ConfirmationURL }}`, `{{ .Email }}`, etc.

---

## Test Email Confirmation Flow

1. **Sign up with a test email**
2. **Check inbox** (and spam folder)
3. **Click confirmation link**
4. **Verify redirects to app** (`focus://auth-callback`)
5. **Check app receives session**

---

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Settings**
   - Verify host, port, username, password
   - Test with "Send test email" button

2. **Check Email Templates**
   - Ensure "Confirm signup" template is enabled
   - Check template has `{{ .ConfirmationURL }}` variable

3. **Check Supabase Auth Settings**
   - Go to Authentication → Settings
   - Ensure "Enable email confirmations" is ON
   - Check "Confirm email" is enabled

4. **Check Spam Folder**
   - Emails might be marked as spam initially
   - Add sender to contacts

5. **Check Logs**
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Look for email sending errors

### Gmail Specific Issues

- **"Less secure app" error:** Use App Password (not regular password)
- **Rate limits:** Gmail limits to ~500 emails/day
- **Deliverability:** May go to spam initially

### SendGrid Specific Issues

- **API key not working:** Ensure "Mail Send" permission is enabled
- **Sender not verified:** Verify sender email in SendGrid dashboard
- **Rate limits:** Free tier: 100 emails/day

---

## Recommended Setup

For **production**, use:
- **SendGrid** or **Resend** (better deliverability)
- **Custom domain** (professional sender address)
- **SPF/DKIM records** (prevents spam)

For **development/testing**, use:
- **Gmail SMTP** (quick setup, free)
- **Resend** (generous free tier)

---

## Next Steps

1. ✅ Set up SMTP (choose one option above)
2. ✅ Test email sending
3. ✅ Verify email templates
4. ✅ Test signup flow end-to-end
5. ✅ Monitor email delivery rates

After SMTP is configured, email confirmation will work automatically!

