/**
 * Enhanced 3-tier cache for clusters/categories
 * TIER 1: In-memory cache (Map) - 0-1ms
 * TIER 2: AsyncStorage - persistent, 5-50ms (more reliable than SecureStore in Expo Go)
 * TIER 3: Supabase API - cloud backup, only when needed
 * 
 * Supports instant category creation with background sync
 */

import { Cluster } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "clusters_cache";
const PENDING_CATEGORIES_KEY = "pending_categories";
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes (longer expiry for categories)

interface CachedClusters {
  clusters: Cluster[];
  timestamp: number;
}

interface PendingCategory {
  id: string;
  label: string;
  createdAt: string;
  synced: boolean;
  error?: string;
}

class ClusterCache {
  private memoryCache: Cluster[] | null = null;
  private cacheTimestamp: number = 0;
  private syncQueue: PendingCategory[] = [];
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private syncFunction: ((label: string) => Promise<Cluster>) | null = null;
  private fetchClustersFunction: (() => Promise<Cluster[]>) | null = null;

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
   * Get clusters from persistent storage (AsyncStorage)
   */
  async getFromStorage(): Promise<Cluster[] | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
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
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
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
    AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
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

  /**
   * Create category instantly (optimistic update)
   * Returns immediately, syncs in background
   */
  async createCategoryInstantly(label: string): Promise<Cluster> {
    const tempId = `cat-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempCluster: Cluster = {
      id: tempId,
      userId: "local",
      label,
      ideaIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to memory cache immediately
    const current = this.getFromMemory() || [];
    this.setInMemory([tempCluster, ...current]);

    // Save to pending queue
    const pending: PendingCategory = {
      id: tempId,
      label,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    await this.addToPendingQueue(pending);

    // Queue background sync (debounced)
    this.queueSync();

    return tempCluster;
  }

  /**
   * Mark category as synced (after API call succeeds)
   */
  async markCategorySynced(tempId: string, syncedCluster: Cluster): Promise<void> {
    // Remove from pending
    await this.removeFromPendingQueue(tempId);

    // Update memory cache with real cluster
    const current = this.getFromMemory() || [];
    const updated = current.map((c) => (c.id === tempId ? syncedCluster : c));
    this.setInMemory(updated);
    await this.saveToStorage(updated);

    console.log(`[ClusterCache] ✅ Category synced: ${syncedCluster.label}`);
  }

  /**
   * Mark category as failed
   */
  async markCategoryFailed(tempId: string, error: string): Promise<void> {
    const pending = await this.getPendingCategories();
    const category = pending.find((p) => p.id === tempId);
    if (category) {
      category.error = error;
      await this.savePendingCategories(pending);
      console.log(`[ClusterCache] ❌ Category sync failed: ${category.label}`);
    }
  }

  /**
   * Get all clusters including pending ones
   */
  async getAllIncludingPending(): Promise<Cluster[]> {
    const cached = this.getFromMemory() || await this.getFromStorage() || [];
    const pending = await this.getPendingCategories();

    const pendingClusters: Cluster[] = pending
      .filter((p) => !p.synced)
      .map((p) => ({
        id: p.id,
        userId: "local",
        label: p.label,
        ideaIds: [],
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
      }));

    // Merge, removing duplicates
    const all = [...cached];
    pendingClusters.forEach((pendingCluster) => {
      if (!all.find((c) => c.id === pendingCluster.id)) {
        all.unshift(pendingCluster);
      }
    });

    return all;
  }

  /**
   * Get pending categories that need syncing
   */
  async getPendingCategories(): Promise<PendingCategory[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_CATEGORIES_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (err) {
      console.error("[ClusterCache] Error reading pending categories:", err);
      return [];
    }
  }

  /**
   * Add to pending queue
   */
  private async addToPendingQueue(pending: PendingCategory): Promise<void> {
    const queue = await this.getPendingCategories();
    queue.push(pending);
    await this.savePendingCategories(queue);
    this.syncQueue = queue;
  }

  /**
   * Remove from pending queue
   */
  private async removeFromPendingQueue(id: string): Promise<void> {
    const queue = await this.getPendingCategories();
    const filtered = queue.filter((p) => p.id !== id);
    await this.savePendingCategories(filtered);
    this.syncQueue = filtered;
  }

  /**
   * Save pending categories
   */
  private async savePendingCategories(queue: PendingCategory[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PENDING_CATEGORIES_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error("[ClusterCache] Error saving pending categories:", err);
    }
  }

  /**
   * Set the sync function to use for background syncing
   */
  setSyncFunction(syncFn: (label: string) => Promise<Cluster>): void {
    this.syncFunction = syncFn;
  }

  /**
   * Get the sync function (for external use)
   */
  getSyncFunction(): ((label: string) => Promise<Cluster>) | null {
    return this.syncFunction;
  }

  /**
   * Set the fetch clusters function (for finding existing clusters)
   */
  setFetchClustersFunction(fetchFn: () => Promise<Cluster[]>): void {
    this.fetchClustersFunction = fetchFn;
  }

  /**
   * Get the fetch clusters function (for external use)
   */
  getFetchClustersFunction(): (() => Promise<Cluster[]>) | null {
    return this.fetchClustersFunction;
  }

  /**
   * Queue sync with debounce (5 seconds)
   */
  private queueSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      if (this.syncFunction) {
        this.syncPendingCategories(this.syncFunction, this.fetchClustersFunction || undefined).catch((err) => {
          console.error("[ClusterCache] Sync error:", err);
        });
      } else {
        console.warn("[ClusterCache] No sync function set, skipping background sync");
      }
    }, 5000); // 5 second debounce
  }

  /**
   * Sync pending categories to Supabase (called by use-clusters hook)
   * This method should be called by the hook, not internally
   */
  async syncPendingCategories(
    syncFn: (label: string) => Promise<Cluster>,
    fetchClustersFn?: () => Promise<Cluster[]>
  ): Promise<void> {
    if (this.isSyncing) return;

    const pending = await this.getPendingCategories();
    const unsynced = pending.filter((p) => !p.synced);

    if (unsynced.length === 0) return;

    this.isSyncing = true;
    console.log(`[ClusterCache] 🔄 Syncing ${unsynced.length} pending categories...`);

    // Batch sync (process up to 10 at a time)
    const batch = unsynced.slice(0, 10);
    
    for (const category of batch) {
      let resolved = false;
      try {
        const syncedCluster = await syncFn(category.label);
        await this.markCategorySynced(category.id, syncedCluster);
        resolved = true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Sync failed";
        
        // If cluster already exists, try to find it from the server
        if (errorMsg.includes("already exists") && fetchClustersFn) {
          try {
            console.log(`[ClusterCache] Cluster "${category.label}" already exists, fetching from server...`);
            const allClusters = await fetchClustersFn();
            const existingCluster = allClusters.find(
              (c) => c.label.toLowerCase() === category.label.toLowerCase()
            );
            
            if (existingCluster) {
              console.log(`[ClusterCache] ✅ Found existing cluster, marking as synced: ${existingCluster.label}`);
              await this.markCategorySynced(category.id, existingCluster);
              resolved = true; // Successfully resolved
            } else {
              console.warn(`[ClusterCache] ⚠️ Cluster "${category.label}" already exists but not found in server list`);
              // Still mark as failed since we couldn't find it
            }
          } catch (fetchErr) {
            console.error(`[ClusterCache] Error fetching clusters to find existing:`, fetchErr);
            // Mark as failed if fetch also fails
          }
        }
        
        // Only mark as failed if we couldn't resolve it
        if (!resolved) {
          await this.markCategoryFailed(category.id, errorMsg);
          console.error(`[ClusterCache] Failed to sync category ${category.label}:`, err);
        }
      }
    }

    this.isSyncing = false;

    // If more pending, queue another sync (but only if not already queued)
    const remaining = await this.getPendingCategories();
    const stillUnsynced = remaining.filter((p) => !p.synced);
    if (stillUnsynced.length > 0 && !this.syncTimeout) {
      // Only queue if there's no pending sync already
      this.queueSync();
    }
  }
}

// Singleton instance
export const clusterCache = new ClusterCache();

