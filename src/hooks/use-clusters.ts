/**
 * Custom hook for managing idea clusters
 */

import { useState, useEffect, useMemo } from "react";
import { Cluster } from "@/types";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clusterCache } from "@/lib/cluster-cache";

const DEFAULT_CATEGORIES = [
  { id: "cat-business", label: "Business", emoji: "💼" },
  { id: "cat-todo", label: "To-do", emoji: "✅" },
  { id: "cat-diary", label: "Diary", emoji: "📔" },
  { id: "cat-spending", label: "My Spending", emoji: "💰" },
];

const CATEGORIES_STORAGE_KEY = "user_categories";

export function useClusters() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; label: string; emoji: string }>>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories from storage (migrated to AsyncStorage for consistency)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const stored = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (stored) {
          setCategories(JSON.parse(stored));
        }
      } catch (err) {
        // Use defaults if storage fails
        console.error("[useClusters] Error loading categories:", err);
      }
    };
    loadCategories();
  }, []);

  const fetchClusters = async (useCache = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try cache + pending first for instant UI update
      if (useCache) {
        const allClusters = await clusterCache.getAllIncludingPending();
        if (allClusters && allClusters.length > 0) {
          setClusters(allClusters);
          setIsLoading(false);
          // Continue fetching in background to update cache
        }
      }

      // Fetch from API
      const data = await apiClient.get<Cluster[]>(API_ENDPOINTS.clusters.list);
      
      // Update cache and state
      await clusterCache.set(data);
      setClusters(data);

      // Sync any pending categories in background (use stored sync function if available)
      const syncFn = clusterCache.getSyncFunction();
      const fetchClustersFn = clusterCache.getFetchClustersFunction();
      if (syncFn) {
        await clusterCache.syncPendingCategories(syncFn, fetchClustersFn || undefined);
      }
    } catch (err) {
      // In dev mode, return empty array instead of error
      const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === "true" || (typeof __DEV__ !== "undefined" && __DEV__);
      if (isDevMode) {
        // Still show cached + pending even if API fails
        const allClusters = await clusterCache.getAllIncludingPending();
        setClusters(allClusters || []);
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch clusters");
        // Show cached + pending on error
        const allClusters = await clusterCache.getAllIncludingPending();
        if (allClusters && allClusters.length > 0) {
          setClusters(allClusters);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (id: string, newLabel: string) => {
    // Check if it's a database cluster (not a local category)
    if (!id.startsWith("cat-")) {
      // Update database cluster
      setIsLoading(true);
      try {
        await apiClient.put(API_ENDPOINTS.clusters.update(id), {
          label: newLabel.trim(),
        });
        // Clear cache and refresh
        clusterCache.clear();
        await fetchClusters(false); // Force refresh from API
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update category";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Update local category
      const updated = categories.map(cat => 
        cat.id === id ? { ...cat, label: newLabel } : cat
      );
      setCategories(updated);
      try {
        await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("[useClusters] Failed to save categories:", err);
      }
    }
  };

  useEffect(() => {
    // Set up the sync function for background syncing (used by queueSync)
    const syncFn = async (label: string) => {
      return await apiClient.post<Cluster>(API_ENDPOINTS.clusters.create, { label });
    };
    clusterCache.setSyncFunction(syncFn);

    // Set up the fetch clusters function (for finding existing clusters when sync fails)
    const fetchClustersFn = async () => {
      const data = await apiClient.get<Cluster[]>(API_ENDPOINTS.clusters.list);
      return data;
    };
    clusterCache.setFetchClustersFunction(fetchClustersFn);

    fetchClusters();
    
    // Sync pending categories on app start
    const syncTimer = setTimeout(() => {
      clusterCache.syncPendingCategories(syncFn, fetchClustersFn).catch((err) => {
        console.error("[useClusters] Error syncing pending categories on start:", err);
      });
    }, 2000); // 2 second delay
    
    // Periodically sync pending categories (every 30 seconds)
    const syncInterval = setInterval(() => {
      clusterCache.syncPendingCategories(syncFn, fetchClustersFn).catch((err) => {
        console.error("[useClusters] Periodic sync error:", err);
      });
    }, 30000); // 30 seconds

    // Listen for network reconnection to sync pending categories
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log("[useClusters] 🌐 Network connected, syncing pending categories...");
        clusterCache.syncPendingCategories(syncFn, fetchClustersFn).catch((err) => {
          console.error("[useClusters] Error syncing pending categories on reconnect:", err);
        });
      }
    });

    return () => {
      clearTimeout(syncTimer);
      clearInterval(syncInterval);
      unsubscribe();
    };
  }, []);

  // Merge clusters with categories - memoized for performance
  const allCategories = useMemo(() => {
    // First, add all database clusters (including pending ones from cache)
    const databaseClusters = clusters.map(cluster => ({
      id: cluster.id,
      label: cluster.label,
      ideaIds: cluster.ideaIds || [],
      createdAt: cluster.createdAt,
      updatedAt: cluster.updatedAt,
      userId: cluster.userId,
    }));

    // Then add local categories that don't have database clusters
    const localCategories = categories
      .filter(cat => !clusters.find(c => c.label === cat.label))
      .map(cat => ({
        id: cat.id,
        label: cat.label,
        ideaIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: "current-user",
      }));

    // Combine: database clusters first, then local categories
    return [...databaseClusters, ...localCategories];
  }, [clusters, categories]);

  const createCluster = async (label: string, waitForSync = false) => {
    setError(null);
    
    const trimmedLabel = label.trim();
    
    // Check if cluster with this label already exists (prevent duplicates)
    const existingCluster = clusters.find(c => c.label.toLowerCase() === trimmedLabel.toLowerCase());
    if (existingCluster) {
      console.log(`[useClusters] Cluster "${trimmedLabel}" already exists, returning existing cluster`);
      return existingCluster;
    }
    
    // If we need to wait for sync (e.g., for immediate assignment), use optimistic update + sync
    if (waitForSync) {
      try {
        // Create optimistic cluster first for instant UI feedback
        const tempCluster = await clusterCache.createCategoryInstantly(trimmedLabel);
        setClusters((prev) => {
          // Check again in case it was added during async operation
          const alreadyExists = prev.find(c => c.label.toLowerCase() === trimmedLabel.toLowerCase());
          if (alreadyExists) {
            return prev;
          }
          return [tempCluster, ...prev];
        });
        
        // Then sync to server
        const syncedCluster = await apiClient.post<Cluster>(API_ENDPOINTS.clusters.create, { 
          label: trimmedLabel
        });
        
        // Replace temp cluster with synced one
        setClusters((prev) => {
          const filtered = prev.filter(c => c.id !== tempCluster.id);
          const updated = [syncedCluster, ...filtered];
          clusterCache.set(updated).catch(err => {
            console.error("[useClusters] Error updating cache:", err);
          });
          return updated;
        });
        
        return syncedCluster;
      } catch (err) {
        // Remove temp cluster on error
        setClusters((prev) => {
          const filtered = prev.filter(c => c.id !== tempCluster.id);
          clusterCache.clear(); // Clear cache to prevent stale data
          return filtered;
        });
        const errorMessage = err instanceof Error ? err.message : "Failed to create cluster";
        setError(errorMessage);
        throw err;
      }
    }
    
    // INSTANT: Create locally first (0-50ms) - optimistic update
    const tempCluster = await clusterCache.createCategoryInstantly(label);
    
    // Update UI immediately
    setClusters((prev) => [tempCluster, ...prev]);
    
    // Background sync will happen automatically via queueSync()
    // The sync function is already set in useEffect, so queueSync() will use it

    // Return immediately - UI already updated
    return tempCluster;
  };

  const assignIdeaToCluster = async (clusterId: string, ideaId: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.clusters.assign(clusterId), {
        ideaId,
      });
      // Clear cache and refresh
      clusterCache.clear();
      await fetchClusters(false); // Force refresh from API
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to assign idea";
      setError(errorMessage);
      throw err;
    }
  };

  return {
    clusters: allCategories,
    categories,
    isLoading,
    error,
    refetch: fetchClusters,
    updateCategory,
    createCluster,
    assignIdeaToCluster,
  };
}

export function useCluster(id: string) {
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCluster = async () => {
    if (!id) {
      setCluster(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Cluster>(API_ENDPOINTS.clusters.get(id));
      setCluster(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cluster");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCluster();
  }, [id]);

  return { cluster, isLoading, error, refetch: fetchCluster };
}

