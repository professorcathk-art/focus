/**
 * AIMLAPI Client - Drop-in replacement for OpenAI
 * Uses the same OpenAI SDK syntax but points to AIMLAPI
 */

const OpenAI = require('openai');

// Create AIMLAPI client (same syntax as OpenAI)
const aimlClient = new OpenAI({
  apiKey: process.env.AIML_API_KEY,
  baseURL: process.env.AIML_API_BASE_URL || 'https://api.aimlapi.com/v1',
});

module.exports = aimlClient;

