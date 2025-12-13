/**
 * Search tab - Find ideas by meaning
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSearch } from "@/hooks/use-search";
import { SearchResult } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { results, aiAnswer, isFallback, isLoading, search } = useSearch();
  const isDark = useColorScheme() === "dark";

  const handleSearch = async () => {
    if (query.trim()) {
      try {
        await search(query);
      } catch (err) {
        console.error("Search error:", err);
      }
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
        <View className="pt-6 pb-6">
          <Text className="text-3xl font-bold text-black dark:text-white mb-2">
            Search
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-400">
            Find ideas by meaning, not keywords
          </Text>
        </View>

        {/* Search Input */}
        <View className="mb-6">
          <View className="flex-row items-center bg-gray-50 dark:bg-gray-900 rounded-xl px-4 border border-gray-200 dark:border-gray-800">
            <Ionicons
              name="search"
              size={20}
              color="#8E8E93"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 py-3 text-base text-black dark:text-white"
              placeholder="I remember something about..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery("");
                  search("");
                }}
                className="ml-2"
              >
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#34C759" />
            <Text className="text-gray-500 dark:text-gray-400 mt-4">
              Searching...
            </Text>
          </View>
        ) : aiAnswer ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* AI Answer (Fallback) */}
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
            
            {/* Search Results (if any) */}
            {results.length > 0 && (
              <>
                <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                  Related Notes:
                </Text>
                {results.map((result, index) => (
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
                      <View className="flex-row items-center">
                        <View className="bg-primary/10 rounded-full px-3 py-1 mr-2">
                          <Text className="text-primary text-xs font-semibold">
                            {(result.similarity * 100).toFixed(0)}% match
                          </Text>
                        </View>
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
          </ScrollView>
        ) : results.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {results.map((result, index) => (
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
                  <View className="flex-row items-center">
                    <View className="bg-primary/10 rounded-full px-3 py-1 mr-2">
                      <Text className="text-primary text-xs font-semibold">
                        {(result.similarity * 100).toFixed(0)}% match
                      </Text>
                    </View>
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
                {result.relatedIdeas && result.relatedIdeas.length > 0 && (
                  <View className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Related ideas:
                    </Text>
                    {result.relatedIdeas.slice(0, 2).map((related) => (
                      <Text
                        key={related.id}
                        className="text-sm text-gray-600 dark:text-gray-300"
                        numberOfLines={1}
                      >
                        • {related.transcript}
                      </Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : query.length > 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="search-outline" size={64} color="#8E8E93" />
            <Text className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
              No results found
            </Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center">
              Try searching with different words
            </Text>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="search-outline" size={64} color="#8E8E93" />
            <Text className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
              Start searching
            </Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center px-8">
              Type what you remember about your idea, and we'll find it by meaning
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

