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

    // AIMLAPI doesn't support Whisper - use OpenAI directly for transcription
    // But keep using AIMLAPI for embeddings and chat
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.AIML_API_KEY;

    if (!openaiApiKey) {
      console.error('[Upload Audio] No API key found. Set OPENAI_API_KEY or AIML_API_KEY');
      return res.status(500).json({ 
        message: 'Transcription service not configured. Please set OPENAI_API_KEY in backend/.env' 
      });
    }

    console.log(`[Upload Audio] Using OpenAI for Whisper transcription (AIMLAPI doesn't support it)`);
    console.log(`[Upload Audio] File size: ${req.file.size} bytes, type: ${req.file.mimetype}`);

    // Use OpenAI directly for Whisper transcription
    let transcript;
    try {
      // Create FormData for OpenAI
      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname || 'audio.m4a',
        contentType: req.file.mimetype || 'audio/m4a',
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const formHeaders = formData.getHeaders ? formData.getHeaders() : {};
      const openaiBaseUrl = 'https://api.openai.com/v1';
      
      console.log(`[Upload Audio] Calling OpenAI: ${openaiBaseUrl}/audio/transcriptions`);

      // Use OpenAI directly for Whisper transcription
      const transcriptionResponse = await fetch(`${openaiBaseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          ...formHeaders,
        },
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error('[Upload Audio] OpenAI transcription error:', {
          status: transcriptionResponse.status,
          statusText: transcriptionResponse.statusText,
          error: errorText,
        });
        return res.status(500).json({ 
          message: `Failed to transcribe audio: ${transcriptionResponse.statusText}. Make sure OPENAI_API_KEY is set correctly.`,
        });
      }

      const transcriptionData = await transcriptionResponse.json();
      console.log('[Upload Audio] Transcription response:', transcriptionData);
      
      transcript = transcriptionData.text || transcriptionData.transcript;
      
      if (!transcript) {
        console.error('[Upload Audio] No transcript in response:', transcriptionData);
        return res.status(500).json({ message: 'Transcription returned empty result' });
      }
      
      console.log(`[Upload Audio] Transcript received: "${transcript.substring(0, 100)}..."`);
    } catch (transcriptionError) {
      console.error('[Upload Audio] Transcription error:', transcriptionError);
      console.error('[Upload Audio] Error details:', {
        message: transcriptionError.message,
        stack: transcriptionError.stack,
      });
      return res.status(500).json({ 
        message: `Failed to transcribe audio: ${transcriptionError.message || 'Unknown error'}`,
      });
    }

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
      suggestedClusterLabel: suggestedClusterLabel, // Include suggested label if no match found
    });
  } catch (error) {
    console.error('Upload audio error:', error);
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
    
    if (transcript) {
      updateData.transcript = transcript.trim();
      
      // Regenerate embedding
      const embeddingResponse = await aimlClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: transcript.trim(),
      });
      updateData.embedding = embeddingResponse.data[0].embedding;
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

