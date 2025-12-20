/**
 * Express server for Focus API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware - log ALL incoming requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl} - Path: ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
// Register ideas routes with explicit logging
const ideasRouter = require('./routes/ideas');
console.log('[SERVER] Ideas router loaded, checking routes...');
// Log all registered routes for debugging
ideasRouter.stack.forEach((r) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`[SERVER] Registered route: ${methods} ${r.route.path}`);
  }
});
app.use('/api/ideas', ideasRouter);
app.use('/api/clusters', require('./routes/clusters'));
app.use('/api/search', require('./routes/search'));
app.use('/api/chat', require('./routes/chat'));

// Note: move-incomplete route is now in routes/todos.js to ensure Vercel picks it up

// Register todos routes with explicit logging
const todosRouter = require('./routes/todos');
console.log('[SERVER] Todos router loaded, checking routes...');
console.log('[SERVER] Total router stack length:', todosRouter.stack.length);
// Log all registered routes for debugging
todosRouter.stack.forEach((r, index) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    const fullPath = `/api/todos${r.route.path}`;
    console.log(`[SERVER] Route ${index}: ${methods} ${r.route.path} -> Full path: ${fullPath}`);
    // Explicitly check for move-incomplete route
    if (r.route.path === '/move-incomplete') {
      console.log(`[SERVER] ✅ Found move-incomplete route! Methods: ${methods}`);
    }
  } else {
    console.log(`[SERVER] Stack item ${index}:`, r.name || 'unnamed', r.regexp?.toString() || 'no regexp');
  }
});
app.use('/api/todos', todosRouter);
console.log('[SERVER] ✅ Todos router mounted at /api/todos');
app.use('/api/user', require('./routes/user'));
app.use('/api/feedback', require('./routes/feedback'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for unmatched routes
app.use((req, res, next) => {
  console.error(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  console.error(`[404] Path: ${req.path}, Original URL: ${req.originalUrl}`);
  // Log all registered routes for debugging
  console.error(`[404] Registered todos routes:`, todosRouter.stack.map(r => {
    if (r.route) {
      const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
      return `${methods} ${r.route.path}`;
    }
    return null;
  }).filter(Boolean));
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    path: req.path,
    originalUrl: req.originalUrl,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Log all registered routes at startup (for debugging)
console.log('[SERVER] ===== REGISTERED ROUTES =====');
app._router.stack.forEach((middleware, index) => {
  if (middleware.route) {
    const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
    console.log(`[SERVER] ${index}: ${methods} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    console.log(`[SERVER] ${index}: Router mounted at ${middleware.regexp}`);
  }
});
console.log('[SERVER] ===== END ROUTES =====');

// Export app for Vercel serverless functions
module.exports = app;

// Only listen on PORT if running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
app.listen(PORT, () => {
  console.log(`🚀 Focus API server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
}

