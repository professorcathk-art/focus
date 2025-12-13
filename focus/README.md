# Focus - ADHD-Friendly Idea Capture App

An iOS app for capturing, organizing, and finding ideas using voice recording, text input, and AI-powered categorization.

## Features

- 🎤 **Voice Recording** - Record ideas with automatic transcription
- 📝 **Text Input** - Type ideas directly
- 🤖 **AI Categorization** - Automatic category suggestions using embeddings
- 🔍 **Semantic Search** - Find ideas by meaning, not keywords
- 💬 **AI Chat Fallback** - Get AI answers when search doesn't find results
- ✅ **To-Do List** - Daily task management
- 📁 **Categories** - Organize ideas into custom categories

## Tech Stack

### Frontend
- React Native with Expo
- TypeScript
- NativeWind (Tailwind CSS)
- Expo Router
- Zustand (state management)
- Supabase Auth

### Backend
- Node.js/Express
- Supabase (PostgreSQL + Auth)
- AIMLAPI (OpenAI-compatible API)
- OpenAI Whisper (transcription)
- Vector embeddings for semantic search

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for mobile testing)
- Supabase account
- AIMLAPI account
- OpenAI API key (for Whisper)

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/focus.git
   cd focus
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Set up environment variables**

   Frontend: Create `.env` file:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3001/api
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Backend: Create `backend/.env` file (see `backend/.env.example`)

5. **Set up Supabase database**
   - Run `backend/supabase-schema.sql`
   - Run `backend/supabase-auth-setup.sql`
   - Run `backend/todos-schema.sql`

6. **Start development servers**

   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend:
   ```bash
   npm start
   ```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
focus/
├── app/                    # Expo Router pages
│   ├── (auth)/           # Authentication screens
│   ├── (tabs)/           # Main app tabs
│   └── idea/             # Idea detail pages
├── backend/              # Express API server
│   ├── routes/           # API routes
│   ├── lib/              # Utilities (Supabase, AIMLAPI)
│   └── middleware/       # Auth middleware
├── src/                  # Shared code
│   ├── config/          # API configuration
│   ├── hooks/           # React hooks
│   ├── lib/             # API client, Supabase client
│   ├── store/           # Zustand stores
│   └── types/           # TypeScript types
└── scripts/             # Build scripts
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/signup` - Sign up
- `POST /api/auth/signin` - Sign in
- `GET /api/ideas` - List ideas
- `POST /api/ideas` - Create idea
- `POST /api/ideas/upload-audio` - Upload and transcribe audio
- `GET /api/clusters` - List categories
- `POST /api/search/semantic` - Semantic search (with AI fallback)
- `GET /api/todos/today` - Get today's todos
- `POST /api/todos` - Create todo

## License

MIT
