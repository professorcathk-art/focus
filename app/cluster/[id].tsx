/**
 * Cluster detail view - Shows all ideas in a cluster
 */

import { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useColorScheme } from "react-native";
import { useCluster } from "@/hooks/use-clusters";
import { useIdeas } from "@/hooks/use-ideas";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";

const getClusterEmoji = (label: string): string => {
  const lower = label.toLowerCase();
  if (lower.includes("app")) return "📱";
  if (lower.includes("business")) return "💼";
  if (lower.includes("learning") || lower.includes("learn")) return "📚";
  if (lower.includes("product")) return "🎨";
  if (lower.includes("feature")) return "⚡";
  return "💡";
};

export default function ClusterDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Handle special clusters (uncategorised and favourite) - don't fetch from API
  const isUncategorised = id === "uncategorised";
  const isFavourite = id === "favourite";
  
  // Only fetch cluster from API if it's not a special cluster
  const { cluster, isLoading: clusterLoading, refetch: refetchCluster } = useCluster(
    (isUncategorised || isFavourite) ? "" : (id || "")
  );
  const { ideas, isLoading: ideasLoading, refetch } = useIdeas();
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Refetch ideas when screen comes into focus (e.g., after deleting an idea)
  useFocusEffect(
    useCallback(() => {
      refetch().catch(err => console.error("Error refetching ideas:", err));
    }, [refetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Only refetch cluster if it's not a special cluster
      if (isUncategorised || isFavourite) {
        await refetch();
      } else {
        await Promise.all([refetch(), refetchCluster()]);
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // DON'T auto-refresh on focus - only refresh manually or when needed
  // This reduces API calls significantly
  // Users can pull-to-refresh if they want fresh data
  
  const uncategorisedCluster = isUncategorised ? {
    id: "uncategorised",
    label: "Uncategorised",
    ideaIds: ideas.filter(idea => !idea.clusterId).map(idea => idea.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "current-user",
  } : null;

  const favouriteCluster = isFavourite ? {
    id: "favourite",
    label: "Favourite",
    ideaIds: ideas.filter(idea => idea.isFavorite).map(idea => idea.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "current-user",
  } : null;

  const displayCluster = isUncategorised ? uncategorisedCluster : isFavourite ? favouriteCluster : cluster;

  // Filter ideas: only include ideas that actually exist and match the cluster
  // This prevents showing deleted ideas that might still be in ideaIds array
  const clusterIdeas = displayCluster
    ? isUncategorised
      ? ideas.filter((idea) => idea && idea.id && !idea.clusterId)
      : isFavourite
      ? ideas.filter((idea) => idea && idea.id && idea.isFavorite)
      : ideas.filter((idea) => idea && idea.id && displayCluster.ideaIds.includes(idea.id))
    : [];

  // For special clusters, only wait for ideas to load
  // For regular clusters, wait for both cluster and ideas
  const isLoading = isUncategorised || isFavourite 
    ? ideasLoading 
    : (clusterLoading || ideasLoading);
  
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF3B30" />
        </View>
      </SafeAreaView>
    );
  }

  if (!displayCluster) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="folder-outline" size={64} color="#8E8E93" />
          <Text className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
            Category not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-primary rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
        <View className="flex-row items-center">
          <Text className="text-xl mr-2">
            {isUncategorised ? "📋" : isFavourite ? "⭐" : getClusterEmoji(displayCluster.label)}
          </Text>
          <Text className="text-lg font-semibold text-black dark:text-white">
            {displayCluster.label}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="pt-6 pb-4">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {clusterIdeas.length} idea{clusterIdeas.length !== 1 ? "s" : ""} in this category
          </Text>
        </View>

        {clusterIdeas.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="document-outline" size={64} color="#8E8E93" />
            <Text className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
              No ideas in this cluster
            </Text>
          </View>
        ) : (
          <View className="pb-8">
            {clusterIdeas.map((idea) => {
              // Skip if idea is null/undefined (shouldn't happen due to filter, but safety check)
              if (!idea || !idea.id) return null;

              const handleToggleFavorite = async (e: any) => {
                e.stopPropagation();
                if (togglingFavoriteId === idea.id) return;
                
                setTogglingFavoriteId(idea.id);
                try {
                  await apiClient.put(API_ENDPOINTS.ideas.toggleFavorite(idea.id));
                  await refetch();
                } catch (err) {
                  Alert.alert("Error", err instanceof Error ? err.message : "Failed to toggle favorite");
                } finally {
                  setTogglingFavoriteId(null);
                }
              };

              const handlePress = async () => {
                // Safety check - ensure idea exists before navigating
                if (!idea || !idea.id) {
                  Alert.alert("Error", "This note is no longer available");
                  // Refresh to remove deleted ideas (non-blocking)
                  refetch().catch(err => console.error("Error refetching:", err));
                  return;
                }
                
                // Additional validation for uncategorised ideas
                if (isUncategorised && idea.clusterId) {
                  // Idea was categorized, refresh list
                  refetch().catch(err => console.error("Error refetching:", err));
                  return;
                }
                
                router.push({
                  pathname: "/idea/[id]",
                  params: { id: idea.id },
                });
              };

              return (
                <TouchableOpacity
                  key={idea.id}
                  onPress={handlePress}
                  className="bg-card dark:bg-card-dark rounded-xl p-4 mb-3 border border-gray-200 dark:border-gray-800"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <Text
                      className="text-base text-black dark:text-white flex-1"
                      numberOfLines={3}
                    >
                      {idea.transcript || idea.audioUrl ? (idea.audioUrl && !idea.transcript ? "Audio recording (transcribing...)" : idea.transcript) : "Empty note"}
                    </Text>
                    <TouchableOpacity
                      onPress={handleToggleFavorite}
                      className="ml-2 p-1"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      disabled={togglingFavoriteId === idea.id}
                    >
                      {togglingFavoriteId === idea.id ? (
                        <ActivityIndicator size="small" color="#FFD700" />
                      ) : (
                        <Ionicons
                          name={idea.isFavorite ? "star" : "star-outline"}
                          size={20}
                          color={idea.isFavorite ? "#FFD700" : "#8E8E93"}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                  {idea.createdAt && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(idea.createdAt), {
                        addSuffix: true,
                      })}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

