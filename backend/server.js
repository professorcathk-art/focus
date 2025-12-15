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
// Register todos routes with explicit logging
const todosRouter = require('./routes/todos');
console.log('[SERVER] Todos router loaded, checking routes...');
// Log all registered routes for debugging
todosRouter.stack.forEach((r) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`[SERVER] Registered route: ${methods} ${r.route.path}`);
  }
});
app.use('/api/todos', todosRouter);
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

app.listen(PORT, () => {
  console.log(`🚀 Focus API server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

