/**
 * Custom hook for managing ideas
 * Uses local caching to reduce API calls
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Idea } from "@/types";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import NetInfo from "@react-native-community/netinfo";
import { 
  getCachedIdeas, 
  setCachedIdeas, 
  updateCachedIdea, 
  removeCachedIdea, 
  clearIdeasCache,
  savePendingIdea,
  markPendingIdeaSynced,
  markPendingIdeaFailed,
  getAllIdeasIncludingPending,
  getPendingIdeas,
} from "@/lib/ideas-cache";

export function useIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false); // Prevent concurrent fetches

  const fetchIdeas = useCallback(async (useCache = true) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log("[useIdeas] ⏭️ Fetch already in progress, skipping...");
      return;
    }
    
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Try cache + pending ideas first for instant UI update
      if (useCache) {
        const allIdeas = await getAllIdeasIncludingPending();
        if (allIdeas && allIdeas.length > 0) {
          setIdeas(allIdeas);
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
      // If API fails but we have cache + pending, keep using them
      const allIdeas = await getAllIdeasIncludingPending();
      if (allIdeas && allIdeas.length > 0) {
        setIdeas(allIdeas);
        console.log("[useIdeas] API failed but using cached + pending data");
      }
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []); // Empty deps - function doesn't depend on any state

  /**
   * Sync pending ideas to server (called on app start and network reconnect)
   * Retries failed syncs (up to 5 times, with exponential backoff)
   */
  const syncPendingIdeas = useCallback(async () => {
    const pending = await getPendingIdeas();
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 60000; // 1 minute minimum between retries
    
    // Filter: unsynced ideas that haven't exceeded retry limit
    const unsynced = pending.filter((p) => {
      if (p.synced) return false;
      
      // If no error, always retry
      if (!p.error) return true;
      
      // If has error, check retry count and last retry time
      const retryCount = p.retryCount || 0;
      if (retryCount >= MAX_RETRIES) {
        console.log(`[useIdeas] ⏭️ Skipping idea ${p.id} - exceeded max retries (${MAX_RETRIES})`);
        return false;
      }
      
      // Check if enough time has passed since last retry
      if (p.lastRetryAt) {
        const lastRetry = new Date(p.lastRetryAt).getTime();
        const now = Date.now();
        const timeSinceRetry = now - lastRetry;
        if (timeSinceRetry < RETRY_DELAY_MS) {
          return false; // Too soon to retry
        }
      }
      
      return true; // Retry this failed sync
    });
    
    if (unsynced.length === 0) return;
    
    console.log(`[useIdeas] 🔄 Syncing ${unsynced.length} pending ideas...`);
    
    for (const pendingIdea of unsynced) {
      try {
        const newIdea = await apiClient.post<Idea>(API_ENDPOINTS.ideas.create, {
          transcript: pendingIdea.transcript,
        });
        
        await markPendingIdeaSynced(pendingIdea.id, newIdea);
        
        // Update UI if idea is still in state
        setIdeas((prev) => {
          const filtered = prev.filter((i) => i.id !== pendingIdea.id);
          return [newIdea, ...filtered];
        });
        
        console.log(`[useIdeas] ✅ Synced pending idea: ${pendingIdea.id}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Sync failed";
        await markPendingIdeaFailed(pendingIdea.id, errorMessage);
        console.error(`[useIdeas] ❌ Failed to sync pending idea ${pendingIdea.id}:`, err);
      }
    }
  }, []); // Empty deps - function doesn't depend on any state

  const createIdea = useCallback(async (transcript: string) => {
    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempIdea: Idea = {
      id: tempId,
      userId: "local",
      transcript,
      audioUrl: null,
      duration: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clusterId: null,
      isFavorite: false,
      transcriptionError: null,
    };

    // Optimistically add to UI immediately
    setIdeas((prev) => [tempIdea, ...prev]);
    
    // Save locally first to prevent data loss
    await savePendingIdea(tempId, transcript);

    try {
      // Now sync to server
      const newIdea = await apiClient.post<Idea>(API_ENDPOINTS.ideas.create, {
        transcript,
      });
      
      // Replace temp idea with real one
      setIdeas((prev) => {
        const filtered = prev.filter((i) => i.id !== tempId);
        return [newIdea, ...filtered];
      });
      
      // Mark as synced and update cache
      await markPendingIdeaSynced(tempId, newIdea);
      return newIdea;
    } catch (err) {
      // Mark as failed but keep in UI
      const errorMessage = err instanceof Error ? err.message : "Failed to create idea";
      await markPendingIdeaFailed(tempId, errorMessage);
      setError(errorMessage);
      // Keep the idea in UI but mark it as failed
      setIdeas((prev) => 
        prev.map((i) => 
          i.id === tempId 
            ? { ...i, transcriptionError: errorMessage }
            : i
        )
      );
      throw err;
    }
  }, []); // Empty deps - function doesn't depend on any state

  useEffect(() => {
    fetchIdeas();
    
    // Sync pending ideas on app start (after a short delay to ensure auth is ready)
    const syncTimer = setTimeout(() => {
      syncPendingIdeas().catch((err) => {
        console.error("[useIdeas] Error syncing pending ideas on start:", err);
      });
    }, 2000); // 2 second delay
    
    // Listen for network reconnection to sync pending ideas
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log("[useIdeas] 🌐 Network connected, syncing pending ideas...");
        syncPendingIdeas().catch((err) => {
          console.error("[useIdeas] Error syncing pending ideas on reconnect:", err);
        });
      }
    });
    
    return () => {
      clearTimeout(syncTimer);
      unsubscribe();
    };
  }, [fetchIdeas, syncPendingIdeas]);

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
      } else {
        // If API fails but we have cached data, keep using it
        if (!idea && useCache) {
          const cached = await getCachedIdeas();
          if (cached) {
            const cachedIdea = cached.find((i) => i.id === id);
            if (cachedIdea) {
              setIdea(cachedIdea);
              console.log("[useIdea] API failed but using cached data");
            }
          }
        }
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
      // Update cache
      await updateCachedIdea(updated);
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

