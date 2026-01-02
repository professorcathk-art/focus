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
    // Get timezone offset from request body (in minutes from UTC)
    // JavaScript's getTimezoneOffset() returns:
    // - Positive values for timezones behind UTC (e.g., PST UTC-8 = +480)
    // - Negative values for timezones ahead of UTC (e.g., JST UTC+9 = -540)
    // Example: PST is UTC-8, so offset is +480 minutes
    const timezoneOffset = req.body.timezoneOffset || 0;
    
    // Calculate current time in user's timezone
    // Since getTimezoneOffset() returns offset FROM UTC, we subtract it to get local time
    const now = new Date();
    const userNow = new Date(now.getTime() - (timezoneOffset * 60 * 1000));
    
    // Get today and yesterday in user's timezone
    const today = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format dates as YYYY-MM-DD strings using local date components (NOT toISOString which converts to UTC)
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const yesterdayStr = formatLocalDate(yesterday);
    const todayStr = formatLocalDate(today);
    
    console.log(`[MOVE-INCOMPLETE] User timezone offset: ${timezoneOffset} minutes`);
    console.log(`[MOVE-INCOMPLETE] User's today: ${todayStr}, yesterday: ${yesterdayStr}`);
    console.log(`[MOVE-INCOMPLETE] User's current time: ${userNow.toISOString()}`);

    // Check if it's past midnight in user's timezone (right after 12:00 AM)
    // Allow moving tasks immediately after midnight
    const hoursSinceMidnight = userNow.getHours() + (userNow.getMinutes() / 60);
    if (hoursSinceMidnight < 0) {
      // This shouldn't happen, but safety check
      console.log(`[MOVE-INCOMPLETE] Invalid time calculation (${hoursSinceMidnight.toFixed(2)} hours since midnight), skipping`);
      return res.json({ success: true, moved: 0, message: 'Invalid time calculation' });
    }

    // Get incomplete todos from yesterday
    console.log(`[MOVE-INCOMPLETE] Looking for incomplete todos with date: ${yesterdayStr} for user: ${req.user.id}`);
    
    const { data: incompleteTodos, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', yesterdayStr)
      .eq('completed', false);
    
    if (fetchError) {
      console.error('[MOVE-INCOMPLETE] Error fetching incomplete todos:', fetchError);
      return res.status(500).json({ message: 'Failed to fetch incomplete todos' });
    }

    console.log(`[MOVE-INCOMPLETE] Found ${incompleteTodos?.length || 0} incomplete todos from yesterday (${yesterdayStr})`);
    
    // Log all todos for debugging
    if (incompleteTodos && incompleteTodos.length > 0) {
      incompleteTodos.forEach(todo => {
        console.log(`[MOVE-INCOMPLETE] Todo to move: id=${todo.id}, text="${todo.text?.substring(0, 30)}...", date=${todo.date}, completed=${todo.completed}`);
      });
    } else {
      // Check if there are any todos from yesterday at all (completed or not)
      const { data: allYesterdayTodos, error: checkError } = await supabase
        .from('todos')
        .select('id, text, date, completed')
        .eq('user_id', req.user.id)
        .eq('date', yesterdayStr);
      
      if (!checkError && allYesterdayTodos) {
        console.log(`[MOVE-INCOMPLETE] Total todos from yesterday (${yesterdayStr}): ${allYesterdayTodos.length}`);
        allYesterdayTodos.forEach(todo => {
          console.log(`[MOVE-INCOMPLETE]   - id=${todo.id}, completed=${todo.completed}, text="${todo.text?.substring(0, 30)}..."`);
        });
      }
    }

    // Simplified: Move ALL incomplete tasks from yesterday to today
    // No need to filter or track rolled_over - simpler calendar approach
    if (!incompleteTodos || incompleteTodos.length === 0) {
      console.log(`[MOVE-INCOMPLETE] No incomplete tasks to move from ${yesterdayStr} to ${todayStr}`);
      return res.json({ success: true, moved: 0, message: `No incomplete tasks found from ${yesterdayStr}` });
    }

    // DUPLICATE each incomplete todo to today (don't delete original)
    const duplicatedTodos = [];
    const nowISO = new Date().toISOString();
    
    for (const todo of incompleteTodos) {
      // Create a new todo for today with same content
      const newTodoId = require('crypto').randomUUID();
      const { data: duplicatedTodo, error: insertError } = await supabase
        .from('todos')
        .insert({
          id: newTodoId,
          user_id: req.user.id,
          text: todo.text,
          completed: false, // Always incomplete when duplicated
          date: todayStr,
          created_at: nowISO,
          updated_at: nowISO,
          is_rolled_over: true, // Mark as rolled over from previous day
        })
        .select('*')
        .single();

      if (insertError) {
        console.error(`Error duplicating todo ${todo.id}:`, insertError);
      } else {
        duplicatedTodos.push(duplicatedTodo);
        console.log(`[MOVE-INCOMPLETE] ✅ Duplicated todo "${todo.text?.substring(0, 30)}..." from ${yesterdayStr} to ${todayStr}`);
      }
    }

    res.json({ success: true, moved: duplicatedTodos.length, message: `Duplicated ${duplicatedTodos.length} incomplete tasks from ${yesterdayStr} to ${todayStr}` });
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

