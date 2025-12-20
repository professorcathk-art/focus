-- Add favorite column to ideas table
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create index for faster favorite queries
CREATE INDEX IF NOT EXISTS idx_ideas_is_favorite ON ideas(user_id, is_favorite) WHERE is_favorite = TRUE;


