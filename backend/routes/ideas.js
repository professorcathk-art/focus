/**
 * Ideas routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../lib/supabase');
const aimlClient = require('../lib/aiml-client');
const { requireAuth } = require('../middleware/auth');
const { assignToCluster, findBestCluster, generateClusterLabel } = require('../lib/clustering');
const FormData = require('form-data');

// Import Vercel's waitUntil for background tasks
let waitUntil;
try {
  waitUntil = require('@vercel/functions').waitUntil;
} catch (e) {
  // Fallback if @vercel/functions is not available (local dev)
  waitUntil = (promise) => {
    promise.catch(err => console.error('[waitUntil] Background task error:', err));
  };
}

/**
 * Async transcription function - runs in background
 * Updates idea with transcript and embedding when complete
 */
async function transcribeAudioAsync(ideaId, audioBuffer, mimeType, aimlApiKey, userId) {
  // Add initial validation and logging
  console.log(`[Async Transcription] 🎙️ Starting transcription for idea: ${ideaId}`);
  console.log(`[Async Transcription] Parameters:`, {
    ideaId,
    audioBufferSize: audioBuffer?.length || 0,
    mimeType: mimeType || 'unknown',
    aimlApiKeyPresent: !!aimlApiKey,
    userId,
  });
  
  if (!audioBuffer || audioBuffer.length === 0) {
    const errorMsg = 'Audio buffer is empty or missing';
    console.error(`[Async Transcription] ❌ ${errorMsg}`);
    await supabase
      .from('ideas')
      .update({
        transcription_error: errorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ideaId)
      .eq('user_id', userId)
      .catch(err => console.error(`[Async Transcription] Failed to save error:`, err));
    return;
  }
  
  try {
    console.log(`[Async Transcription] Audio buffer size: ${audioBuffer.length} bytes, mimeType: ${mimeType}`);
    console.log(`[Async Transcription] AIMLAPI key present: ${!!aimlApiKey}`);
    
    if (!aimlApiKey) {
      throw new Error('AIMLAPI key not configured');
    }
    
    // Use AIMLAPI STT endpoint with multipart/form-data
    const aimlFormData = new FormData();
    aimlFormData.append('file', audioBuffer, {
      filename: 'recording.m4a',
      contentType: mimeType || 'audio/m4a',
      knownLength: audioBuffer.length,
    });
    aimlFormData.append('model', '#g1_nova-2-general');
    
    const aimlFormHeaders = aimlFormData.getHeaders();
    const aimlBaseUrl = 'https://api.aimlapi.com/v1';
    
    // Convert FormData to buffer
    const formBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      aimlFormData.on('data', (chunk) => chunks.push(chunk));
      aimlFormData.on('end', () => resolve(Buffer.concat(chunks)));
      aimlFormData.on('error', reject);
    });
    
    aimlFormHeaders['Content-Length'] = formBuffer.length.toString();
    
    console.log(`[Async Transcription] Calling AIMLAPI: ${aimlBaseUrl}/stt/create`);
    console.log(`[Async Transcription] FormData size: ${formBuffer.length} bytes`);
    
    // STEP 1: Create transcription task (returns generation_id)
    const TIMEOUT_MS = 60000; // 60s for initial request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    let createResponse;
    try {
      createResponse = await fetch(`${aimlBaseUrl}/stt/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aimlApiKey}`,
          ...aimlFormHeaders,
        },
        body: formBuffer,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
        throw new Error('AIMLAPI request timed out after 60 seconds');
      }
      throw new Error(`AIMLAPI fetch error: ${fetchError.message}`);
    }
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Not JSON
      }
      console.error(`[Async Transcription] AIMLAPI create error response:`, {
        status: createResponse.status,
        statusText: createResponse.statusText,
        error: errorText,
        errorJson: errorJson,
      });
      throw new Error(`AIMLAPI transcription failed: ${createResponse.status} - ${errorText.substring(0, 200)}`);
    }
    
    const createData = await createResponse.json();
    console.log(`[Async Transcription] Create response:`, JSON.stringify(createData).substring(0, 500));
    
    // Extract generation_id from response
    const generationId = createData.generation_id || createData.id || createData.generationId;
    if (!generationId) {
      console.error(`[Async Transcription] No generation_id in response:`, JSON.stringify(createData));
      throw new Error('No generation_id returned from AIMLAPI');
    }
    
    console.log(`[Async Transcription] Generation ID: ${generationId}, polling for result...`);
    
    // STEP 2: Poll for transcription result (up to 5 minutes)
    const POLL_TIMEOUT_MS = 300000; // 5 minutes total
    const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
    const startTime = Date.now();
    let transcript = null;
    let aimlData = null;
    
    while (Date.now() - startTime < POLL_TIMEOUT_MS) {
      try {
        const pollResponse = await fetch(`${aimlBaseUrl}/stt/${generationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${aimlApiKey}`,
          },
        });
        
        if (!pollResponse.ok) {
          const errorText = await pollResponse.text();
          console.error(`[Async Transcription] Poll error: ${pollResponse.status} - ${errorText}`);
          if (pollResponse.status === 404) {
            // Not ready yet, continue polling
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
            continue;
          }
          throw new Error(`Poll failed: ${pollResponse.status} - ${errorText.substring(0, 200)}`);
        }
        
        aimlData = await pollResponse.json();
        console.log(`[Async Transcription] Poll response:`, JSON.stringify(aimlData).substring(0, 500));
        
        // Check if transcription is ready
        transcript = aimlData.transcription || aimlData.text || aimlData.transcript || 
                     aimlData.result?.transcription || aimlData.data?.transcription ||
                     aimlData.result?.text || aimlData.data?.text;
        
        if (transcript && typeof transcript === 'string' && transcript.trim()) {
          console.log(`[Async Transcription] ✅ Transcription received!`);
          break;
        }
        
        // Check status - if completed but no transcript, might be an error
        const status = aimlData.status || aimlData.state;
        if (status === 'completed' || status === 'done') {
          if (!transcript) {
            console.error(`[Async Transcription] Status completed but no transcript:`, JSON.stringify(aimlData));
            throw new Error('Transcription completed but no transcript found');
          }
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      } catch (pollError) {
        if (pollError.message?.includes('Poll failed') && !pollError.message?.includes('404')) {
          throw pollError;
        }
        // For 404 or other transient errors, continue polling
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    }
    
    if (!transcript || typeof transcript !== 'string') {
      console.error(`[Async Transcription] No transcript after polling:`, JSON.stringify(aimlData));
      throw new Error('No transcript returned from AIMLAPI after polling');
    }
    
    const trimmedTranscript = transcript.trim();
    if (!trimmedTranscript) {
      console.error(`[Async Transcription] Transcript is empty after trimming`);
      throw new Error('Transcript is empty');
    }
    
    console.log(`[Async Transcription] ✅ Transcription complete for idea ${ideaId}: "${trimmedTranscript.substring(0, 100)}..."`);
    
    // Generate embedding
    console.log(`[Async Transcription] Generating embedding...`);
    const embeddingResponse = await aimlClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: trimmedTranscript,
    });
    const embedding = embeddingResponse.data[0].embedding;
    console.log(`[Async Transcription] Embedding generated (${embedding.length} dimensions)`);
    
    // Update idea with transcript and embedding
    console.log(`[Async Transcription] Updating idea ${ideaId} in database...`);
    console.log(`[Async Transcription] Transcript length: ${trimmedTranscript.length} characters`);
    
    const { error: updateError } = await supabase
      .from('ideas')
      .update({
        transcript: trimmedTranscript,
        embedding: embedding,
        transcription_error: null, // Clear any previous errors
        updated_at: new Date().toISOString(),
      })
      .eq('id', ideaId)
      .eq('user_id', userId);
    
    if (updateError) {
      console.error(`[Async Transcription] Database update error:`, updateError);
      throw new Error(`Failed to update idea: ${updateError.message}`);
    }
    
    // Verify the update succeeded by fetching the idea
    const { data: updatedIdea, error: verifyError } = await supabase
      .from('ideas')
      .select('transcript')
      .eq('id', ideaId)
      .eq('user_id', userId)
      .single();
    
    if (verifyError || !updatedIdea) {
      console.error(`[Async Transcription] Failed to verify update:`, verifyError);
    } else {
      console.log(`[Async Transcription] ✅ Verified: Idea ${ideaId} updated with transcript (${updatedIdea.transcript?.length || 0} chars)`);
    }
    
    console.log(`[Async Transcription] ✅ Idea ${ideaId} updated with transcript and embedding`);
    
    // Try clustering (non-blocking)
    try {
      const { findBestCluster, generateClusterLabel } = require('../lib/clustering');
      const existingClusterId = await findBestCluster(userId, embedding);
      
      if (existingClusterId) {
        await supabase
          .from('ideas')
          .update({ cluster_id: existingClusterId })
          .eq('id', ideaId);
        console.log(`[Async Transcription] ✅ Auto-assigned idea ${ideaId} to cluster ${existingClusterId}`);
      }
    } catch (clusterError) {
      console.error(`[Async Transcription] ⚠️ Clustering error (non-fatal):`, clusterError);
    }
  } catch (error) {
    console.error(`[Async Transcription] ❌ Error transcribing idea ${ideaId}:`, error);
    console.error(`[Async Transcription] Error stack:`, error.stack);
    
    // Store error in database so user can see what went wrong
    const errorMessage = error.message || 'Unknown transcription error';
    const errorDetails = `${errorMessage}${error.stack ? `\n\nStack: ${error.stack.substring(0, 500)}` : ''}`;
    
    try {
      await supabase
        .from('ideas')
        .update({
          transcription_error: errorDetails.substring(0, 1000), // Limit to 1000 chars
          updated_at: new Date().toISOString(),
        })
        .eq('id', ideaId)
        .eq('user_id', userId);
      
      console.error(`[Async Transcription] Error saved to database for idea ${ideaId}`);
    } catch (dbError) {
      console.error(`[Async Transcription] Failed to save error to database:`, dbError);
    }
  }
}

