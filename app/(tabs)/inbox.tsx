/**
 * Inbox tab - Browse ideas by cluster
 */

import { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useColorScheme, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Keyboard, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useClusters } from "@/hooks/use-clusters";
import { useIdeas } from "@/hooks/use-ideas";
import { useSearch } from "@/hooks/use-search";
import { Cluster } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import { formatDistanceToNow } from "date-fns";

const getClusterEmoji = (label: string): string => {
  const lower = label.toLowerCase();
  if (lower.includes("business")) return "💼";
  if (lower.includes("to-do") || lower.includes("todo")) return "✅";
  if (lower.includes("diary")) return "📔";
  if (lower.includes("app")) return "📱";
  if (lower.includes("learning") || lower.includes("learn")) return "📚";
  if (lower.includes("product")) return "🎨";
  if (lower.includes("feature")) return "⚡";
  return "💡";
};

export default function InboxScreen() {
  const router = useRouter();
  const { clusters, isLoading, updateCategory, refetch: refetchClusters } = useClusters();
  const { ideas, isLoading: ideasLoading, error: ideasError, refetch: refetchIdeas } = useIdeas();
  const { results, aiAnswer, isFallback, isLoading: isSearching, search } = useSearch();
  const isDark = useColorScheme() === "dark";
  const [editingCategory, setEditingCategory] = useState<{ id: string; label: string } | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchClusters(), refetchIdeas()]);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchClusters, refetchIdeas]);

  // Get uncategorised ideas (ideas without clusterId)
  const uncategorisedIdeas = useMemo(() => {
    return ideas.filter(idea => !idea.clusterId);
  }, [ideas]);

  // Get favorited ideas
  const favoritedIdeas = useMemo(() => {
    return ideas.filter(idea => idea.isFavorite);
  }, [ideas]);

  // Create uncategorised cluster if there are uncategorised ideas
  const uncategorisedCluster: Cluster | null = useMemo(() => {
    if (uncategorisedIdeas.length === 0) return null;
    return {
      id: "uncategorised",
      label: "Uncategorised",
      ideaIds: uncategorisedIdeas.map(idea => idea.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: "current-user",
    };
  }, [uncategorisedIdeas]);

  // Create favourite cluster if there are favorited ideas
  const favouriteCluster: Cluster | null = useMemo(() => {
    if (favoritedIdeas.length === 0) return null;
    return {
      id: "favourite",
      label: "Favourite",
      ideaIds: favoritedIdeas.map(idea => idea.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: "current-user",
    };
  }, [favoritedIdeas]);

  // Combine clusters with uncategorised and favourite categories
  const allClusters = useMemo(() => {
    const result = [...clusters];
    // Add favourite at the very beginning (most important)
    if (favouriteCluster) {
      result.unshift(favouriteCluster);
    }
    // Add uncategorised after favourite
    if (uncategorisedCluster) {
      result.unshift(uncategorisedCluster);
    }
    return result;
  }, [clusters, uncategorisedCluster, favouriteCluster]);

  const handleClusterPress = (cluster: Cluster) => {
    router.push({
      pathname: "/cluster/[id]",
      params: { id: cluster.id },
    });
  };

  const handleEditPress = (cluster: Cluster) => {
    // Don't allow editing uncategorised or favourite categories
    if (cluster.id === "uncategorised" || cluster.id === "favourite") return;
    setEditingCategory({ id: cluster.id, label: cluster.label });
    setEditText(cluster.label);
  };

  const handleSaveEdit = useCallback(async () => {
    if (editingCategory && editText.trim()) {
      setIsUpdatingCategory(true);
      try {
        await updateCategory(editingCategory.id, editText.trim());
        Keyboard.dismiss();
        setEditingCategory(null);
        setEditText("");
      } catch (err) {
        Alert.alert("Error", err instanceof Error ? err.message : "Failed to update category");
      } finally {
        setIsUpdatingCategory(false);
      }
    }
  }, [editingCategory, editText, updateCategory]);

  const handleDeleteCategory = useCallback(async (clusterId: string, clusterLabel: string) => {
    // Double confirmation for category deletion
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${clusterLabel}"? This will remove the category but keep all notes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              `This will permanently delete "${clusterLabel}". All notes in this category will become uncategorised. This cannot be undone.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    setDeletingCategoryId(clusterId);
                    try {
                      await apiClient.delete(API_ENDPOINTS.clusters.delete(clusterId));
                      await refetchClusters();
                      await refetchIdeas();
                      Alert.alert("Success", "Category deleted successfully");
                    } catch (err) {
                      Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete category");
                    } finally {
                      setDeletingCategoryId(null);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [refetchClusters, refetchIdeas]);

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditText("");
  };

  if (isLoading || ideasLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#34C759" />
        </View>
      </SafeAreaView>
    );
  }

  // Show error if ideas failed to load
  if (ideasError) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text className="text-lg font-medium text-gray-900 dark:text-white mt-4 text-center">
            Failed to load notes
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            {ideasError}
          </Text>
          <TouchableOpacity
            onPress={() => refetchIdeas()}
            className="mt-6 bg-primary rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearchMode(true);
      try {
        await search(query);
      } catch (err) {
        console.error("Search error:", err);
      }
    } else {
      setIsSearchMode(false);
      search(""); // Clear search results
    }
  };

  const handleIdeaPress = (ideaId: string) => {
    router.push({
      pathname: "/idea/[id]",
      params: { id: ideaId },
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="pt-6 pb-4">
          <Text className="text-3xl font-bold text-black dark:text-white mb-2">
            Notes
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-400 mb-4">
            Browse your ideas by category
          </Text>

          {/* Search Bar */}
          <View className="mb-4">
            <View className="flex-row items-center bg-gray-50 dark:bg-gray-900 rounded-xl px-4 border border-gray-200 dark:border-gray-800">
              <Ionicons
                name="search"
                size={20}
                color="#8E8E93"
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="flex-1 py-3 text-base text-black dark:text-white"
                placeholder="Search notes..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={handleSearch}
                onSubmitEditing={() => handleSearch(searchQuery)}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setIsSearchMode(false);
                    search("");
                  }}
                  className="ml-2"
                >
                  <Ionicons name="close-circle" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Search Results */}
        {isSearchMode ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {isSearching ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color="#34C759" />
                <Text className="text-gray-500 dark:text-gray-400 mt-4">
                  Searching...
                </Text>
              </View>
            ) : aiAnswer ? (
              <>
                {/* AI Answer */}
                <View className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4 border border-green-200 dark:border-green-800">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="sparkles" size={20} color="#34C759" />
                    <Text className="text-sm font-semibold text-green-700 dark:text-green-400 ml-2">
                      {isFallback ? "AI Answer" : "AI Suggestion"}
                    </Text>
                  </View>
                  <Text className="text-base text-gray-800 dark:text-gray-200">
                    {aiAnswer}
                  </Text>
                </View>
                
                {/* Search Results */}
                {results.length > 0 && (
                  <>
                    <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                      Related Notes:
                    </Text>
                    {results.map((result) => (
                      <TouchableOpacity
                        key={result.idea.id}
                        onPress={() => handleIdeaPress(result.idea.id)}
                        className="bg-white dark:bg-card-dark rounded-xl p-4 mb-3"
                        style={{
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="bg-primary/10 rounded-full px-3 py-1">
                            <Text className="text-primary text-xs font-semibold">
                              {(result.similarity * 100).toFixed(0)}% match
                            </Text>
                          </View>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(result.idea.createdAt), {
                              addSuffix: true,
                            })}
                          </Text>
                        </View>
                        <Text
                          className="text-base text-black dark:text-white mb-2"
                          numberOfLines={3}
                        >
                          {result.idea.transcript}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {results.length === 0 && (
                  <View className="flex-1 items-center justify-center py-12">
                    <Ionicons name="search-outline" size={64} color="#8E8E93" />
                    <Text className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
                      No matching notes found
                    </Text>
                  </View>
                )}
              </>
            ) : results.length > 0 ? (
              <>
                {results.map((result) => (
                  <TouchableOpacity
                    key={result.idea.id}
                    onPress={() => handleIdeaPress(result.idea.id)}
                    className="bg-white dark:bg-card-dark rounded-xl p-4 mb-3"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="bg-primary/10 rounded-full px-3 py-1">
                        <Text className="text-primary text-xs font-semibold">
                          {(result.similarity * 100).toFixed(0)}% match
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(result.idea.createdAt), {
                          addSuffix: true,
                        })}
                      </Text>
                    </View>
                    <Text
                      className="text-base text-black dark:text-white mb-2"
                      numberOfLines={3}
                    >
                      {result.idea.transcript}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : searchQuery.length > 0 ? (
              <View className="flex-1 items-center justify-center py-12">
                <Ionicons name="search-outline" size={64} color="#8E8E93" />
                <Text className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
                  No results found
                </Text>
                <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center">
                  Try searching with different words
                </Text>
              </View>
            ) : null}
          </ScrollView>
        ) : (
          <>
            {/* Clusters List */}
            {allClusters.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons
              name="folder-outline"
              size={64}
              color="#8E8E93"
            />
            <Text className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
              No categories yet
            </Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center">
              Categories will appear here
            </Text>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {allClusters.map((cluster) => (
              <TouchableOpacity
                key={cluster.id}
                onPress={() => handleClusterPress(cluster)}
                className="bg-white dark:bg-card-dark rounded-xl p-5 mb-3 flex-row items-center justify-between"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-2xl mr-3">
                      {cluster.id === "uncategorised" ? "📋" : cluster.id === "favourite" ? "⭐" : getClusterEmoji(cluster.label)}
                    </Text>
                    <Text className="text-lg font-semibold text-black dark:text-white flex-1">
                      {cluster.label}
                    </Text>
                    {cluster.id !== "uncategorised" && cluster.id !== "favourite" && (
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => handleEditPress(cluster)}
                          className="p-1.5"
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.7}
                          delayPressIn={0}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color="#34C759"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteCategory(cluster.id, cluster.label)}
                          className="p-1.5"
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.7}
                          delayPressIn={0}
                          disabled={deletingCategoryId === cluster.id}
                        >
                          {deletingCategoryId === cluster.id ? (
                            <ActivityIndicator size="small" color="#FF3B30" />
                          ) : (
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color="#FF3B30"
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {cluster.ideaIds.length} idea{cluster.ideaIds.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#8E8E93"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
          </>
        )}

        {/* Edit Category Modal */}
        <Modal
          visible={editingCategory !== null}
          transparent
          animationType="fade"
          onRequestClose={() => {
            Keyboard.dismiss();
            handleCancelEdit();
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                Keyboard.dismiss();
                handleCancelEdit();
              }}
              className="flex-1 justify-center items-center bg-black/50 px-6"
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                className="bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-sm"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 16,
                }}
              >
                <Text className="text-xl font-bold text-black dark:text-white mb-4">
                  Edit Category
                </Text>
                <TextInput
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base text-black dark:text-white mb-4"
                  placeholder="Category name"
                  placeholderTextColor="#9CA3AF"
                  value={editText}
                  onChangeText={setEditText}
                  autoFocus
                  onSubmitEditing={handleSaveEdit}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <View className="flex-row justify-end gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      handleCancelEdit();
                    }}
                    className="px-6 py-3 rounded-xl"
                    style={{ backgroundColor: "#F2F2F7" }}
                    activeOpacity={0.7}
                    disabled={isUpdatingCategory}
                  >
                    <Text className="text-gray-700 dark:text-gray-300 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    className="px-6 py-3 rounded-xl"
                    style={{ backgroundColor: "#34C759" }}
                    disabled={!editText.trim() || isUpdatingCategory}
                    activeOpacity={0.7}
                  >
                    {isUpdatingCategory ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-white font-semibold">Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

