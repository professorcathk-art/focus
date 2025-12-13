/**
 * Custom hook for managing idea clusters
 */

import { useState, useEffect, useMemo } from "react";
import { Cluster } from "@/types";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import * as SecureStore from "expo-secure-store";
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

  // Load categories from storage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const stored = await SecureStore.getItemAsync(CATEGORIES_STORAGE_KEY);
        if (stored) {
          setCategories(JSON.parse(stored));
        }
      } catch (err) {
        // Use defaults if storage fails
      }
    };
    loadCategories();
  }, []);

  const fetchClusters = async (useCache = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try cache first for instant UI update
      if (useCache) {
        const cached = await clusterCache.get();
        if (cached && cached.length > 0) {
          setClusters(cached);
          setIsLoading(false);
          // Continue fetching in background to update cache
        }
      }

      // Fetch from API
      const data = await apiClient.get<Cluster[]>(API_ENDPOINTS.clusters.list);
      
      // Update cache and state
      await clusterCache.set(data);
      setClusters(data);
    } catch (err) {
      // In dev mode, return empty array instead of error
      const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === "true" || (typeof __DEV__ !== "undefined" && __DEV__);
      if (isDevMode) {
        setClusters([]);
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch clusters");
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
        await SecureStore.setItemAsync(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save categories:", err);
      }
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  // Merge clusters with categories - memoized for performance
  const allCategories = useMemo(() => {
    // First, add all database clusters
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

  const createCluster = async (label: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.post<Cluster>(API_ENDPOINTS.clusters.create, {
        label,
      });
      // Clear cache and refresh
      clusterCache.clear();
      await fetchClusters(false); // Force refresh from API
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create cluster";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
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

  useEffect(() => {
    const fetchCluster = async () => {
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

    if (id) {
      fetchCluster();
    }
  }, [id]);

  return { cluster, isLoading, error };
}

