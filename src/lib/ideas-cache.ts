/**
 * Ideas cache using SecureStore for persistent local storage
 * Reduces API calls by caching ideas locally
 */

import * as SecureStore from "expo-secure-store";
import { Idea } from "@/types";

const CACHE_KEY = "ideas_cache";
const CACHE_TIMESTAMP_KEY = "ideas_cache_timestamp";
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes cache expiry

interface CachedIdeas {
  ideas: Idea[];
  timestamp: number;
}

/**
 * Get ideas from cache if not expired
 */
export async function getCachedIdeas(): Promise<Idea[] | null> {
  try {
    const cachedData = await SecureStore.getItemAsync(CACHE_KEY);
    const timestampStr = await SecureStore.getItemAsync(CACHE_TIMESTAMP_KEY);
    
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
    await SecureStore.setItemAsync(CACHE_KEY, JSON.stringify(cached));
    await SecureStore.setItemAsync(CACHE_TIMESTAMP_KEY, Date.now().toString());
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
    await SecureStore.deleteItemAsync(CACHE_KEY);
    await SecureStore.deleteItemAsync(CACHE_TIMESTAMP_KEY);
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
  } catch (error) {
    console.error("[Ideas Cache] Error removing cached idea:", error);
  }
}
