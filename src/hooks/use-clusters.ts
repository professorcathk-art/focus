/**
 * Custom hook for managing idea clusters
 */

import { useState, useEffect } from "react";
import { Cluster } from "@/types";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import * as SecureStore from "expo-secure-store";

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

  const fetchClusters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Cluster[]>(API_ENDPOINTS.clusters.list);
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
    const updated = categories.map(cat => 
      cat.id === id ? { ...cat, label: newLabel } : cat
    );
    setCategories(updated);
    try {
      await SecureStore.setItemAsync(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save categories:", err);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  // Merge clusters with categories
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
  const allCategories = [...databaseClusters, ...localCategories];

  const createCluster = async (label: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.post<Cluster>(API_ENDPOINTS.clusters.create, {
        label,
      });
      await fetchClusters();
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
      await fetchClusters();
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

