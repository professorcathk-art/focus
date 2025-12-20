-- Add is_rolled_over column to todos table
-- This tracks tasks that were automatically moved from previous day
ALTER TABLE todos ADD COLUMN IF NOT EXISTS is_rolled_over BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_todos_is_rolled_over ON todos(user_id, date, is_rolled_over) WHERE is_rolled_over = TRUE;

