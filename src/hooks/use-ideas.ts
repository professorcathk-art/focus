/**
 * Custom hook for managing ideas
 * Uses local caching to reduce API calls
 */

import { useState, useEffect } from "react";
import { Idea } from "@/types";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import { getCachedIdeas, setCachedIdeas, updateCachedIdea, removeCachedIdea } from "@/lib/ideas-cache";

export function useIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async (useCache = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try cache first for instant UI update
      if (useCache) {
        const cached = await getCachedIdeas();
        if (cached && cached.length > 0) {
          setIdeas(cached);
          setIsLoading(false);
          // Continue fetching in background to update cache
        }
      }

      // Fetch from API
      const data = await apiClient.get<Idea[]>(API_ENDPOINTS.ideas.list);
      
      // Update cache and state
      await setCachedIdeas(data);
      setIdeas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ideas");
      // If API fails but we have cache, keep using cache
      if (ideas.length > 0) {
        console.log("[useIdeas] API failed but using cached data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createIdea = async (transcript: string) => {
    try {
      const newIdea = await apiClient.post<Idea>(API_ENDPOINTS.ideas.create, {
        transcript,
      });
      setIdeas((prev) => [newIdea, ...prev]);
      // Update cache
      await updateCachedIdea(newIdea);
      return newIdea;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create idea";
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  return {
    ideas,
    isLoading,
    error,
    refetch: fetchIdeas,
    createIdea,
  };
}

export function useIdea(id: string) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdea = async (useCache = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try cache first for instant UI update
      if (useCache) {
        const cached = await getCachedIdeas();
        if (cached) {
          const cachedIdea = cached.find((i) => i.id === id);
          if (cachedIdea) {
            setIdea(cachedIdea);
            setIsLoading(false);
            // Continue fetching in background to update cache
          }
        }
      }

      // Fetch from API
      const data = await apiClient.get<Idea>(API_ENDPOINTS.ideas.get(id));
      setIdea(data);
      
      // Update cache
      await updateCachedIdea(data);
    } catch (err) {
      // If 404, set idea to null (idea was deleted or doesn't exist)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch idea";
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        setIdea(null);
        // Remove from cache if deleted
        await removeCachedIdea(id);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateIdea = async (transcript: string) => {
    try {
      const updated = await apiClient.put<Idea>(API_ENDPOINTS.ideas.update(id), {
        transcript,
      });
      setIdea(updated);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update idea";
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (id) {
      fetchIdea();
    }
  }, [id]);

  return { idea, isLoading, error, updateIdea, refetch: fetchIdea };
}

