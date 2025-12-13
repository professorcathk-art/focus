/**
 * Chat routes - RAG (Retrieval Augmented Generation)
 * Uses semantic search to find relevant notes, then AI to answer questions
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const aimlClient = require('../lib/aiml-client');
const { requireAuth } = require('../middleware/auth');

/**
 * Chat with AI about user's notes
 * POST /api/chat
 * Body: { question: string }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    console.log(`[Chat] User ${req.user.id} asked: "${question}"`);

    // Step 1: Detect date-based queries and extract date filters
    const questionLower = question.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    let dateFilter = null;
    if (questionLower.includes('today')) {
      dateFilter = { gte: today.toISOString(), lt: tomorrow.toISOString() };
    } else if (questionLower.includes('yesterday')) {
      dateFilter = { gte: yesterday.toISOString(), lt: today.toISOString() };
    } else if (questionLower.includes('last week') || questionLower.includes('past week')) {
      dateFilter = { gte: lastWeek.toISOString() };
    } else if (questionLower.includes('this week')) {
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - (today.getDay() || 7) + 1); // Monday of this week
      dateFilter = { gte: thisWeek.toISOString() };
    }

    // Step 2: Fetch ideas with optional date filter
    let query = supabase
      .from('ideas')
      .select('*')
      .eq('user_id', req.user.id)
      .not('embedding', 'is', null)
      .order('created_at', { ascending: false });

    if (dateFilter) {
      if (dateFilter.gte && dateFilter.lt) {
        query = query.gte('created_at', dateFilter.gte).lt('created_at', dateFilter.lt);
      } else if (dateFilter.gte) {
        query = query.gte('created_at', dateFilter.gte);
      }
      console.log(`[Chat] Applying date filter: ${JSON.stringify(dateFilter)}`);
    }

    const { data: allIdeas, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Chat] Fetch error:', fetchError);
    }

    console.log(`[Chat] Found ${allIdeas?.length || 0} ideas${dateFilter ? ' matching date filter' : ''}`);

    // Step 3: If we have date-filtered results, use those directly (or combine with semantic search)
    let ideas = [];
    
    if (dateFilter && allIdeas && allIdeas.length > 0) {
      // For date queries, prioritize date-filtered results but still rank by relevance
      // Generate embedding for semantic ranking
      const embeddingResponse = await aimlClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: question.trim(),
      });
      const questionEmbedding = embeddingResponse.data[0].embedding;

      // Rank date-filtered results by semantic similarity
      const results = allIdeas
        .map(idea => {
          if (!idea.embedding || idea.embedding.length === 0) {
            return { idea, similarity: 0.5 }; // Give default similarity for date matches
          }

          let ideaEmbedding = idea.embedding;
          if (typeof ideaEmbedding === 'string') {
            try {
              ideaEmbedding = JSON.parse(ideaEmbedding);
            } catch (e) {
              return { idea, similarity: 0.5 };
            }
          }

          const dotProduct = questionEmbedding.reduce(
            (sum, val, i) => sum + val * ideaEmbedding[i],
            0
          );
          const magnitudeA = Math.sqrt(
            questionEmbedding.reduce((sum, val) => sum + val * val, 0)
          );
          const magnitudeB = Math.sqrt(
            ideaEmbedding.reduce((sum, val) => sum + val * val, 0)
          );
          const similarity = magnitudeA * magnitudeB === 0 ? 0.5 : dotProduct / (magnitudeA * magnitudeB);

          return { idea, similarity };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10); // Get top 10 for date queries

      ideas = results.map(r => r.idea);
    } else if (!dateFilter && allIdeas && allIdeas.length > 0) {
      // For non-date queries, use semantic search with similarity threshold
      const embeddingResponse = await aimlClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: question.trim(),
      });
      const questionEmbedding = embeddingResponse.data[0].embedding;

      const results = allIdeas
        .map(idea => {
          if (!idea.embedding || idea.embedding.length === 0) {
            return null;
          }

          let ideaEmbedding = idea.embedding;
          if (typeof ideaEmbedding === 'string') {
            try {
              ideaEmbedding = JSON.parse(ideaEmbedding);
            } catch (e) {
              return null;
            }
          }

          const dotProduct = questionEmbedding.reduce(
            (sum, val, i) => sum + val * ideaEmbedding[i],
            0
          );
          const magnitudeA = Math.sqrt(
            questionEmbedding.reduce((sum, val) => sum + val * val, 0)
          );
          const magnitudeB = Math.sqrt(
            ideaEmbedding.reduce((sum, val) => sum + val * val, 0)
          );
          const similarity = magnitudeA * magnitudeB === 0 ? 0 : dotProduct / (magnitudeA * magnitudeB);

          return { idea, similarity };
        })
        .filter(result => result !== null && result.similarity >= 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      ideas = results.map(r => r.idea);
    }

    console.log(`[Chat] Found ${ideas?.length || 0} relevant ideas`);

    // Step 3: Build context from relevant ideas
    let context = '';
    if (ideas && ideas.length > 0) {
      context = ideas
        .map((idea, index) => {
          const date = new Date(idea.created_at).toLocaleDateString();
          return `${index + 1}. [${date}] ${idea.transcript}`;
        })
        .join('\n\n');
    } else {
      context = 'No relevant notes found.';
    }

    // Step 4: Generate AI response using RAG
    const systemPrompt = `You are a helpful assistant that answers questions about the user's notes and ideas. 
Use the provided context from their notes to answer questions accurately. 
If the question asks about something not in the context, say so politely.
Be concise and helpful. Format dates naturally (e.g., "yesterday", "3 days ago").`;

    const userPrompt = `Context from user's notes:\n${context}\n\nUser's question: ${question.trim()}\n\nAnswer:`;

    const chatResponse = await aimlClient.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const answer = chatResponse.choices[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(500).json({ message: 'Failed to generate answer' });
    }

    console.log(`[Chat] Generated answer: "${answer.substring(0, 100)}..."`);

    res.json({
      answer,
      relevantNotesCount: ideas?.length || 0,
    });
  } catch (error) {
    console.error('[Chat] Error:', error);
    res.status(500).json({ message: 'Failed to process chat request' });
  }
});

module.exports = router;

