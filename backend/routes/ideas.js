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
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('*')
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
      embedding: idea.embedding,
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
    const { data: idea, error } = await supabase
      .from('ideas')
      .select('*')
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
      embedding: idea.embedding,
      isFavorite: idea.is_favorite || false,
    });
  } catch (error) {
    console.error('Get idea error:', error);
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
      .select('*')
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

    // Try AIMLAPI nova-3 model first, fallback to OpenAI Whisper
    const aimlApiKey = process.env.AIML_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!aimlApiKey && !openaiApiKey) {
      console.error('[Upload Audio] No API key found. Set AIML_API_KEY or OPENAI_API_KEY');
      return res.status(500).json({ 
        message: 'Transcription service not configured. Please set AIML_API_KEY or OPENAI_API_KEY in backend/.env' 
      });
    }

    console.log(`[Upload Audio] File size: ${req.file.size} bytes, type: ${req.file.mimetype}`);

    let transcript;
    let transcriptionSource = 'unknown';

    // Use AIMLAPI with Deepgram Nova-3 model
    if (aimlApiKey) {
      try {
        console.log('[Upload Audio] Attempting transcription with AIMLAPI Deepgram Nova-3 model');
        console.log(`[Upload Audio] File info: size=${req.file.size}, type=${req.file.mimetype}, name=${req.file.originalname}`);
        
        // Use FormData approach (more reliable than OpenAI SDK File object in Node.js)
        const aimlFormData = new FormData();
        aimlFormData.append('file', req.file.buffer, {
          filename: req.file.originalname || 'audio.m4a',
          contentType: req.file.mimetype || 'audio/m4a',
        });
        aimlFormData.append('model', 'nova-3');  // Deepgram Nova-3 model
        aimlFormData.append('language', 'en');
        
        const aimlFormHeaders = aimlFormData.getHeaders ? aimlFormData.getHeaders() : {};
        const aimlBaseUrl = 'https://api.aimlapi.com/v1';
        
        console.log(`[Upload Audio] Calling AIMLAPI: ${aimlBaseUrl}/audio/transcriptions with model: nova-3`);
        
        const aimlResponse = await fetch(`${aimlBaseUrl}/audio/transcriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${aimlApiKey}`,
            ...aimlFormHeaders,
          },
          body: aimlFormData,
        });
        
        if (aimlResponse.ok) {
          const aimlData = await aimlResponse.json();
          console.log('[Upload Audio] AIMLAPI transcription response:', aimlData);
          
          transcript = aimlData.text || aimlData.transcript;
          transcriptionSource = 'AIMLAPI Deepgram Nova-3';
          
          if (transcript) {
            console.log(`[Upload Audio] ✅ Success with AIMLAPI Deepgram Nova-3: "${transcript.substring(0, 100)}..."`);
          } else {
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
            url: `${aimlBaseUrl}/audio/transcriptions`,
            model: 'nova-3',
          });
          
          // If AIMLAPI fails with 401, it's an auth issue - don't try OpenAI fallback
          if (aimlResponse.status === 401) {
            const errorMsg = errorJson?.message || errorJson?.error?.message || errorText || 'Unauthorized';
            return res.status(500).json({ 
              message: `AIMLAPI authentication failed (401). Please check AIML_API_KEY is set correctly in backend/.env. Error: ${errorMsg}`,
            });
          }
          
          // If 400 Bad Request, provide detailed error
          if (aimlResponse.status === 400) {
            const errorMsg = errorJson?.message || errorJson?.error?.message || errorText || 'Bad Request';
            return res.status(500).json({ 
              message: `AIMLAPI Bad Request (400). This might be due to unsupported file format or model. Error: ${errorMsg}. Please check if AIMLAPI supports nova-3 model for audio transcription.`,
            });
          }
          
          // If 404, endpoint might not exist
          if (aimlResponse.status === 404) {
            return res.status(500).json({ 
              message: 'AIMLAPI audio transcription endpoint not found (404). Please check if AIMLAPI supports audio transcription with nova-3 model.',
            });
          }
          
          // For other errors, log but continue to fallback if OpenAI key available
          console.warn('[Upload Audio] AIMLAPI failed with status', aimlResponse.status, '- will try OpenAI fallback if available');
        }
      } catch (aimlError) {
        console.error('[Upload Audio] AIMLAPI Deepgram Nova-3 transcription error:', aimlError);
        console.error('[Upload Audio] Error details:', {
          message: aimlError.message,
          stack: aimlError.stack,
        });
        
        // Log error but continue to fallback if OpenAI key available
        console.warn('[Upload Audio] AIMLAPI failed, will try OpenAI fallback if available:', aimlError.message);
      }
    }

    // Fallback to OpenAI Whisper if AIMLAPI failed or not configured
    if (!transcript && openaiApiKey) {
      try {
        console.log('[Upload Audio] Using OpenAI Whisper as fallback');
        
        // Create FormData for OpenAI
        const openaiFormData = new FormData();
        openaiFormData.append('file', req.file.buffer, {
          filename: req.file.originalname || 'audio.m4a',
          contentType: req.file.mimetype || 'audio/m4a',
        });
        openaiFormData.append('model', 'whisper-1');
        openaiFormData.append('language', 'en');

        const openaiFormHeaders = openaiFormData.getHeaders ? openaiFormData.getHeaders() : {};
        const openaiBaseUrl = 'https://api.openai.com/v1';
        
        console.log(`[Upload Audio] Calling OpenAI: ${openaiBaseUrl}/audio/transcriptions`);

        const openaiResponse = await fetch(`${openaiBaseUrl}/audio/transcriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            ...openaiFormHeaders,
          },
          body: openaiFormData,
        });

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          console.error('[Upload Audio] OpenAI transcription error:', {
            status: openaiResponse.status,
            statusText: openaiResponse.statusText,
            error: errorText,
          });
          
          // Provide clearer error message for common issues
          let errorMessage = `Failed to transcribe audio: ${openaiResponse.statusText}`;
          if (openaiResponse.status === 401) {
            errorMessage = 'Failed to transcribe audio: AIMLAPI authentication failed. Please check AIML_API_KEY is set correctly in backend/.env. OpenAI fallback also failed - OPENAI_API_KEY not configured.';
          } else if (openaiResponse.status === 429) {
            errorMessage = 'Failed to transcribe audio: Rate limit exceeded. Please try again later.';
          }
          
          return res.status(500).json({ 
            message: errorMessage,
          });
        }

        const openaiData = await openaiResponse.json();
        console.log('[Upload Audio] OpenAI transcription response:', openaiData);
        
        transcript = openaiData.text || openaiData.transcript;
        transcriptionSource = 'OpenAI Whisper';
        
        if (transcript) {
          console.log(`[Upload Audio] ✅ Success with OpenAI Whisper: "${transcript.substring(0, 100)}..."`);
        }
      } catch (openaiError) {
        console.error('[Upload Audio] OpenAI transcription error:', openaiError);
        return res.status(500).json({ 
          message: `Failed to transcribe audio: ${openaiError.message || 'Unknown error'}`,
        });
      }
    }

    if (!transcript) {
      console.error('[Upload Audio] No transcript received from any service');
      let errorMessage = 'Transcription failed: No transcript received from AIMLAPI.';
      
      // Provide helpful guidance
      if (!aimlApiKey) {
        errorMessage = 'Transcription failed: AIML_API_KEY not configured. Please set AIML_API_KEY in backend/.env';
      } else {
        errorMessage = 'Transcription failed: AIMLAPI transcription failed. Please check AIML_API_KEY is valid and nova-3 model is available for audio transcription.';
      }
      
      return res.status(500).json({ 
        message: errorMessage,
      });
    }
    
    console.log(`[Upload Audio] ✅ Final transcript (${transcriptionSource}): "${transcript.substring(0, 100)}..."`);

    // Generate embedding
    const embeddingResponse = await aimlClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: transcript,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Upload audio to Supabase Storage (optional)
    // For now, we'll just store the transcript
    const ideaId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({
        id: ideaId,
        user_id: req.user.id,
        transcript,
        embedding,
        duration: req.body.duration || null,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Create idea error:', error);
      return res.status(500).json({ message: 'Failed to save idea' });
    }

    // Check for similar clusters synchronously (same as text input)
    const { findBestCluster, generateClusterLabel } = require('../lib/clustering');
    const existingClusterId = await findBestCluster(req.user.id, embedding);
    let suggestedClusterLabel = null;

    if (existingClusterId) {
      // Similar cluster found - auto-assign immediately
      console.log(`[Upload Audio] ✅ Found similar cluster: ${existingClusterId}`);
      const { error: updateError } = await supabase
        .from('ideas')
        .update({ cluster_id: existingClusterId })
        .eq('id', ideaId);
      
      if (!updateError) {
        console.log(`[Upload Audio] ✅ Auto-assigned idea ${ideaId} to cluster ${existingClusterId}`);
      }
    } else {
      // No similar cluster found - generate suggested label
      console.log(`[Upload Audio] ⚠️  No similar cluster found, generating suggestion...`);
      suggestedClusterLabel = await generateClusterLabel(transcript);
      console.log(`[Upload Audio] 💡 Suggested category: "${suggestedClusterLabel}"`);
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
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Toggle favorite status (must come before /:id route)
 * Route: PUT /api/ideas/:id/favorite
 * IMPORTANT: This route MUST be defined before router.put('/:id') to work correctly
 */
router.put('/:id/favorite', requireAuth, async (req, res) => {
  console.log(`[FAVORITE ROUTE] PUT /:id/favorite hit with id: ${req.params.id}`);
  try {
    console.log(`[Toggle Favorite] Request received for idea ${req.params.id}`);
    
    // Check ownership
    const { data: existingIdea, error: checkError } = await supabase
      .from('ideas')
      .select('is_favorite')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (checkError || !existingIdea) {
      console.error('[Toggle Favorite] Idea not found or error:', checkError);
      return res.status(404).json({ message: 'Idea not found' });
    }

    const newFavoriteStatus = !existingIdea.is_favorite;
    console.log(`[Toggle Favorite] Toggling favorite from ${existingIdea.is_favorite} to ${newFavoriteStatus}`);

    const { data: idea, error } = await supabase
      .from('ideas')
      .update({ 
        is_favorite: newFavoriteStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      console.error('[Toggle Favorite] Update error:', error);
      return res.status(500).json({ message: 'Failed to toggle favorite' });
    }

    console.log(`[Toggle Favorite] Successfully toggled favorite for idea ${req.params.id}`);
    res.json({
      id: idea.id,
      userId: idea.user_id,
      transcript: idea.transcript,
      audioUrl: idea.audio_url,
      duration: idea.duration,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at,
      clusterId: idea.cluster_id,
      embedding: idea.embedding,
      isFavorite: idea.is_favorite || false,
    });
  } catch (error) {
    console.error('[Toggle Favorite] Unexpected error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Update idea
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { transcript } = req.body;

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
      .select('*')
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
      embedding: idea.embedding,
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

