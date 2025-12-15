/**
 * API configuration and base URL
 * TODO: Replace with your Vercel backend URL
 */

// Supabase configuration
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://wqvevludffkemgicrfos.supabase.co";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1";

// Update this to your backend URL
// For local development: 
//   - Web/Simulator: http://localhost:3001/api
//   - Physical device: Use environment variable EXPO_PUBLIC_API_URL
//     Example: EXPO_PUBLIC_API_URL=http://192.168.0.223:3001/api
// For production: your deployed backend URL

// Default to localhost (works for web/simulator)
// For physical devices, set EXPO_PUBLIC_API_URL in .env file
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

export const API_ENDPOINTS = {
  // Auth
  auth: {
    signUp: "/auth/signup",
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    me: "/auth/me",
  },
  // Ideas
  ideas: {
    list: "/ideas",
    create: "/ideas",
    get: (id: string) => `/ideas/${id}`,
    update: (id: string) => `/ideas/${id}`,
    delete: (id: string) => `/ideas/${id}`,
    uploadAudio: "/ideas/upload-audio",
    toggleFavorite: (id: string) => `/ideas/${id}/favorite`,
  },
  // Clusters
  clusters: {
    list: "/clusters",
    create: "/clusters",
    get: (id: string) => `/clusters/${id}`,
    ideas: (id: string) => `/clusters/${id}/ideas`,
    update: (id: string) => `/clusters/${id}`,
    assign: (id: string) => `/clusters/${id}/assign`,
    delete: (id: string) => `/clusters/${id}`,
  },
  // Search
  search: {
    semantic: "/search/semantic",
    recent: "/search/recent",
  },
  // Chat
  chat: {
    query: "/chat",
  },
  // Todos
  todos: {
    today: (date?: string) => date ? `/todos/today?date=${date}` : "/todos/today",
    create: "/todos",
    update: (id: string) => `/todos/${id}`,
    delete: (id: string) => `/todos/${id}`,
    resetToday: "/todos/reset-today",
    moveIncompleteToNextDay: "/todos/move-incomplete",
  },
  // User
  user: {
    stats: "/user/stats",
    export: "/user/export",
    delete: "/user/delete",
  },
  // Feedback
  feedback: {
    send: "/feedback",
  },
} as const;

