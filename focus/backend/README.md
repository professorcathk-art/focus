# Focus Backend API

Backend API server for the Focus app using Supabase and AIMLAPI.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` (already done with your credentials)
   - Verify all variables are set correctly

3. **Set up Supabase database:**
   - Go to your Supabase project SQL Editor
   - Run the SQL from `supabase-schema.sql` to create tables

4. **Start the server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/me` - Get current user
- `POST /api/auth/signout` - Sign out

### Ideas
- `GET /api/ideas` - List user's ideas
- `GET /api/ideas/:id` - Get single idea
- `POST /api/ideas` - Create idea from text
- `POST /api/ideas/upload-audio` - Upload audio and transcribe
- `PUT /api/ideas/:id` - Update idea
- `DELETE /api/ideas/:id` - Delete idea

### Clusters
- `GET /api/clusters` - List user's clusters
- `GET /api/clusters/:id` - Get single cluster
- `GET /api/clusters/:id/ideas` - Get ideas in cluster
- `PUT /api/clusters/:id` - Update cluster label

### Search
- `POST /api/search/semantic` - Semantic search
- `GET /api/search/recent` - Recent searches

### User
- `GET /api/user/stats` - Get user statistics
- `GET /api/user/export` - Export user data
- `DELETE /api/user/delete` - Delete account

## AIMLAPI Integration

The backend uses AIMLAPI as a drop-in replacement for OpenAI:
- **Whisper-1**: Speech-to-text transcription
- **text-embedding-3-small**: Text embeddings for semantic search
- **gpt-4o-mini**: Cluster labeling (future)

All AIMLAPI calls use the same OpenAI SDK syntax.

## Database

Uses Supabase PostgreSQL with:
- Row Level Security (RLS) enabled
- Vector extension for embeddings
- Proper indexes for performance

