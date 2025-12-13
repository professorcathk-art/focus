/**
 * Custom hook for semantic search
 */

import { useState } from "react";
import { SearchResult, SearchResponse } from "@/types";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setAiAnswer(null);
      setIsFallback(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log("[Search] Searching for:", query);
      const data = await apiClient.post<SearchResponse | SearchResult[]>(
        API_ENDPOINTS.search.semantic,
        { query: query.trim() }
      );
      
      // Handle new response format with fallback
      if (Array.isArray(data)) {
        // Old format (backward compatibility)
        setResults(data);
        setAiAnswer(null);
        setIsFallback(false);
      } else {
        // New format with fallback
        const response = data as SearchResponse;
        setResults(response.results || []);
        setAiAnswer(response.aiAnswer || null);
        setIsFallback(response.fallback || false);
      }
      
      const response = data as SearchResponse;
      console.log("[Search] Results:", response.results?.length || 0, "Fallback:", response.fallback || false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      console.error("[Search] Error:", errorMessage, err);
      setError(errorMessage);
      setResults([]);
      setAiAnswer(null);
      setIsFallback(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    results,
    aiAnswer,
    isFallback,
    isLoading,
    error,
    search,
  };
}

