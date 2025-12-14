/**
 * Idea detail view - View full transcript, play audio, copy text, edit
 */

import { useState, useCallback, useEffect, useRef } from "react";
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
  KeyboardAvoidingView,
  Platform,
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
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

export default function IdeaDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { id } = useLocalSearchParams<{ id: string }>();
  const { idea, isLoading, updateIdea, refetch } = useIdea(id || "");
  const { clusters, assignIdeaToCluster, createCluster } = useClusters();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const transcriptionPollingRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = async () => {
    if (idea?.transcript) {
      await Clipboard.setStringAsync(idea.transcript);
      Alert.alert("Copied", "Idea text copied to clipboard");
    }
  };

  // Auto-refresh transcript when it's empty but audio exists (transcription in progress)
  // Poll much less frequently (every 30 seconds) to reduce API calls and costs
  useEffect(() => {
    if (idea && idea.audioUrl && (!idea.transcript || idea.transcript.trim() === '') && !idea.transcriptionError) {
      // Poll every 30 seconds for transcript updates (reduced from 10s to save costs)
      transcriptionPollingRef.current = setInterval(() => {
        console.log(`[Transcription Poll] Checking for transcript update for idea ${idea.id}`);
        refetch();
      }, 30000); // 30 seconds - much less frequent to reduce API calls
    } else {
      // Clear polling when transcript is available, no audio, or there's an error
      if (transcriptionPollingRef.current) {
        clearInterval(transcriptionPollingRef.current);
        transcriptionPollingRef.current = null;
      }
    }

    return () => {
      if (transcriptionPollingRef.current) {
        clearInterval(transcriptionPollingRef.current);
      }
    };
  }, [idea?.transcript, idea?.audioUrl, idea?.transcriptionError, refetch, idea?.id]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);

  const handlePlayAudio = useCallback(async () => {
    if (!idea?.audioUrl) {
      Alert.alert("Error", "No audio URL available");
      return;
    }

    console.log(`[Audio Playback] Attempting to play audio for idea ${idea.id}`);

    try {
      // Request audio permissions
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      if (soundRef.current) {
        // Already loaded - toggle play/pause
        const status = await soundRef.current.getStatusAsync();
        console.log(`[Audio Playback] Current status:`, status);
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
            console.log(`[Audio Playback] Paused`);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
            console.log(`[Audio Playback] Resumed`);
          }
        } else {
          // Sound not loaded properly, reload it
          await soundRef.current.unloadAsync();
          soundRef.current = null;
          // Fall through to load new sound
        }
      }
      
      if (!soundRef.current) {
        // Try local cache first, then fall back to remote URL
        let audioUri = idea.audioUrl;
        const localPath = `${FileSystem.cacheDirectory}audio/${idea.id}.m4a`;
        
        try {
          const localInfo = await FileSystem.getInfoAsync(localPath);
          if (localInfo.exists) {
            audioUri = localPath;
            console.log(`[Audio Playback] Using cached audio: ${localPath}`);
          } else {
            console.log(`[Audio Playback] No local cache, using remote URL: ${idea.audioUrl}`);
          }
        } catch (cacheCheckError) {
          console.log(`[Audio Playback] Cache check failed, using remote URL:`, cacheCheckError);
        }

        // Load and play audio
        console.log(`[Audio Playback] Loading audio from: ${audioUri}`);
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { 
            shouldPlay: true,
            isLooping: false,
          }
        );
        soundRef.current = sound;
        setIsPlaying(true);
        console.log(`[Audio Playback] Audio loaded and playing`);

        // Set up status listener
        sound.setOnPlaybackStatusUpdate((status) => {
          setPlaybackStatus(status);
          if (status.isLoaded) {
            if (status.didJustFinish) {
              console.log(`[Audio Playback] Finished`);
              setIsPlaying(false);
            }
            if (status.error) {
              console.error(`[Audio Playback] Error:`, status.error);
              Alert.alert("Error", `Audio playback error: ${status.error}`);
              setIsPlaying(false);
            }
          } else if (status.error) {
            console.error(`[Audio Playback] Load error:`, status.error);
            Alert.alert("Error", `Failed to load audio: ${status.error}`);
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error("[Audio Playback] Error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert("Error", `Failed to play audio: ${errorMessage}`);
      setIsPlaying(false);
      // Clean up on error
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (e) {
          console.error("[Audio Playback] Error unloading:", e);
        }
        soundRef.current = null;
      }
    }
  }, [idea?.audioUrl, idea?.id]);

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

  const handleChangeCategory = useCallback(async (clusterId: string) => {
    if (!idea) return;

    setIsChangingCategory(true);
    try {
      // Handle local category IDs (like "cat-business")
      let actualClusterId = clusterId;
      
      if (clusterId.startsWith("cat-")) {
        // Find the cluster by ID to get its label
        const category = clusters.find(c => c.id === clusterId);
        if (!category) {
          Alert.alert("Error", "Category not found");
          return;
        }
        
        // Find existing database cluster with this label
        const existingCluster = clusters.find(c => 
          c.label === category.label && !c.id.startsWith("cat-")
        );
        
        if (existingCluster) {
          actualClusterId = existingCluster.id;
        } else {
          // Create new cluster in database
          const newCluster = await createCluster(category.label);
          actualClusterId = newCluster.id;
        }
      }
      
      // Only assign if we have a valid database cluster ID
      if (actualClusterId && !actualClusterId.startsWith("cat-")) {
        await assignIdeaToCluster(actualClusterId, idea.id);
        await refetch();
        setShowCategoryPicker(false);
        Alert.alert("Success", "Category updated successfully");
      } else if (clusterId === "") {
        // Remove category (set to null)
        await apiClient.put(API_ENDPOINTS.ideas.update(idea.id), {
          clusterId: null,
        });
        await refetch();
        setShowCategoryPicker(false);
        Alert.alert("Success", "Category removed successfully");
      } else {
        Alert.alert("Error", "Invalid category");
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setIsChangingCategory(false);
    }
  }, [idea, clusters, assignIdeaToCluster, createCluster, refetch]);

  const handleDeleteIdea = useCallback(async () => {
    if (!idea) return;

    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiClient.delete(API_ENDPOINTS.ideas.delete(idea.id));
              // Navigate back immediately - the parent views will refresh
              router.back();
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete note");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [idea, router]);

  const handleToggleFavorite = useCallback(async () => {
    if (!idea || isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      await apiClient.put(API_ENDPOINTS.ideas.toggleFavorite(idea.id));
      await refetch();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to toggle favorite");
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [idea, refetch, isTogglingFavorite]);

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
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={handleToggleFavorite}
            activeOpacity={0.7}
            delayPressIn={0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isTogglingFavorite}
          >
            {isTogglingFavorite ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : (
              <Ionicons 
                name={idea?.isFavorite ? "star" : "star-outline"} 
                size={24} 
                color={idea?.isFavorite ? "#FFD700" : "#8E8E93"} 
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleEdit}
            activeOpacity={0.7}
            delayPressIn={0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={24} color="#34C759" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteIdea}
            activeOpacity={0.7}
            delayPressIn={0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Category Badge - Always visible and clickable, even for audio notes */}
        <View className="pt-6 pb-2">
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            className="self-start px-4 py-2 rounded-full flex-row items-center"
            style={{ backgroundColor: isDark ? "#1C1C1E" : "#E8F5E9" }}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <Text className="text-sm font-medium" style={{ color: "#34C759" }}>
              📁 {getClusterLabel(idea.clusterId)}
            </Text>
            {idea.audioUrl && (!idea.transcript || idea.transcript.trim() === '') && (
              <Text className="text-xs ml-2" style={{ color: "#34C759" }}>
                (tap to set category)
              </Text>
            )}
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
          {idea.transcriptionError ? (
            <View className="py-6 px-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <View className="flex-row items-center mb-2">
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text className="text-base font-semibold text-red-600 dark:text-red-400 ml-2">
                  Transcription Failed
                </Text>
              </View>
              <Text className="text-sm text-red-700 dark:text-red-300 mt-2">
                {idea.transcriptionError.split('\n')[0]} {/* Show first line of error */}
              </Text>
              <Text className="text-xs text-red-600 dark:text-red-400 mt-2 italic">
                Check Vercel logs for details. Idea ID: {idea.id}
              </Text>
            </View>
          ) : idea.audioUrl && (!idea.transcript || idea.transcript.trim() === '') ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#34C759" />
              <Text className="text-base text-gray-500 dark:text-gray-400 mt-4">
                Transcribing audio...
              </Text>
              <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                This may take a few moments
              </Text>
              <Text className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Check Vercel logs if this takes too long
              </Text>
            </View>
          ) : idea.transcript && idea.transcript.trim() ? (
            <Text className="text-lg text-black dark:text-white leading-7">
              {idea.transcript}
            </Text>
          ) : (
            <Text className="text-base text-gray-500 dark:text-gray-400 italic">
              No transcript available
            </Text>
          )}
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
        onRequestClose={() => {
          Keyboard.dismiss();
          setIsEditing(false);
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
              setIsEditing(false);
            }}
            className="flex-1 justify-end bg-black/50"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1C1E] rounded-t-3xl p-6"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                maxHeight: "90%",
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-black dark:text-white">
                  Edit Idea
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsEditing(false);
                  }}
                  className="p-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
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
                  returnKeyType="default"
                  blurOnSubmit={false}
                />
              </ScrollView>

              <View className="flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsEditing(false);
                  }}
                  className="px-6 py-3 rounded-xl"
                  style={{ backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-700 dark:text-gray-300 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  className="px-6 py-3 rounded-xl"
                  style={{ backgroundColor: "#34C759" }}
                  disabled={isSaving || !editText.trim()}
                  activeOpacity={0.7}
                >
                  {isSaving ? (
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
              {isChangingCategory ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#34C759" />
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Updating category...
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => handleChangeCategory("")}
                    className="py-3 px-4 rounded-xl mb-2"
                    style={{ backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }}
                    disabled={isChangingCategory}
                    activeOpacity={0.7}
                  >
                    <Text className="text-base text-black dark:text-white">Uncategorized</Text>
                  </TouchableOpacity>
                  {clusters.map((cluster) => (
                    <TouchableOpacity
                      key={cluster.id}
                      onPress={() => handleChangeCategory(cluster.id)}
                      className="py-3 px-4 rounded-xl mb-2"
                      style={{ backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }}
                      activeOpacity={0.7}
                      delayPressIn={0}
                      disabled={isChangingCategory}
                    >
                      <Text className="text-base text-black dark:text-white">{cluster.label}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
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
