/**
 * Core data types for Focus app
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  userId: string;
  transcript: string;
  audioUrl?: string;
  duration?: number; // in seconds
  createdAt: string;
  updatedAt: string;
  clusterId?: string;
  embedding?: number[]; // Vector embedding for semantic search
  suggestedClusterLabel?: string; // AI-suggested category label
}

export interface Cluster {
  id: string;
  userId: string;
  label: string; // e.g., "App Ideas", "Business Ideas"
  ideaIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  idea: Idea;
  similarity: number; // 0.0 to 1.0
  relatedIdeas?: Idea[]; // 2-3 related ideas
}

export interface SearchResponse {
  fallback?: boolean;
  aiAnswer?: string;
  relevantNotesCount?: number;
  results: SearchResult[];
}

export interface Todo {
  id: string;
  userId: string;
  text: string;
  completed: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalIdeas: number;
  ideasThisMonth: number;
  averagePerDay: number;
  topCategory?: {
    label: string;
    count: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

