/**
 * Chat helper - RAG function that can be reused
 * Used by search as fallback when results are poor
 */

const supabase = require('./supabase');
const aimlClient = require('./aiml-client');

/**
 * Generate AI answer using RAG (Retrieval Augmented Generation)
 * @param {string} question - User's question
 * @param {string} userId - User ID
 * @param {Array} ideas - Array of ideas to use as context (optional, will search if not provided)
 * @returns {Promise<{answer: string, relevantNotesCount: number}>}
 */
async function generateChatAnswer(question, userId, ideas = null) {
  try {
    // If ideas not provided, search for relevant ones
    if (!ideas || ideas.length === 0) {
      // Detect date-based queries
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
        thisWeek.setDate(thisWeek.getDate() - (today.getDay() || 7) + 1);
        dateFilter = { gte: thisWeek.toISOString() };
      }

      // Fetch ideas
      let query = supabase
        .from('ideas')
        .select('*')
        .eq('user_id', userId)
        .not('embedding', 'is', null)
        .order('created_at', { ascending: false });

      if (dateFilter) {
        if (dateFilter.gte && dateFilter.lt) {
          query = query.gte('created_at', dateFilter.gte).lt('created_at', dateFilter.lt);
        } else if (dateFilter.gte) {
          query = query.gte('created_at', dateFilter.gte);
        }
      }

      const { data: allIdeas } = await query;

      // Generate embedding for semantic ranking
      const embeddingResponse = await aimlClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: question.trim(),
      });
      const questionEmbedding = embeddingResponse.data[0].embedding;

      // Rank by similarity
      if (allIdeas && allIdeas.length > 0) {
        const results = allIdeas
          .map(idea => {
            if (!idea.embedding || idea.embedding.length === 0) {
              return { idea, similarity: dateFilter ? 0.5 : 0 };
            }

            let ideaEmbedding = idea.embedding;
            if (typeof ideaEmbedding === 'string') {
              try {
                ideaEmbedding = JSON.parse(ideaEmbedding);
              } catch (e) {
                return { idea, similarity: dateFilter ? 0.5 : 0 };
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
            const similarity = magnitudeA * magnitudeB === 0 ? (dateFilter ? 0.5 : 0) : dotProduct / (magnitudeA * magnitudeB);

            return { idea, similarity };
          })
          .filter(result => dateFilter || result.similarity >= 0.3)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, dateFilter ? 10 : 5);

        ideas = results.map(r => r.idea);
      } else {
        ideas = [];
      }
    }

    // Build context
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

    // Generate AI response
    const systemPrompt = `You are a helpful assistant that answers questions about the user's notes and ideas. 
Use the provided context from their notes to answer questions accurately. 
If the question asks about something not in the context, say so politely.
Be concise and helpful. Format dates naturally (e.g., "yesterday", "3 days ago").`;

    const userPrompt = `Context from user's notes:\n${context}\n\nUser's question: ${question.trim()}\n\nAnswer:`;

    const chatResponse = await aimlClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const answer = chatResponse.choices[0]?.message?.content?.trim();

    return {
      answer: answer || "I couldn't find relevant information in your notes.",
      relevantNotesCount: ideas?.length || 0,
    };
  } catch (error) {
    console.error('[Chat Helper] Error:', error);
    return {
      answer: "I'm having trouble processing your question. Please try again.",
      relevantNotesCount: 0,
    };
  }
}

module.exports = { generateChatAnswer };

