/**
 * Search routes
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const aimlClient = require('../lib/aiml-client');
const { requireAuth } = require('../middleware/auth');
const { generateChatAnswer } = require('../lib/chat-helper');

/**
 * Semantic search
 */
router.post('/semantic', requireAuth, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Generate embedding for search query
    const embeddingResponse = await aimlClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.trim(),
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Get all user's ideas with embeddings
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', req.user.id)
      .not('embedding', 'is', null);

    if (error) {
      console.error('Error fetching ideas:', error);
      
      // Check if error message is HTML (Cloudflare error page)
      const errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error);
      if (errorMessage.includes('<!DOCTYPE html>') || errorMessage.includes('Cloudflare') || errorMessage.includes('500')) {
        console.error('[Search] ⚠️ Cloudflare/Supabase 500 error detected');
        return res.status(503).json({ 
          message: 'Database temporarily unavailable. Please try again in a few moments.',
          retryable: true
        });
      }
      
      return res.status(500).json({ message: 'Failed to search ideas' });
    }

    // Calculate cosine similarity
    const results = ideas
      .map(idea => {
        if (!idea.embedding || idea.embedding.length === 0) {
          return null;
        }

        // Handle embedding format (could be array or string)
        let ideaEmbedding = idea.embedding;
        if (typeof ideaEmbedding === 'string') {
          try {
            ideaEmbedding = JSON.parse(ideaEmbedding);
          } catch (e) {
            console.error('Error parsing embedding:', e);
            return null;
          }
        }

        // Cosine similarity
        const dotProduct = queryEmbedding.reduce(
          (sum, val, i) => sum + val * ideaEmbedding[i],
          0
        );
        const magnitudeA = Math.sqrt(
          queryEmbedding.reduce((sum, val) => sum + val * val, 0)
        );
        const magnitudeB = Math.sqrt(
          ideaEmbedding.reduce((sum, val) => sum + val * val, 0)
        );
        const similarity = magnitudeA * magnitudeB === 0 ? 0 : dotProduct / (magnitudeA * magnitudeB);

        return {
          idea: {
            id: idea.id,
            userId: idea.user_id,
            transcript: idea.transcript,
            audioUrl: idea.audio_url,
            duration: idea.duration,
            createdAt: idea.created_at,
            updatedAt: idea.updated_at,
            clusterId: idea.cluster_id,
          },
          similarity,
        };
      })
      .filter(result => result !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Top 10 results

    // Add related ideas (2-3 most similar ideas to each result)
    // Find the original idea with embedding for similarity calculation
    const resultsWithRelated = results.map((result) => {
      const resultIdea = ideas.find(i => i.id === result.idea.id);
      if (!resultIdea || !resultIdea.embedding) {
        return { ...result, relatedIdeas: [] };
      }

      // Handle embedding format
      let resultEmbedding = resultIdea.embedding;
      if (typeof resultEmbedding === 'string') {
        try {
          resultEmbedding = JSON.parse(resultEmbedding);
        } catch (e) {
          return { ...result, relatedIdeas: [] };
        }
      }

      const relatedIdeas = ideas
        .filter(idea => idea.id !== result.idea.id && idea.embedding)
        .map(idea => {
          let ideaEmbedding = idea.embedding;
          if (typeof ideaEmbedding === 'string') {
            try {
              ideaEmbedding = JSON.parse(ideaEmbedding);
            } catch (e) {
              return null;
            }
          }

          const dotProduct = resultEmbedding.reduce(
            (sum, val, i) => sum + val * ideaEmbedding[i],
            0
          );
          const magnitudeA = Math.sqrt(
            resultEmbedding.reduce((sum, val) => sum + val * val, 0)
          );
          const magnitudeB = Math.sqrt(
            ideaEmbedding.reduce((sum, val) => sum + val * val, 0)
          );
          const similarity = magnitudeA * magnitudeB === 0 ? 0 : dotProduct / (magnitudeA * magnitudeB);

          return {
            idea: {
              id: idea.id,
              userId: idea.user_id,
              transcript: idea.transcript,
              audioUrl: idea.audio_url,
              duration: idea.duration,
              createdAt: idea.created_at,
              updatedAt: idea.updated_at,
              clusterId: idea.cluster_id,
            },
            similarity,
          };
        })
        .filter(r => r !== null)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map(r => r.idea);

      return {
        ...result,
        relatedIdeas,
      };
    });

    // Check if results are poor (low similarity or no results)
    const hasGoodResults = resultsWithRelated.length > 0 && 
      resultsWithRelated.some(r => r.similarity >= 0.4);
    
    // If results are poor, use chat as fallback
    if (!hasGoodResults && resultsWithRelated.length === 0) {
      console.log('[Search] No results found, using chat fallback');
      try {
        const chatResult = await generateChatAnswer(query, req.user.id);
        return res.json({
          fallback: true,
          aiAnswer: chatResult.answer,
          relevantNotesCount: chatResult.relevantNotesCount,
          results: [],
        });
      } catch (chatError) {
        console.error('[Search] Chat fallback error:', chatError);
        // Continue with empty results
      }
    } else if (hasGoodResults && resultsWithRelated.length > 0 && resultsWithRelated[0].similarity < 0.5) {
      // Low similarity results - include AI answer as additional help
      console.log('[Search] Low similarity results, adding AI answer');
      try {
        const topIdeas = resultsWithRelated.slice(0, 5).map(r => r.idea);
        const chatResult = await generateChatAnswer(query, req.user.id, topIdeas);
        return res.json({
          fallback: false,
          aiAnswer: chatResult.answer,
          results: resultsWithRelated,
        });
      } catch (chatError) {
        console.error('[Search] Chat fallback error:', chatError);
        // Continue with regular results
      }
    }

    res.json(resultsWithRelated);
  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Recent searches (placeholder)
 */
router.get('/recent', requireAuth, async (req, res) => {
  // TODO: Implement recent searches tracking
  res.json([]);
});

module.exports = router;

