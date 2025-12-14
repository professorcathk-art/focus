/**
 * AIMLAPI Client - Drop-in replacement for OpenAI
 * Uses the same OpenAI SDK syntax but points to AIMLAPI
 * Used for embeddings and chat completions (not transcription)
 * 
 * Note: Transcription uses direct fetch() calls to /v1/stt/create
 * with two-step polling (see backend/routes/ideas.js)
 */

const OpenAI = require('openai');

// Create AIMLAPI client with correct base URL for Deepgram Nova-3
const aimlClient = new OpenAI({
  apiKey: process.env.AIML_API_KEY,
  baseURL: 'https://api.aimlapi.com/v1',  // Fixed base URL
});

module.exports = aimlClient;

