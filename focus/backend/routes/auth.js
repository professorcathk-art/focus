/**
 * Authentication routes
 * Frontend uses Supabase Auth directly - these routes are deprecated
 * Keeping for backward compatibility but frontend should use Supabase Auth
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

/**
 * Sign up - Frontend uses Supabase Auth directly
 */
router.post('/signup', async (req, res) => {
  res.status(200).json({ 
    message: 'Please use Supabase Auth directly from the frontend' 
  });
});

/**
 * Sign in - Frontend uses Supabase Auth directly
 */
router.post('/signin', async (req, res) => {
  res.status(200).json({ 
    message: 'Please use Supabase Auth directly from the frontend' 
  });
});

/**
 * Get current user
 */
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

/**
 * Sign out - Frontend uses Supabase Auth directly
 */
router.post('/signout', requireAuth, async (req, res) => {
  res.json({ message: 'Signed out successfully' });
});

module.exports = router;
