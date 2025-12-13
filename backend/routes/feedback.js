/**
 * Feedback routes - Send user feedback via email
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP
const createTransporter = () => {
  // For Gmail, you can use App Password or OAuth2
  // For now, we'll use environment variables for SMTP credentials
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER || 'professor.cat.hk@gmail.com';
  const smtpPass = process.env.SMTP_PASSWORD; // App Password from Gmail

  if (!smtpPass) {
    console.warn('[Feedback] SMTP_PASSWORD not set. Email sending will fail.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

/**
 * Send feedback email
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, message, type } = req.body;
    const userEmail = req.user.email || 'Unknown';

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('[Feedback] Email transporter not configured');
      return res.status(500).json({ 
        message: 'Email service not configured. Please contact support directly.' 
      });
    }

    const mailOptions = {
      from: `"Focus App" <${process.env.SMTP_USER || 'professor.cat.hk@gmail.com'}>`,
      to: 'professor.cat.hk@gmail.com',
      replyTo: userEmail,
      subject: subject || `Feedback from Focus App - ${type || 'General'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #34C759;">New Feedback from Focus App</h2>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>From:</strong> ${userEmail}</p>
            <p><strong>Type:</strong> ${type || 'General'}</p>
            <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #34C759; margin: 20px 0;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message.trim()}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
            <p>This feedback was sent from the Focus app.</p>
            <p>You can reply directly to this email to respond to the user.</p>
          </div>
        </div>
      `,
      text: `
New Feedback from Focus App

From: ${userEmail}
Type: ${type || 'General'}
Subject: ${subject || 'No subject'}

Message:
${message.trim()}

---
This feedback was sent from the Focus app.
You can reply directly to this email to respond to the user.
      `,
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`[Feedback] Feedback sent from ${userEmail}`);
    
    res.json({ 
      message: 'Feedback sent successfully. Thank you!' 
    });
  } catch (error) {
    console.error('[Feedback] Error sending feedback:', error);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      return res.status(500).json({ 
        message: 'Email authentication failed. Please check SMTP credentials.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to send feedback. Please try again later or contact support directly.' 
    });
  }
});

module.exports = router;

