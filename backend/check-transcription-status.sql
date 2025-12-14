-- SQL Queries to Check Transcription Status in Supabase
-- Run these in Supabase SQL Editor or Table Editor

-- 1. Check all ideas with audio but no transcript (stuck in transcribing)
SELECT 
  id,
  user_id,
  audio_url,
  transcript,
  LENGTH(transcript) as transcript_length,
  transcription_error,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutes_since_created
FROM ideas
WHERE audio_url IS NOT NULL 
  AND (transcript IS NULL OR transcript = '')
ORDER BY created_at DESC;

-- 2. Check ideas with transcription errors
SELECT 
  id,
  user_id,
  audio_url,
  transcript,
  transcription_error,
  created_at,
  updated_at
FROM ideas
WHERE transcription_error IS NOT NULL
ORDER BY updated_at DESC;

-- 3. Check recent audio ideas and their transcription status
SELECT 
  id,
  user_id,
  CASE 
    WHEN audio_url IS NULL THEN 'No audio'
    WHEN transcript IS NULL OR transcript = '' THEN 
      CASE 
        WHEN transcription_error IS NOT NULL THEN 'Failed: ' || LEFT(transcription_error, 50)
        ELSE 'Transcribing...'
      END
    ELSE 'Transcribed: ' || LEFT(transcript, 50)
  END as status,
  LENGTH(transcript) as transcript_length,
  created_at,
  updated_at
FROM ideas
WHERE audio_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check a specific idea by ID (replace 'YOUR_IDEA_ID' with actual ID)
-- SELECT 
--   id,
--   user_id,
--   audio_url,
--   transcript,
--   LENGTH(transcript) as transcript_length,
--   transcription_error,
--   created_at,
--   updated_at
-- FROM ideas
-- WHERE id = 'YOUR_IDEA_ID';

-- 5. Count transcription status
SELECT 
  CASE 
    WHEN audio_url IS NULL THEN 'No audio'
    WHEN transcript IS NULL OR transcript = '' THEN 
      CASE 
        WHEN transcription_error IS NOT NULL THEN 'Failed'
        ELSE 'Pending'
      END
    ELSE 'Completed'
  END as status,
  COUNT(*) as count
FROM ideas
WHERE audio_url IS NOT NULL
GROUP BY status;
