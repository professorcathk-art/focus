# Transcription Status & Error Checking Guide

## How to Check Transcription Status

### 1. **In the App (Frontend)**
- Open the idea detail page for any audio note
- If transcription is still in progress: You'll see "Transcribing audio..." with a loading spinner
- If transcription failed: You'll see a red error box with the error message and idea ID
- If transcription succeeded: You'll see the transcribed text

### 2. **In Vercel Logs**
1. Go to your Vercel dashboard
2. Navigate to your project → Functions → Logs
3. Search for `[Async Transcription]` to see all transcription-related logs
4. Look for these key log messages:
   - `🎙️ Starting transcription for idea: <id>` - Transcription started
   - `Generation ID: <id>, polling for result...` - Task created, polling started
   - `Poll response: ...` - Polling updates (every 3 seconds)
   - `✅ Transcription received!` - Transcript ready
   - `✅ Verified: Idea <id> updated with transcript` - Saved to database
   - `❌ Error transcribing idea <id>` - Error occurred

### 3. **In Database (Supabase)**
1. Go to Supabase Dashboard → Table Editor → `ideas` table
2. Find your idea by ID (shown in app error message)
3. Check these columns:
   - `transcript` - Should contain text if successful, empty if failed/pending
   - `transcription_error` - Contains error message if transcription failed
   - `updated_at` - Last update timestamp

### 4. **Common Error Messages**

#### "No generation_id returned from AIMLAPI"
- **Cause**: AIMLAPI create endpoint didn't return expected response
- **Check**: Vercel logs for the full AIMLAPI response
- **Fix**: Verify AIML_API_KEY is set correctly in Vercel

#### "No transcript returned from AIMLAPI after polling"
- **Cause**: Polling timed out (5 minutes) or AIMLAPI didn't return transcript
- **Check**: Vercel logs for poll responses
- **Fix**: Check AIMLAPI status, verify audio file format

#### "AIMLAPI transcription failed: 400/401/403"
- **Cause**: API authentication or request format issue
- **Check**: Vercel logs for full error response
- **Fix**: Verify AIML_API_KEY and request format

#### "Failed to update idea"
- **Cause**: Database update failed
- **Check**: Supabase logs
- **Fix**: Check database connection and permissions

## Database Migration

To enable error tracking, run this SQL in Supabase:

```sql
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS transcription_error TEXT;

CREATE INDEX IF NOT EXISTS idx_ideas_transcription_error ON ideas(transcription_error) 
WHERE transcription_error IS NOT NULL;
```

File: `backend/add-transcription-error-field.sql`

## Troubleshooting Steps

1. **Check if transcription started**:
   - Look for `[Async Transcription] 🎙️ Starting transcription` in Vercel logs
   - If missing, check if audio upload succeeded

2. **Check if polling is working**:
   - Look for `Generation ID: ...` and `Poll response:` logs
   - Should see polling every 3 seconds

3. **Check if transcript was saved**:
   - Query database: `SELECT transcript, transcription_error FROM ideas WHERE id = '<idea-id>'`
   - Or check in Supabase dashboard

4. **If stuck in "Transcribing"**:
   - Check `transcription_error` field in database
   - Check Vercel logs for errors
   - Check if polling completed (look for timeout after 5 minutes)

## API Response Format

All idea endpoints now include `transcriptionError` field:

```json
{
  "id": "...",
  "transcript": "...",
  "audioUrl": "...",
  "transcriptionError": null  // or error message string
}
```

- `transcriptionError: null` - No error (success or pending)
- `transcriptionError: "error message"` - Transcription failed with this error
