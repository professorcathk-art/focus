/**
 * Ideas cache using AsyncStorage for persistent local storage
 * Reduces API calls by caching ideas locally
 * Supports optimistic updates to prevent data loss
 * More reliable than SecureStore in Expo Go
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Idea } from "@/types";

const CACHE_KEY = "ideas_cache";
const CACHE_TIMESTAMP_KEY = "ideas_cache_timestamp";
const PENDING_IDEAS_KEY = "pending_ideas"; // Ideas waiting to sync to server
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes cache expiry

interface CachedIdeas {
  ideas: Idea[];
  timestamp: number;
}

interface PendingIdea {
  id: string;
  transcript: string;
  createdAt: string;
  synced: boolean;
  error?: string;
  retryCount?: number;
  lastRetryAt?: string;
}

/**
 * Get ideas from cache if not expired
 */
export async function getCachedIdeas(): Promise<Idea[] | null> {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEY);
    const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cachedData || !timestampStr) {
      return null;
    }
    
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRY_MS) {
      console.log("[Ideas Cache] Cache expired, will fetch fresh data");
      return null;
    }
    
    const cached: CachedIdeas = JSON.parse(cachedData);
    console.log(`[Ideas Cache] ✅ Using cached ideas (${cached.ideas.length} ideas, ${Math.round((now - timestamp) / 1000)}s old)`);
    return cached.ideas;
  } catch (error) {
    console.error("[Ideas Cache] Error reading cache:", error);
    return null;
  }
}

/**
 * Save ideas to cache
 */
export async function setCachedIdeas(ideas: Idea[]): Promise<void> {
  try {
    const cached: CachedIdeas = {
      ideas,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`[Ideas Cache] ✅ Cached ${ideas.length} ideas`);
  } catch (error) {
    console.error("[Ideas Cache] Error saving cache:", error);
  }
}

/**
 * Clear ideas cache
 */
export async function clearIdeasCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log("[Ideas Cache] ✅ Cache cleared");
  } catch (error) {
    console.error("[Ideas Cache] Error clearing cache:", error);
  }
}

/**
 * Update a single idea in cache (for optimistic updates)
 */
export async function updateCachedIdea(updatedIdea: Idea): Promise<void> {
  try {
    const cached = await getCachedIdeas();
    if (cached) {
      const index = cached.findIndex((i) => i.id === updatedIdea.id);
      if (index >= 0) {
        cached[index] = updatedIdea;
      } else {
        cached.unshift(updatedIdea); // Add new idea at the beginning
      }
      await setCachedIdeas(cached);
    }
  } catch (error) {
    console.error("[Ideas Cache] Error updating cached idea:", error);
  }
}

/**
 * Remove an idea from cache
 */
export async function removeCachedIdea(ideaId: string): Promise<void> {
  try {
    const cached = await getCachedIdeas();
    if (cached) {
      const filtered = cached.filter((i) => i.id !== ideaId);
      await setCachedIdeas(filtered);
    }
    // Also remove from pending if exists
    await removePendingIdea(ideaId);
  } catch (error) {
    console.error("[Ideas Cache] Error removing cached idea:", error);
  }
}

/**
 * Save idea optimistically (before API call succeeds)
 * This prevents data loss if app crashes or network fails
 */
export async function savePendingIdea(ideaId: string, transcript: string): Promise<void> {
  try {
    const pending = await getPendingIdeas();
    const newPending: PendingIdea = {
      id: ideaId,
      transcript,
      createdAt: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };
    pending.push(newPending);
    await AsyncStorage.setItem(PENDING_IDEAS_KEY, JSON.stringify(pending));
    console.log(`[Ideas Cache] 💾 Saved pending idea locally: ${ideaId}`);
  } catch (error) {
    console.error("[Ideas Cache] Error saving pending idea:", error);
  }
}

/**
 * Mark pending idea as synced (after API call succeeds)
 */
export async function markPendingIdeaSynced(ideaId: string, syncedIdea: Idea): Promise<void> {
  try {
    const pending = await getPendingIdeas();
    const updated = pending.filter((p) => p.id !== ideaId);
    await AsyncStorage.setItem(PENDING_IDEAS_KEY, JSON.stringify(updated));
    // Update cache with synced idea
    await updateCachedIdea(syncedIdea);
    console.log(`[Ideas Cache] ✅ Marked idea as synced: ${ideaId}`);
  } catch (error) {
    console.error("[Ideas Cache] Error marking pending idea as synced:", error);
  }
}

/**
 * Mark pending idea as failed
 */
export async function markPendingIdeaFailed(ideaId: string, error: string): Promise<void> {
  try {
    const pending = await getPendingIdeas();
    const idea = pending.find((p) => p.id === ideaId);
    if (idea) {
      idea.error = error;
      idea.retryCount = (idea.retryCount || 0) + 1;
      idea.lastRetryAt = new Date().toISOString();
      await AsyncStorage.setItem(PENDING_IDEAS_KEY, JSON.stringify(pending));
      console.log(`[Ideas Cache] ❌ Marked idea as failed (retry ${idea.retryCount}): ${ideaId}`);
    }
  } catch (err) {
    console.error("[Ideas Cache] Error marking pending idea as failed:", err);
  }
}

/**
 * Get all pending ideas (unsynced)
 */
export async function getPendingIdeas(): Promise<PendingIdea[]> {
  try {
    const data = await AsyncStorage.getItem(PENDING_IDEAS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("[Ideas Cache] Error reading pending ideas:", error);
    return [];
  }
}

/**
 * Remove a pending idea
 */
async function removePendingIdea(ideaId: string): Promise<void> {
  try {
    const pending = await getPendingIdeas();
    const filtered = pending.filter((p) => p.id !== ideaId);
    await AsyncStorage.setItem(PENDING_IDEAS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("[Ideas Cache] Error removing pending idea:", error);
  }
}

/**
 * Get all ideas including pending ones (for display)
 */
export async function getAllIdeasIncludingPending(): Promise<Idea[]> {
  const cached = await getCachedIdeas();
  const pending = await getPendingIdeas();
  
  const pendingIdeas: Idea[] = pending
    .filter((p) => !p.synced)
    .map((p) => ({
      id: p.id,
      userId: "local",
      transcript: p.transcript,
      audioUrl: null,
      duration: null,
      createdAt: p.createdAt,
      updatedAt: p.createdAt,
      clusterId: null,
      isFavorite: false,
      transcriptionError: p.error || null,
    }));
  
  // Merge cached and pending, removing duplicates
  const allIdeas = [...(cached || [])];
  pendingIdeas.forEach((pendingIdea) => {
    if (!allIdeas.find((i) => i.id === pendingIdea.id)) {
      allIdeas.unshift(pendingIdea);
    }
  });
  
  return allIdeas;
}
