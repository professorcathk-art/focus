-- Add transcription_error field to ideas table to track transcription failures

ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS transcription_error TEXT;

-- Add index for querying ideas with errors
CREATE INDEX IF NOT EXISTS idx_ideas_transcription_error ON ideas(transcription_error) 
WHERE transcription_error IS NOT NULL;

-- Add comment
COMMENT ON COLUMN ideas.transcription_error IS 'Stores error message if transcription failed';