// Debug middleware to log all PUT requests
router.use((req, res, next) => {
  if (req.method === 'PUT') {
    console.log(`[ROUTER DEBUG] PUT request: path=${req.path}, originalUrl=${req.originalUrl}, baseUrl=${req.baseUrl}`);
  }
  next();
});

// Configure multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

/**
 * List user's ideas
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    // Select specific columns to avoid JSON parsing issues with vector/embedding type
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite, transcription_error')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ideas:', error);
      return res.status(500).json({ message: 'Failed to fetch ideas' });
    }

    const formattedIdeas = ideas.map(idea => ({
      id: idea.id,
      userId: idea.user_id,
      transcript: idea.transcript,
      audioUrl: idea.audio_url,
      duration: idea.duration,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at,
      clusterId: idea.cluster_id,
      isFavorite: idea.is_favorite || false,
      transcriptionError: idea.transcription_error || null,
    }));

    res.json(formattedIdeas);
  } catch (error) {
    console.error('List ideas error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get single idea
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    // Select specific columns to avoid JSON parsing issues with vector/embedding type
    const { data: idea, error } = await supabase
      .from('ideas')
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite, transcription_error')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    res.json({
      id: idea.id,
      userId: idea.user_id,
      transcript: idea.transcript,
      audioUrl: idea.audio_url,
      duration: idea.duration,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at,
      clusterId: idea.cluster_id,
      isFavorite: idea.is_favorite || false,
      transcriptionError: idea.transcription_error || null,
    });
  } catch (error) {
    console.error('Get idea error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Toggle favorite status (must come before /:id route)
 * Route: PUT /api/ideas/:id/favorite
 * IMPORTANT: This route MUST be defined before router.put('/:id') to work correctly
 * This is a simple boolean toggle - no AI needed
 */
