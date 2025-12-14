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

/**
 * Async transcription function - runs in background
 * Updates idea with transcript and embedding when complete
 */
async function transcribeAudioAsync(ideaId, audioBuffer, mimeType, aimlApiKey, userId) {
  try {
    console.log(`[Async Transcription] 🎙️ Starting transcription for idea: ${ideaId}`);
    
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
    
    // Add timeout (240s)
    const TIMEOUT_MS = 240000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const aimlResponse = await fetch(`${aimlBaseUrl}/stt/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aimlApiKey}`,
        ...aimlFormHeaders,
      },
      body: formBuffer,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!aimlResponse.ok) {
      throw new Error(`AIMLAPI transcription failed: ${aimlResponse.status}`);
    }
    
    const aimlData = await aimlResponse.json();
    const transcript = aimlData.transcription || aimlData.text || aimlData.transcript || 
                       aimlData.result?.transcription || aimlData.data?.transcription;
    
    if (!transcript) {
      throw new Error('No transcript returned from AIMLAPI');
    }
    
    console.log(`[Async Transcription] ✅ Transcription complete for idea ${ideaId}: "${transcript.substring(0, 100)}..."`);
    
    // Generate embedding
    const embeddingResponse = await aimlClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: transcript,
    });
    const embedding = embeddingResponse.data[0].embedding;
    
    // Update idea with transcript and embedding
    const { error: updateError } = await supabase
      .from('ideas')
      .update({
        transcript: transcript,
        embedding: embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ideaId)
      .eq('user_id', userId);
    
    if (updateError) {
      throw new Error(`Failed to update idea: ${updateError.message}`);
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
    // Update idea with error status (optional - you could add a status field)
    // For now, just log the error
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
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite')
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
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite')
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
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite')
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
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite')
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
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite')
      .single();

    if (error) {
      console.error('Create idea error:', error);
      return res.status(500).json({ message: 'Failed to save idea' });
    }

    console.log(`[Upload Audio] ✅ Idea saved immediately with audio URL: ${ideaId}`);

    // STEP 3: Start async transcription (don't wait for it)
    console.log(`[Upload Audio] ⏳ Starting async transcription for idea: ${ideaId}`);
    transcribeAudioAsync(ideaId, req.file.buffer, req.file.mimetype, aimlApiKey, req.user.id)
      .catch(err => console.error(`[Upload Audio] ⚠️ Async transcription failed for ${ideaId}:`, err));

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
      try {
        console.log('[Upload Audio] Attempting transcription with AIMLAPI Nova-2 model (via AIMLAPI)');
        console.log(`[Upload Audio] File info: size=${req.file.size}, type=${req.file.mimetype}, name=${req.file.originalname}`);
        
        // Use AIMLAPI STT endpoint with multipart/form-data
        // AIMLAPI expects 'file' field and model format like '#g1_nova-2-general' or '#g1_whisper-large'
        const aimlFormData = new FormData();
        
        // Append file buffer - ensure proper options for form-data package
        aimlFormData.append('file', req.file.buffer, {
          filename: req.file.originalname || 'recording.m4a',
          contentType: req.file.mimetype || 'audio/m4a',
          knownLength: req.file.size, // Provide known length for proper form encoding
        });
        
        // Use nova-2-general model (nova-3 not available, use latest nova-2)
        aimlFormData.append('model', '#g1_nova-2-general');
        
        const aimlFormHeaders = aimlFormData.getHeaders();
        const aimlBaseUrl = 'https://api.aimlapi.com/v1';
        
        // Convert FormData stream to buffer for proper handling with fetch()
        // form-data package returns a stream, but fetch() in Node.js needs a buffer
        const formBuffer = await new Promise((resolve, reject) => {
          const chunks = [];
          aimlFormData.on('data', (chunk) => chunks.push(chunk));
          aimlFormData.on('end', () => resolve(Buffer.concat(chunks)));
          aimlFormData.on('error', reject);
        });
        
        // Get Content-Length from buffer
        aimlFormHeaders['Content-Length'] = formBuffer.length.toString();
        
        console.log(`[Upload Audio] Calling AIMLAPI: ${aimlBaseUrl}/stt/create with model: #g1_nova-2-general`);
        console.log(`[Upload Audio] FormData headers:`, aimlFormHeaders);
        console.log(`[Upload Audio] File buffer size: ${req.file.buffer.length} bytes, FormData size: ${formBuffer.length} bytes`);
        
        // Add timeout to prevent Vercel 300s timeout (use 240s to be safe)
        const TIMEOUT_MS = 240000; // 4 minutes
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        
        let aimlResponse;
        try {
          aimlResponse = await fetch(`${aimlBaseUrl}/stt/create`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${aimlApiKey}`,
              ...aimlFormHeaders,  // Includes Content-Type with boundary and Content-Length
            },
            body: formBuffer, // Use buffer instead of stream
            signal: controller.signal, // Add abort signal for timeout
          });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError' || fetchError.message.includes('aborted')) {
            console.error('[Upload Audio] AIMLAPI request timed out after 240 seconds');
            return res.status(500).json({ 
              message: 'Transcription request timed out. The audio file may be too long or the service is slow. Please try a shorter recording or try again later.',
            });
          }
          throw fetchError; // Re-throw other errors
        }
        
        if (aimlResponse.ok) {
          const aimlData = await aimlResponse.json();
          console.log('[Upload Audio] AIMLAPI Nova-2 transcription response:', aimlData);
          
          // AIMLAPI STT returns transcription in various possible fields
          transcript = aimlData.transcription || aimlData.text || aimlData.transcript || aimlData.result?.transcription || aimlData.data?.transcription;
          transcriptionSource = 'AIMLAPI Deepgram Nova-2';
          
          if (transcript) {
            console.log(`[Upload Audio] ✅ Success with AIMLAPI Deepgram Nova-2: "${transcript.substring(0, 100)}..."`);
          } else {
            console.error('[Upload Audio] No transcript in response:', JSON.stringify(aimlData, null, 2));
            throw new Error('No transcript returned from AIMLAPI');
          }
        } else {
          const errorText = await aimlResponse.text();
          let errorJson = null;
          try {
            errorJson = JSON.parse(errorText);
          } catch (e) {
            // Not JSON, use as text
          }
          
          console.error('[Upload Audio] AIMLAPI transcription failed:', {
            status: aimlResponse.status,
            statusText: aimlResponse.statusText,
            error: errorText,
            errorJson: errorJson,
            url: `${aimlBaseUrl}/stt/create`,
            model: '#g1_nova-2-general',
          });
          
          // If AIMLAPI fails with 401, it's an auth issue - don't try OpenAI fallback
          if (aimlResponse.status === 401) {
            const errorMsg = errorJson?.message || errorJson?.error?.message || errorText || 'Unauthorized';
            return res.status(500).json({ 
              message: `AIMLAPI authentication failed (401). Please check AIML_API_KEY is set correctly in backend/.env. Error: ${errorMsg}`,
            });
          }
          
          // If 400 Bad Request, provide detailed error and don't fallback
          if (aimlResponse.status === 400) {
            const errorMsg = errorJson?.message || errorJson?.error?.message || errorText || 'Bad Request';
            console.error('[Upload Audio] AIMLAPI 400 Bad Request - FormData parsing issue');
            console.error('[Upload Audio] Error details:', {
              status: aimlResponse.status,
              error: errorText,
              url: `${aimlBaseUrl}/stt/create`,
              errorJson: errorJson,
            });
            return res.status(500).json({ 
              message: `AIMLAPI Bad Request (400). Error: ${errorMsg}. Please check: 1) AIML_API_KEY is valid, 2) Audio file format is supported (MP3, WAV, M4A), 3) File size is within limits, 4) Model format is correct.`,
            });
          }
          
          // If 404, endpoint might not exist
          if (aimlResponse.status === 404) {
            const errorMsg = errorJson?.message || errorJson?.error?.message || errorText || 'Not Found';
            return res.status(500).json({ 
              message: `AIMLAPI STT endpoint not found (404): ${errorMsg}. Please check: 1) AIML_API_KEY is valid, 2) Endpoint /v1/stt/create is correct.`,
            });
          }
          
          // For other errors, fail immediately - no fallback
          console.error('[Upload Audio] AIMLAPI failed with status', aimlResponse.status);
        }
      } catch (aimlError) {
        console.error('[Upload Audio] AIMLAPI Nova-2 transcription error:', aimlError);
        console.error('[Upload Audio] Error details:', {
          message: aimlError.message,
          stack: aimlError.stack,
        });
        
        // Fail immediately - no fallback
        return res.status(500).json({ 
          message: `AIMLAPI Nova-2 transcription failed: ${aimlError.message || 'Unknown error'}`,
        });
      }
    }

    // NO OpenAI fallback - only use AIMLAPI Nova-2

    if (!transcript) {
      console.error('[Upload Audio] No transcript received from any service');
      let errorMessage = 'Transcription failed: AIMLAPI Nova-2 transcription failed.';
      
      // Provide helpful guidance
      if (!aimlApiKey) {
        errorMessage = 'Transcription failed: AIML_API_KEY not configured. Please set AIML_API_KEY in Vercel environment variables.';
      } else {
        errorMessage = 'Transcription failed: AIMLAPI Nova-2 transcription failed. Please check: 1) AIML_API_KEY is valid in Vercel environment variables, 2) Audio file format is supported (MP3, WAV, M4A), 3) File size is within limits.';
      }
      
      return res.status(500).json({ 
        message: errorMessage,
      });
    }
    
    // STEP 1: Upload audio file to Supabase Storage first
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
      // Continue anyway - we'll save without audio_url
    }

    // Get public URL for the uploaded file
    let audioUrl = null;
    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(audioFileName);
      audioUrl = urlData?.publicUrl || null;
      console.log(`[Upload Audio] ✅ Audio uploaded successfully: ${audioUrl}`);
    }

    // STEP 2: Save idea immediately with audio_url (transcript will be added later)
    const now = new Date().toISOString();
    
    // Save idea with empty transcript initially - will be updated when transcription completes
    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({
        id: ideaId,
        user_id: req.user.id,
        transcript: transcript || '', // Empty if transcription not done yet
        audio_url: audioUrl,
        duration: req.body.duration || null,
        created_at: now,
        updated_at: now,
      })
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite')
      .single();

    if (error) {
      console.error('Create idea error:', error);
      return res.status(500).json({ message: 'Failed to save idea' });
    }

    console.log(`[Upload Audio] ✅ Idea saved immediately with audio URL: ${ideaId}`);

    // STEP 3: If transcription completed, generate embedding and update idea
    let embedding = null;
    if (transcript && transcript.trim()) {
      console.log(`[Upload Audio] ✅ Final transcript (${transcriptionSource}): "${transcript.substring(0, 100)}..."`);
      
      try {
        // Generate embedding
        const embeddingResponse = await aimlClient.embeddings.create({
          model: 'text-embedding-3-small',
          input: transcript,
        });
        embedding = embeddingResponse.data[0].embedding;

        // Update idea with transcript and embedding
        const { error: updateError } = await supabase
          .from('ideas')
          .update({
            transcript: transcript,
            embedding: embedding,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ideaId);

        if (updateError) {
          console.error('[Upload Audio] ⚠️ Failed to update idea with transcript:', updateError);
        } else {
          console.log(`[Upload Audio] ✅ Idea updated with transcript and embedding: ${ideaId}`);
        }
      } catch (embedError) {
        console.error('[Upload Audio] ⚠️ Error generating embedding:', embedError);
        // Continue - idea is saved with audio_url
      }
    } else {
      // No transcript yet - start async transcription
      console.log(`[Upload Audio] ⏳ Starting async transcription for idea: ${ideaId}`);
      transcribeAudioAsync(ideaId, req.file.buffer, req.file.mimetype, aimlApiKey, req.user.id)
        .catch(err => console.error(`[Upload Audio] ⚠️ Async transcription failed for ${ideaId}:`, err));
    }

    // Check for similar clusters synchronously (same as text input)
    // Wrap in try-catch to prevent crashes if clustering fails
    let existingClusterId = null;
    let suggestedClusterLabel = null;
    
    try {
      const { findBestCluster, generateClusterLabel } = require('../lib/clustering');
      existingClusterId = await findBestCluster(req.user.id, embedding);

      if (existingClusterId) {
        // Similar cluster found - auto-assign immediately
        console.log(`[Upload Audio] ✅ Found similar cluster: ${existingClusterId}`);
        const { error: updateError } = await supabase
          .from('ideas')
          .update({ cluster_id: existingClusterId })
          .eq('id', ideaId);
        
        if (!updateError) {
          console.log(`[Upload Audio] ✅ Auto-assigned idea ${ideaId} to cluster ${existingClusterId}`);
        } else {
          console.error(`[Upload Audio] ⚠️ Error updating cluster:`, updateError);
        }
      } else {
        // No similar cluster found - generate suggested label
        console.log(`[Upload Audio] ⚠️  No similar cluster found, generating suggestion...`);
        try {
          suggestedClusterLabel = await generateClusterLabel(transcript);
          console.log(`[Upload Audio] 💡 Suggested category: "${suggestedClusterLabel}"`);
        } catch (labelError) {
          console.error(`[Upload Audio] ⚠️ Error generating cluster label:`, labelError);
          // Continue without suggested label - idea is still saved
        }
      }
    } catch (clusteringError) {
      console.error(`[Upload Audio] ⚠️ Clustering error (non-fatal):`, clusteringError);
      // Continue without clustering - idea is still saved successfully
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
    });
  } catch (error) {
    console.error('Upload audio error:', error);
    console.error('Upload audio error stack:', error.stack);
    // Return more detailed error message
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
      .select('id, user_id, transcript, audio_url, duration, created_at, updated_at, cluster_id, is_favorite')
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

