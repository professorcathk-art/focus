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

// CRITICAL FIX: Register move-incomplete route DIRECTLY on app BEFORE router
// This ensures it's matched before any /:id routes can intercept it
// This is a workaround for Vercel serverless function route matching
const { requireAuth: requireAuthTodos } = require('./middleware/auth');
const supabaseTodos = require('./lib/supabase');

// Register route with explicit logging to ensure it's matched
app.post('/api/todos/move-incomplete', requireAuthTodos, async (req, res) => {
  console.log('[SERVER] ⚡ Move-incomplete route MATCHED! Method:', req.method, 'Path:', req.path, 'Original URL:', req.originalUrl);
  await handleMoveIncomplete(req, res);
});

// Extract handler to separate function
async function handleMoveIncomplete(req, res) {
  console.log('[SERVER] Move-incomplete handler executing');
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const hoursSinceMidnight = now.getHours() + (now.getMinutes() / 60);
    if (hoursSinceMidnight < 1) {
      return res.json({ success: true, moved: 0, message: 'Too early in the day' });
    }

    const { data: incompleteTodos, error: fetchError } = await supabaseTodos
      .from('todos')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', yesterdayStr)
      .eq('completed', false);
    
    if (fetchError) {
      console.error('Error fetching incomplete todos:', fetchError);
      return res.status(500).json({ message: 'Failed to fetch incomplete todos' });
    }

    const tasksToMove = (incompleteTodos || []).filter(todo => {
      const todoCreatedDate = new Date(todo.created_at).toISOString().split('T')[0];
      const todoDate = todo.date;
      if (todo.is_rolled_over) return true;
      return todoCreatedDate <= todoDate;
    });

    if (!tasksToMove || tasksToMove.length === 0) {
      return res.json({ success: true, moved: 0 });
    }

    const movedTodos = [];
    for (const todo of tasksToMove) {
      const { data: movedTodo, error: updateError } = await supabaseTodos
        .from('todos')
        .update({
          date: todayStr,
          is_rolled_over: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', todo.id)
        .eq('user_id', req.user.id)
        .select('*')
        .single();

      if (updateError) {
        console.error(`Error moving todo ${todo.id}:`, updateError);
      } else {
        movedTodos.push(movedTodo);
      }
    }

    res.json({ success: true, moved: movedTodos.length });
  } catch (error) {
    console.error('Move incomplete todos error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Register todos routes with explicit logging
const todosRouter = require('./routes/todos');
console.log('[SERVER] Todos router loaded, checking routes...');
console.log('[SERVER] Total router stack length:', todosRouter.stack.length);
// Log all registered routes for debugging
todosRouter.stack.forEach((r, index) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`[SERVER] Route ${index}: ${methods} ${r.route.path}`);
  } else {
    console.log(`[SERVER] Stack item ${index}:`, r.name || 'unnamed', r.regexp?.toString() || 'no regexp');
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

// Export app for Vercel serverless functions
module.exports = app;

// Only listen on PORT if running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Focus API server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