router.put('/:id/favorite', requireAuth, async (req, res) => {
  // Double-check this is a favorite request
  if (!req.path.endsWith('/favorite') && !req.originalUrl.includes('/favorite')) {
    console.error(`[FAVORITE ROUTE] ⚠️ Path doesn't end with /favorite: ${req.path}`);
    return res.status(404).json({ message: 'Route not found' });
  }
  
  const ideaId = req.params.id;
  console.log(`[FAVORITE ROUTE] ✅ PUT /:id/favorite MATCHED with id: ${ideaId}`);
  console.log(`[FAVORITE ROUTE] Request method: ${req.method}, path: ${req.path}, originalUrl: ${req.originalUrl}, params:`, req.params);
  console.log(`[FAVORITE ROUTE] Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  
  try {
    console.log(`[Toggle Favorite] Request received for idea ${ideaId}, user: ${req.user.id}`);
    
    // Check ownership and get current favorite status
    const { data: existingIdea, error: checkError } = await supabase
      .from('ideas')
      .select('is_favorite')
      .eq('id', ideaId)
      .eq('user_id', req.user.id)
      .single();

    if (checkError || !existingIdea) {
      console.error('[Toggle Favorite] Idea not found or error:', checkError);
      return res.status(404).json({ message: 'Idea not found' });
    }

    const newFavoriteStatus = !existingIdea.is_favorite;
    console.log(`[Toggle Favorite] Toggling favorite from ${existingIdea.is_favorite} to ${newFavoriteStatus}`);

    // Update favorite status (simple boolean toggle)
    const { data: idea, error } = await supabase
      .from('ideas')
      .update({ 
        is_favorite: newFavoriteStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ideaId)
      .eq('user_id', req.user.id)  // Double-check ownership
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite, transcription_error')
      .single();

    if (error) {
      console.error('[Toggle Favorite] Update error:', error);
      return res.status(500).json({ message: 'Failed to toggle favorite' });
    }

    if (!idea) {
      console.error('[Toggle Favorite] No idea returned after update');
      return res.status(404).json({ message: 'Idea not found' });
    }

    console.log(`[Toggle Favorite] ✅ Successfully toggled favorite for idea ${ideaId} to ${newFavoriteStatus}`);
    res.json({
      id: idea.id,
      userId: idea.user_id,
      transcript: idea.transcript,
      audioUrl: idea.audio_url,
      duration: idea.duration,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at,
      clusterId: idea.cluster_id,
      isFavorite: idea.is_favorite || false,
      transcriptionError: idea.transcription_error || null,
    });
  } catch (error) {
    console.error('[Toggle Favorite] Unexpected error:', error);
    console.error('[Toggle Favorite] Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Create idea from text
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ message: 'Transcript is required' });
    }

    // Generate embedding
    console.log(`[Create Idea] Generating embedding for transcript: "${transcript.substring(0, 50)}..."`);
    const embeddingResponse = await aimlClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: transcript.trim(),
    });

    const embedding = embeddingResponse.data[0].embedding;
    console.log(`[Create Idea] Embedding generated: ${embedding.length} dimensions (expected: 1536)`);
    
    if (embedding.length !== 1536) {
      console.error(`[Create Idea] ⚠️  WARNING: Embedding dimension mismatch! Got ${embedding.length}, expected 1536`);
    }

    // Create idea
    const ideaId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({
        id: ideaId,
        user_id: req.user.id,
        transcript: transcript.trim(),
        embedding,
        created_at: now,
        updated_at: now,
      })
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite, transcription_error')
      .single();

    if (error) {
      console.error('Create idea error:', error);
      return res.status(500).json({ message: 'Failed to create idea' });
    }

    console.log(`[Create Idea] ✅ Idea created successfully: ${ideaId}`);
    console.log(`[Create Idea] User ID: ${req.user.id}`);
    console.log(`[Create Idea] Embedding length: ${embedding.length}`);

    // Check for similar clusters and suggest category
    const { findBestCluster, generateClusterLabel } = require('../lib/clustering');
    const existingClusterId = await findBestCluster(req.user.id, embedding);
    let suggestedClusterLabel = null;

    if (!existingClusterId) {
      // No similar cluster found - generate suggested label
      console.log(`[Create Idea] No similar cluster found, generating suggested label...`);
      suggestedClusterLabel = await generateClusterLabel(transcript.trim());
      console.log(`[Create Idea] Suggested cluster label: "${suggestedClusterLabel}"`);
    } else {
      // Similar cluster found - auto-assign
      console.log(`[Create Idea] Found similar cluster ${existingClusterId}, auto-assigning...`);
      const { error: updateError } = await supabase
        .from('ideas')
        .update({ cluster_id: existingClusterId })
        .eq('id', ideaId);
      
      if (!updateError) {
        console.log(`[Create Idea] ✅ Auto-assigned idea ${ideaId} to cluster ${existingClusterId}`);
      }
    }

    res.json({
      id: idea.id,
      userId: idea.user_id,
      transcript: idea.transcript,
      audioUrl: idea.audio_url,
      duration: idea.duration,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at,
      clusterId: idea.cluster_id || existingClusterId || null,
      embedding: idea.embedding,
      isFavorite: idea.is_favorite || false,
      suggestedClusterLabel: suggestedClusterLabel, // Include suggested label if no match found
      transcriptionError: idea.transcription_error || null,
    });
  } catch (error) {
    console.error('Create idea error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Upload audio and transcribe
 */
router.post('/upload-audio', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    // Use AIMLAPI Nova-2 model ONLY - no OpenAI fallback
    const aimlApiKey = process.env.AIML_API_KEY;

    if (!aimlApiKey) {
      console.error('[Upload Audio] AIML_API_KEY not found. Set AIML_API_KEY in environment variables');
      return res.status(500).json({ 
        message: 'Transcription service not configured. Please set AIML_API_KEY in Vercel environment variables' 
      });
    }

    console.log(`[Upload Audio] File size: ${req.file.size} bytes, type: ${req.file.mimetype}`);

    // NEW APPROACH: Save recording first, transcribe async
    // This prevents UI from getting stuck on "transcribing"
    
    // STEP 1: Upload audio file to Supabase Storage
    const ideaId = require('crypto').randomUUID();
    const audioFileName = `${req.user.id}/${ideaId}.m4a`;
    
    console.log(`[Upload Audio] 📤 Uploading audio file to Supabase Storage: ${audioFileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-recordings')
      .upload(audioFileName, req.file.buffer, {
        contentType: req.file.mimetype || 'audio/m4a',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload Audio] ❌ Failed to upload audio to Supabase Storage:', uploadError);
      return res.status(500).json({ 
        message: `Failed to upload audio file: ${uploadError.message}` 
      });
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(audioFileName);
    const audioUrl = urlData?.publicUrl || null;
    console.log(`[Upload Audio] ✅ Audio uploaded successfully: ${audioUrl}`);

    // STEP 2: Save idea immediately with audio_url (no transcript yet)
    const now = new Date().toISOString();
    
    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({
        id: ideaId,
        user_id: req.user.id,
        transcript: '', // Empty initially - will be updated by async transcription
        audio_url: audioUrl,
        duration: req.body.duration || null,
        created_at: now,
        updated_at: now,
      })
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite, transcription_error')
      .single();

    if (error) {
      console.error('Create idea error:', error);
      return res.status(500).json({ message: 'Failed to save idea' });
    }

    console.log(`[Upload Audio] ✅ Idea saved immediately with audio URL: ${ideaId}`);

    // STEP 3: Start async transcription (don't wait for it)
    // CRITICAL: Use waitUntil to ensure transcription continues after response is sent
    // Vercel serverless functions terminate after response, so we need waitUntil
    console.log(`[Upload Audio] ⏳ Starting async transcription for idea: ${ideaId}`);
    console.log(`[Upload Audio] Audio buffer available: ${!!req.file.buffer}, size: ${req.file.buffer?.length || 0} bytes`);
    console.log(`[Upload Audio] AIMLAPI key available: ${!!aimlApiKey}`);
    
    waitUntil(
      transcribeAudioAsync(ideaId, req.file.buffer, req.file.mimetype, aimlApiKey, req.user.id)
        .then(() => {
          console.log(`[Upload Audio] ✅ Async transcription completed for idea: ${ideaId}`);
        })
        .catch(err => {
          console.error(`[Upload Audio] ⚠️ Async transcription failed for ${ideaId}:`, err);
          console.error(`[Upload Audio] Error stack:`, err.stack);
        })
    );

    // Return success immediately - transcription happens in background
    res.json({
      id: idea.id,
      userId: idea.user_id,
      transcript: idea.transcript || '', // Empty initially
      audioUrl: idea.audio_url,
      duration: idea.duration,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at,
      clusterId: idea.cluster_id || null,
      isFavorite: idea.is_favorite || false,
      suggestedClusterLabel: null, // Will be set by async transcription if needed
      transcriptionError: idea.transcription_error || null,
    });
  } catch (error) {
    console.error('Upload audio error:', error);
    console.error('Upload audio error stack:', error.stack);
    const errorMessage = error.message || 'Internal server error';
    res.status(500).json({ 
      message: `Failed to process audio: ${errorMessage}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Update idea
 */
router.put('/:id', requireAuth, async (req, res) => {
  // Log to ensure this route isn't catching favorite requests
  if (req.path.includes('favorite')) {
    console.error(`[UPDATE IDEA ROUTE] ⚠️ WARNING: /:id route caught a favorite request! Path: ${req.path}`);
  }
  console.log(`[UPDATE IDEA ROUTE] PUT /:id hit with id: ${req.params.id}, path: ${req.path}`);
  
  try {
    const { transcript, clusterId } = req.body;

    // Check ownership
    const { data: existingIdea } = await supabase
      .from('ideas')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!existingIdea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    // Update transcript and regenerate embedding if changed
    let updateData = { updated_at: new Date().toISOString() };
    
    if (transcript !== undefined) {
      updateData.transcript = transcript.trim();
      
      // Regenerate embedding
      const embeddingResponse = await aimlClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: transcript.trim(),
      });
      updateData.embedding = embeddingResponse.data[0].embedding;
    }
    
    if (clusterId !== undefined) {
      updateData.cluster_id = clusterId || null;
    }

    const { data: idea, error } = await supabase
      .from('ideas')
      .update(updateData)
      .eq('id', req.params.id)
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite, transcription_error')
      .single();

    if (error) {
      console.error('Update idea error:', error);
      return res.status(500).json({ message: 'Failed to update idea' });
    }

    res.json({
      id: idea.id,
      userId: idea.user_id,
      transcript: idea.transcript,
      audioUrl: idea.audio_url,
      duration: idea.duration,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at,
      clusterId: idea.cluster_id,
      isFavorite: idea.is_favorite || false,
      transcriptionError: idea.transcription_error || null,
    });
  } catch (error) {
    console.error('Update idea error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Delete idea
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Delete idea error:', error);
      return res.status(500).json({ message: 'Failed to delete idea' });
    }

    res.json({ message: 'Idea deleted successfully' });
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
