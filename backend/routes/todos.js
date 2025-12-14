/**
 * Todos routes - Daily to-do list management
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

/**
 * Get today's todos
 */
router.get('/today', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const { data: todos, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', today)
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
    }));

    res.json(formattedTodos);
  } catch (error) {
    console.error('Get todos error:', error);
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

/**
 * Reset todos for next day (mark all today's todos as incomplete)
 */
router.post('/reset-today', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('todos')
      .update({ completed: false, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .eq('date', today);

    if (error) {
      console.error('Reset todos error:', error);
      return res.status(500).json({ message: 'Failed to reset todos' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Reset todos error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

