/**
 * Idea detail view - View full transcript, play audio, copy text
 */

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useIdea } from "@/hooks/use-ideas";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { formatDistanceToNow } from "date-fns";

export default function IdeaDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { idea, isLoading } = useIdea(id || "");
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCopy = async () => {
    if (idea?.transcript) {
      await Clipboard.setStringAsync(idea.transcript);
      Alert.alert("Copied", "Idea text copied to clipboard");
    }
  };

  const handlePlayAudio = () => {
    // TODO: Implement audio playback
    setIsPlaying(!isPlaying);
    Alert.alert("Audio", "Audio playback will be implemented");
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF3B30" />
        </View>
      </SafeAreaView>
    );
  }

  if (!idea) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-outline" size={64} color="#8E8E93" />
          <Text className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
            Idea not found
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
        <Text className="text-lg font-semibold text-black dark:text-white">
          Idea Details
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Timestamp */}
        <View className="pt-6 pb-4">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(idea.createdAt), {
              addSuffix: true,
            })}
          </Text>
        </View>

        {/* Transcript */}
        <View className="mb-6">
          <Text className="text-lg text-black dark:text-white leading-7">
            {idea.transcript}
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row mb-8">
          {idea.audioUrl && (
            <TouchableOpacity
              onPress={handlePlayAudio}
              className="flex-1 bg-card dark:bg-card-dark rounded-xl p-4 mr-3 items-center"
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={24}
                color="#FF3B30"
              />
              <Text className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                {isPlaying ? "Pause" : "Play"} Audio
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleCopy}
            className="flex-1 bg-card dark:bg-card-dark rounded-xl p-4 items-center"
          >
            <Ionicons name="copy-outline" size={24} color="#FF3B30" />
            <Text className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              Copy Text
            </Text>
          </TouchableOpacity>
        </View>

        {/* Metadata */}
        {idea.duration && (
          <View className="pb-8">
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Duration: {Math.round(idea.duration)}s
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

