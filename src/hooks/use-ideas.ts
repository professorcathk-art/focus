/**
 * Custom hook for managing ideas
 */

import { useState, useEffect } from "react";
import { Idea } from "@/types";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";

export function useIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Idea[]>(API_ENDPOINTS.ideas.list);
      setIdeas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ideas");
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

  const fetchIdea = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Idea>(API_ENDPOINTS.ideas.get(id));
      setIdea(data);
    } catch (err) {
      // If 404, set idea to null (idea was deleted or doesn't exist)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch idea";
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        setIdea(null);
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

