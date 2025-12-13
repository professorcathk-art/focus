/**
 * Idea detail view - View full transcript, play audio, copy text, edit
 */

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useIdea } from "@/hooks/use-ideas";
import { useClusters } from "@/hooks/use-clusters";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";

export default function IdeaDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { id } = useLocalSearchParams<{ id: string }>();
  const { idea, isLoading, updateIdea, refetch } = useIdea(id || "");
  const { clusters, assignIdeaToCluster } = useClusters();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEdit = () => {
    if (idea) {
      setEditText(idea.transcript);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      Alert.alert("Error", "Transcript cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await updateIdea(editText.trim());
      setIsEditing(false);
      Alert.alert("Success", "Idea updated successfully");
      Keyboard.dismiss();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to update idea");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeCategory = async (clusterId: string) => {
    if (!idea) return;

    try {
      await assignIdeaToCluster(clusterId, idea.id);
      await refetch();
      setShowCategoryPicker(false);
      Alert.alert("Success", "Category updated successfully");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to update category");
    }
  };

  const getClusterLabel = (clusterId: string | null): string => {
    if (!clusterId) return "Uncategorized";
    const cluster = clusters.find(c => c.id === clusterId);
    return cluster?.label || "Uncategorized";
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

  if (!idea) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-outline" size={64} color="#8E8E93" />
          <Text className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
            Idea not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-[#34C759] rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-black dark:text-white">
          Idea Details
        </Text>
        <TouchableOpacity onPress={handleEdit}>
          <Ionicons name="create-outline" size={24} color="#34C759" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Category Badge */}
        <View className="pt-6 pb-2">
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            className="self-start px-4 py-2 rounded-full"
            style={{ backgroundColor: isDark ? "#1C1C1E" : "#E8F5E9" }}
          >
            <Text className="text-sm font-medium" style={{ color: "#34C759" }}>
              📁 {getClusterLabel(idea.clusterId)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timestamp */}
        <View className="pb-4">
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
        <View className="flex-row mb-8 gap-3">
          {idea.audioUrl && (
            <TouchableOpacity
              onPress={handlePlayAudio}
              className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-4 items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={24}
                color="#34C759"
              />
              <Text className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                {isPlaying ? "Pause" : "Play"} Audio
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleCopy}
            className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-4 items-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="copy-outline" size={24} color="#34C759" />
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

      {/* Edit Modal */}
      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-[#1C1C1E] rounded-t-3xl p-6 max-h-[90%]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-black dark:text-white">
                Edit Idea
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>

            <TextInput
              className="bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-black dark:text-white mb-4"
              placeholder="Edit your idea..."
              placeholderTextColor="#9CA3AF"
              value={editText}
              onChangeText={setEditText}
              multiline
              textAlignVertical="top"
              style={{ minHeight: 200 }}
              autoFocus
            />

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="px-6 py-3 rounded-xl"
                style={{ backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }}
              >
                <Text className="text-gray-700 dark:text-gray-300 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                className="px-6 py-3 rounded-xl"
                style={{ backgroundColor: "#34C759" }}
                disabled={isSaving || !editText.trim()}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-sm"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 16,
            }}
          >
            <Text className="text-xl font-bold text-black dark:text-white mb-4">
              Change Category
            </Text>
            <ScrollView className="max-h-64">
              <TouchableOpacity
                onPress={() => handleChangeCategory("")}
                className="py-3 px-4 rounded-xl mb-2"
                style={{ backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }}
              >
                <Text className="text-base text-black dark:text-white">Uncategorized</Text>
              </TouchableOpacity>
              {clusters.map((cluster) => (
                <TouchableOpacity
                  key={cluster.id}
                  onPress={() => handleChangeCategory(cluster.id)}
                  className="py-3 px-4 rounded-xl mb-2"
                  style={{ backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }}
                >
                  <Text className="text-base text-black dark:text-white">{cluster.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(false)}
              className="mt-4 py-3 rounded-xl"
              style={{ backgroundColor: "#F2F2F7" }}
            >
              <Text className="text-center text-gray-700 dark:text-gray-300 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
