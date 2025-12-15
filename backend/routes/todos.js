/**
 * Todos routes - Daily to-do list management
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

/**
 * Get todos for a specific date (defaults to today)
 */
router.get('/today', requireAuth, async (req, res) => {
  try {
    // Support date query parameter: ?date=2024-01-15
    const requestedDate = req.query.date || new Date().toISOString().split('T')[0];
    const dateStr = requestedDate.split('T')[0]; // Ensure YYYY-MM-DD format

    const { data: todos, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', dateStr)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching todos:', error);
      return res.status(500).json({ message: 'Failed to fetch todos' });
    }

    // Format response to match Todo interface
    const formattedTodos = (todos || []).map(todo => ({
      id: todo.id,
      userId: todo.user_id,
      text: todo.text,
      completed: todo.completed,
      date: todo.date,
      dueDate: todo.date, // Use date as dueDate
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
      isRolledOver: todo.is_rolled_over || false,
    }));

    res.json(formattedTodos);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Move incomplete tasks from previous day to today
 * Only moves tasks after midnight (new day)
 * Only moves tasks that were NOT manually added for a future date
 * IMPORTANT: This route must be defined BEFORE /:id routes to avoid route conflicts
 * CRITICAL: Route path must match exactly - no typos!
 */
router.post('/move-incomplete', requireAuth, async (req, res) => {
  console.log('[MOVE-INCOMPLETE] Route hit!', req.method, req.path, req.originalUrl);
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Check if it's past midnight (at least 1 hour into the new day)
    // This prevents moving tasks during the same day
    const hoursSinceMidnight = now.getHours() + (now.getMinutes() / 60);
    if (hoursSinceMidnight < 1) {
      // Too early in the day, don't move yet
      return res.json({ success: true, moved: 0, message: 'Too early in the day' });
    }

    // Get incomplete todos from yesterday
    // Only get tasks that were NOT manually added for a future date
    // We check: created_at date <= task date (meaning task wasn't manually set to future)
    // OR task is already rolled over (can be rolled again)
    const { data: incompleteTodos, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', yesterdayStr)
      .eq('completed', false);
    
    if (fetchError) {
      console.error('Error fetching incomplete todos:', fetchError);
      return res.status(500).json({ message: 'Failed to fetch incomplete todos' });
    }

    // Filter to only include tasks that:
    // 1. Were created on or before the task date (not manually added for future)
    // 2. OR are already rolled over (can be rolled again)
    const tasksToMove = (incompleteTodos || []).filter(todo => {
      const todoCreatedDate = new Date(todo.created_at).toISOString().split('T')[0];
      const todoDate = todo.date;
      
      // If task is already rolled over, it can be moved again
      if (todo.is_rolled_over) {
        return true;
      }
      
      // If created date <= task date, it's a normal task (not manually set to future)
      return todoCreatedDate <= todoDate;
    });

    if (!tasksToMove || tasksToMove.length === 0) {
      return res.json({ success: true, moved: 0 });
    }

    // Move each incomplete todo to today and mark as rolled over
    const movedTodos = [];
    for (const todo of tasksToMove) {
      const { data: movedTodo, error: updateError } = await supabase
        .from('todos')
        .update({
          date: todayStr,
          is_rolled_over: true, // Mark as rolled over
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
});

/**
 * Create a new todo
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { text, date } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Todo text is required' });
    }

    const todoDate = date || new Date().toISOString().split('T')[0];
    const todoId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    const { data: todo, error } = await supabase
      .from('todos')
      .insert({
        id: todoId,
        user_id: req.user.id,
        text: text.trim(),
        completed: false,
        date: todoDate,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Create todo error:', error);
      return res.status(500).json({ message: 'Failed to create todo' });
    }

    // Format response to match Todo interface
    res.json({
      id: todo.id,
      userId: todo.user_id,
      text: todo.text,
      completed: todo.completed,
      date: todo.date,
      dueDate: todo.date, // Use date as dueDate
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
      isRolledOver: todo.is_rolled_over || false,
    });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Update todo (toggle completed, update text)
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, text } = req.body;

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (typeof completed === 'boolean') {
      updateData.completed = completed;
    }

    if (text !== undefined) {
      updateData.text = text.trim();
    }

    const { data: todo, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('*')
      .single();

    if (error) {
      console.error('Update todo error:', error);
      return res.status(500).json({ message: 'Failed to update todo' });
    }

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Format response to match Todo interface
    res.json({
      id: todo.id,
      userId: todo.user_id,
      text: todo.text,
      completed: todo.completed,
      date: todo.date,
      dueDate: todo.date, // Use date as dueDate
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
      isRolledOver: todo.is_rolled_over || false,
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Delete todo
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Delete todo error:', error);
      return res.status(500).json({ message: 'Failed to delete todo' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

