/**
 * Inbox tab - Browse ideas by cluster
 */

import { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useColorScheme, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useClusters } from "@/hooks/use-clusters";
import { useIdeas } from "@/hooks/use-ideas";
import { Cluster } from "@/types";
import { Ionicons } from "@expo/vector-icons";

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
  const { clusters, isLoading, updateCategory } = useClusters();
  const { ideas } = useIdeas();
  const isDark = useColorScheme() === "dark";
  const [editingCategory, setEditingCategory] = useState<{ id: string; label: string } | null>(null);
  const [editText, setEditText] = useState("");

  // Get uncategorised ideas (ideas without clusterId)
  const uncategorisedIdeas = useMemo(() => {
    return ideas.filter(idea => !idea.clusterId);
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

  // Combine clusters with uncategorised category
  const allClusters = useMemo(() => {
    const result = [...clusters];
    if (uncategorisedCluster) {
      // Add uncategorised at the beginning
      result.unshift(uncategorisedCluster);
    }
    return result;
  }, [clusters, uncategorisedCluster]);

  const handleClusterPress = (cluster: Cluster) => {
    router.push({
      pathname: "/cluster/[id]",
      params: { id: cluster.id },
    });
  };

  const handleEditPress = (cluster: Cluster) => {
    // Don't allow editing uncategorised category
    if (cluster.id === "uncategorised") return;
    setEditingCategory({ id: cluster.id, label: cluster.label });
    setEditText(cluster.label);
  };

  const handleSaveEdit = useCallback(async () => {
    if (editingCategory && editText.trim()) {
      try {
        await updateCategory(editingCategory.id, editText.trim());
        Keyboard.dismiss();
        setEditingCategory(null);
        setEditText("");
      } catch (err) {
        Alert.alert("Error", err instanceof Error ? err.message : "Failed to update category");
      }
    }
  }, [editingCategory, editText, updateCategory]);

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditText("");
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#34C759" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="pt-6 pb-6">
          <Text className="text-3xl font-bold text-black dark:text-white mb-2">
            Notes
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-400">
            Browse your ideas by category
          </Text>
        </View>

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
          <ScrollView showsVerticalScrollIndicator={false}>
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
                      {cluster.id === "uncategorised" ? "📋" : getClusterEmoji(cluster.label)}
                    </Text>
                    <Text className="text-lg font-semibold text-black dark:text-white flex-1">
                      {cluster.label}
                    </Text>
                    {cluster.id !== "uncategorised" && (
                      <TouchableOpacity
                        onPress={() => handleEditPress(cluster)}
                        className="ml-2 p-1.5"
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
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
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
                  >
                    <Text className="text-gray-700 dark:text-gray-300 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    className="px-6 py-3 rounded-xl"
                    style={{ backgroundColor: "#34C759" }}
                    disabled={!editText.trim()}
                    activeOpacity={0.7}
                  >
                    <Text className="text-white font-semibold">Save</Text>
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

