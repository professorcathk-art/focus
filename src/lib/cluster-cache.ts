/**
 * In-memory cache for clusters/categories
 * Speeds up UI by avoiding repeated API calls
 */

import { Cluster } from "@/types";
import * as SecureStore from "expo-secure-store";

const CACHE_KEY = "clusters_cache";
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedClusters {
  clusters: Cluster[];
  timestamp: number;
}

class ClusterCache {
  private memoryCache: Cluster[] | null = null;
  private cacheTimestamp: number = 0;

  /**
   * Get clusters from memory cache if fresh, otherwise return null
   */
  getFromMemory(): Cluster[] | null {
    const now = Date.now();
    if (this.memoryCache && (now - this.cacheTimestamp) < CACHE_EXPIRY_MS) {
      return this.memoryCache;
    }
    return null;
  }

  /**
   * Set clusters in memory cache
   */
  setInMemory(clusters: Cluster[]): void {
    this.memoryCache = clusters;
    this.cacheTimestamp = Date.now();
  }

  /**
   * Get clusters from persistent storage (SecureStore)
   */
  async getFromStorage(): Promise<Cluster[] | null> {
    try {
      const cached = await SecureStore.getItemAsync(CACHE_KEY);
      if (cached) {
        const data: CachedClusters = JSON.parse(cached);
        const now = Date.now();
        if (now - data.timestamp < CACHE_EXPIRY_MS) {
          return data.clusters;
        }
      }
    } catch (err) {
      console.error("[ClusterCache] Error reading from storage:", err);
    }
    return null;
  }

  /**
   * Save clusters to persistent storage
   */
  async saveToStorage(clusters: Cluster[]): Promise<void> {
    try {
      const data: CachedClusters = {
        clusters,
        timestamp: Date.now(),
      };
      await SecureStore.setItemAsync(CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("[ClusterCache] Error saving to storage:", err);
    }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.memoryCache = null;
    this.cacheTimestamp = 0;
    SecureStore.deleteItemAsync(CACHE_KEY).catch(() => {});
  }

  /**
   * Get clusters with fallback: memory -> storage -> null
   */
  async get(): Promise<Cluster[] | null> {
    // Try memory first (fastest)
    const memoryCache = this.getFromMemory();
    if (memoryCache) {
      return memoryCache;
    }

    // Try storage (slower but persistent)
    const storageCache = await this.getFromStorage();
    if (storageCache) {
      // Also update memory cache
      this.setInMemory(storageCache);
      return storageCache;
    }

    return null;
  }

  /**
   * Save clusters to both memory and storage
   */
  async set(clusters: Cluster[]): Promise<void> {
    this.setInMemory(clusters);
    await this.saveToStorage(clusters);
  }
}

// Singleton instance
export const clusterCache = new ClusterCache();

