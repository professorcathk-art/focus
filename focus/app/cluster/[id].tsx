/**
 * Cluster detail view - Shows all ideas in a cluster
 */

import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "react-native";
import { useCluster } from "@/hooks/use-clusters";
import { useIdeas } from "@/hooks/use-ideas";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

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
  const { cluster, isLoading: clusterLoading } = useCluster(id || "");
  const { ideas, isLoading: ideasLoading } = useIdeas();

  const clusterIdeas = cluster
    ? ideas.filter((idea) => cluster.ideaIds.includes(idea.id))
    : [];

  if (clusterLoading || ideasLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF3B30" />
        </View>
      </SafeAreaView>
    );
  }

  if (!cluster) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="folder-outline" size={64} color="#8E8E93" />
          <Text className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
            Cluster not found
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
          <Text className="text-xl mr-2">{getClusterEmoji(cluster.label)}</Text>
          <Text className="text-lg font-semibold text-black dark:text-white">
            {cluster.label}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-6">
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
            {clusterIdeas.map((idea) => (
              <TouchableOpacity
                key={idea.id}
                onPress={() =>
                  router.push({
                    pathname: "/idea/[id]",
                    params: { id: idea.id },
                  })
                }
                className="bg-card dark:bg-card-dark rounded-xl p-4 mb-3"
              >
                <Text
                  className="text-base text-black dark:text-white mb-2"
                  numberOfLines={3}
                >
                  {idea.transcript}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(idea.createdAt), {
                    addSuffix: true,
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

