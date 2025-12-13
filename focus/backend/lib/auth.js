/**
 * Authentication utilities
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('./supabase');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Generate JWT token for user
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 */
async function hashPassword(password) {
  // Use Supabase's built-in auth for password hashing
  // For now, we'll use a simple approach - in production, use bcrypt or Supabase Auth
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Authenticate user from token
 */
async function authenticateUser(token) {
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, created_at, updated_at')
    .eq('id', decoded.userId)
    .single();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  authenticateUser,
  JWT_SECRET,
};

