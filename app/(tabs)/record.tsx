/**
 * Record tab - Main capture interface
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard, Alert, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useIdeas } from "@/hooks/use-ideas";
import { useClusters } from "@/hooks/use-clusters";
import { useAuthStore } from "@/store/auth-store";
import { Idea, Cluster } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS, API_BASE_URL } from "@/config/api";

export default function RecordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<"idle" | "recording" | "transcribing" | "saved">("idle");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [textInput, setTextInput] = useState("");
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null); // null = auto-categorize
  const [showNewClusterModal, setShowNewClusterModal] = useState(false);
  const [newClusterName, setNewClusterName] = useState("");
  const [showSuggestedCategoryModal, setShowSuggestedCategoryModal] = useState(false);
  const [suggestedCategoryLabel, setSuggestedCategoryLabel] = useState<string | null>(null);
  const [editableCategoryName, setEditableCategoryName] = useState<string>("");
  const [pendingIdeaId, setPendingIdeaId] = useState<string | null>(null);
  const [isAssigningCategory, setIsAssigningCategory] = useState(false);
  const { ideas, createIdea, refetch } = useIdeas();
  const { clusters, createCluster, assignIdeaToCluster, refetch: refetchClusters } = useClusters();
  
  // DON'T auto-refresh on focus - reduces API calls
  // Data is cached locally, so it's already available
  // Users can manually refresh if needed
  
  // Helper to get actual cluster ID (handles local category IDs)
  const getActualClusterId = (clusterId: string | null): string | null => {
    if (!clusterId) return null;
    if (!clusterId.startsWith("cat-")) return clusterId; // Already a real cluster ID
    
    // Find the cluster by ID to get its label
    const category = clusters.find(c => c.id === clusterId);
    if (!category) return null;
    
    // Find existing database cluster with this label
    const existingCluster = clusters.find(c => 
      c.label === category.label && !c.id.startsWith("cat-")
    );
    
    return existingCluster?.id || null;
  };

  // Request microphone permissions
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Microphone permission not granted');
        }
      } catch (error) {
        console.error('Error requesting microphone permission:', error);
      }
    })();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const handlePressIn = async () => {
    // Prevent multiple simultaneous calls
    if (isRecording) {
      return;
    }

    try {
      // Check authentication
      if (!isAuthenticated) {
        Alert.alert(
          "Sign In Required",
          "Please sign in to record ideas.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Sign In", 
              onPress: () => router.push("/(auth)/signin") 
            }
          ]
        );
        return;
      }

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Microphone permission is required to record audio.",
          [{ text: "OK" }]
        );
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setStatus("recording");
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
      setIsRecording(false);
      setStatus("idle");
      recordingRef.current = null;
    }
  };

  const handlePressOut = async () => {
    // Prevent multiple calls
    if (!isRecording || !recordingRef.current) {
      return;
    }

    // Minimum recording duration check (prevent accidental releases)
    // Allow recordings >= 0.5 seconds (500ms) to account for timing delays
    if (recordingTime < 0.5) {
      console.log(`Recording too short (${recordingTime}s), ignoring release`);
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
        recordingRef.current = null;
      }
      setRecordingTime(0);
      return;
    }

    try {
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setStatus("transcribing");

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (!uri) {
        throw new Error("Recording URI not found");
      }

      // Upload and transcribe
      const duration = recordingTime;
      
      // Create FormData with file and duration
      const token = await apiClient.getToken();
      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any);
      formData.append("duration", duration.toString());

      // Add timeout to prevent hanging (5 minutes max, but should complete faster)
      const TIMEOUT_MS = 300000; // 5 minutes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      let response;
      try {
        console.log(`[Upload Audio] Uploading to: ${API_BASE_URL}${API_ENDPOINTS.ideas.uploadAudio}`);
        console.log(`[Upload Audio] Recording duration: ${duration}s, file URI: ${uri}`);
        response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ideas.uploadAudio}`, {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error(`[Upload Audio] Fetch error:`, fetchError);
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
          throw new Error("Upload request timed out. Please try a shorter recording or try again later.");
        }
        if (fetchError.message?.includes('Network') || fetchError.message?.includes('connection')) {
          throw new Error("Network connection lost. Please check your internet and try again.");
        }
        throw fetchError;
      }

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const text = await response.text();
            errorData = text ? JSON.parse(text) : { message: `HTTP ${response.status}: ${response.statusText}` };
          } catch {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
        } else {
          const text = await response.text();
          errorData = { message: text || `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || "Upload failed");
      }

      const idea = await response.json() as Idea;

      // NEW: Save audio locally for instant playback
      // Copy recording to local cache directory before deleting original
      if (idea.audioUrl && uri) {
        try {
          const cacheDir = `${FileSystem.cacheDirectory}audio/`;
          await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
          const localPath = `${cacheDir}${idea.id}.m4a`;
          await FileSystem.copyAsync({
            from: uri,
            to: localPath,
          });
          console.log(`[Audio Cache] Saved audio locally: ${localPath}`);
        } catch (cacheError) {
          console.error("[Audio Cache] Failed to cache audio locally:", cacheError);
          // Continue anyway - audio is still in Supabase Storage
        }
      }

      // Clean up original recording file
      await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});

      // NEW: Recording is saved immediately (async transcription happens in background)
      // Show "saved" status immediately - transcript will be empty initially
      setStatus("saved");
      
      // Refetch in background - don't block on errors
      refetch().catch(err => console.error("Error refetching ideas:", err));
      refetchClusters().catch(err => console.error("Error refetching clusters:", err));
      
      // Handle suggested category if present (only if transcript already exists)
      if (idea.transcript && idea.suggestedClusterLabel && !idea.clusterId) {
        setSuggestedCategoryLabel(idea.suggestedClusterLabel);
        setEditableCategoryName(idea.suggestedClusterLabel);
        setPendingIdeaId(idea.id);
        setShowSuggestedCategoryModal(true);
        setStatus("idle");
      } else {
        // Auto-assigned or no category - just reset status after delay
        setTimeout(() => setStatus("idle"), 2000);
      }

      recordingRef.current = null;
    } catch (error) {
      console.error("Error stopping recording:", error);
      setStatus("idle");
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Only show error, don't force logout - let user decide
      if (errorMessage.includes("token") || errorMessage.includes("auth") || errorMessage.includes("401")) {
        Alert.alert(
          "Recording Failed",
          "Authentication error. Please check your connection and try again.",
          [
            { text: "OK" }
          ]
        );
      } else {
        Alert.alert(
          "Recording Failed",
          errorMessage || "Could not process recording. Please try again.",
          [{ text: "OK" }]
        );
      }

      // Clean up
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCreateNewCluster = async () => {
    if (!newClusterName.trim()) return;

    try {
      const newCluster = await createCluster(newClusterName.trim());
      setSelectedClusterId(newCluster.id);
      setNewClusterName("");
      setShowNewClusterModal(false);
      Alert.alert("Success", "Category created!");
    } catch (error) {
      Alert.alert("Error", "Failed to create category");
    }
  };

  const handleSaveText = async () => {
    if (!textInput.trim()) return;

    // Check authentication first
    if (!isAuthenticated) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to save ideas.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Sign In", 
            onPress: () => router.push("/(auth)/signin") 
          }
        ]
      );
      return;
    }

    // Hide keyboard first
    Keyboard.dismiss();

    setStatus("saved");
    try {
      const newIdea = await createIdea(textInput.trim());
      setTextInput("");
      
      // If a cluster was manually selected, assign the idea to it
      // This overrides automatic clustering (backend won't auto-assign if already assigned)
      if (selectedClusterId && newIdea) {
        setIsAssigningCategory(true);
        try {
          let actualClusterId = getActualClusterId(selectedClusterId);
          
          // If it's a local category ID, create the cluster in the database
          if (selectedClusterId.startsWith("cat-") && !actualClusterId) {
            const selectedCategory = clusters.find(c => c.id === selectedClusterId);
            if (selectedCategory) {
              const newCluster = await createCluster(selectedCategory.label);
              actualClusterId = newCluster.id;
            }
          }
          
          // Only assign if we have a valid database cluster ID
          if (actualClusterId && !actualClusterId.startsWith("cat-")) {
            await assignIdeaToCluster(actualClusterId, newIdea.id);
            console.log(`[Frontend] Manually assigned idea ${newIdea.id} to cluster ${actualClusterId}`);
          }
        } catch (err) {
          console.error("Failed to assign to cluster:", err);
          // Don't fail the save if assignment fails
        } finally {
          setIsAssigningCategory(false);
        }
      } else {
        // No manual selection - check backend response
        if (newIdea.suggestedClusterLabel && !newIdea.clusterId) {
          // Backend suggests a new category - show modal for approval
          console.log(`[Frontend] Backend suggested category: "${newIdea.suggestedClusterLabel}"`);
          setSuggestedCategoryLabel(newIdea.suggestedClusterLabel);
          setEditableCategoryName(newIdea.suggestedClusterLabel);
          setPendingIdeaId(newIdea.id);
          setShowSuggestedCategoryModal(true);
          setStatus("idle"); // Reset status so user can interact
        } else if (newIdea.clusterId) {
          // Backend auto-assigned to existing cluster
          console.log(`[Frontend] Backend auto-assigned idea ${newIdea.id} to cluster ${newIdea.clusterId}`);
          await refetch();
          await refetchClusters();
          setTimeout(() => setStatus("idle"), 2000);
        } else {
          // No assignment and no suggestion - just refresh
          await refetch();
          await refetchClusters();
          setTimeout(() => setStatus("idle"), 2000);
        }
      }
      
      setSelectedClusterId(null);
    } catch (error) {
      console.error("Failed to save idea:", error);
      setStatus("idle");
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Handle authentication errors
      if (errorMessage.includes("token") || errorMessage.includes("auth") || errorMessage.includes("401")) {
        Alert.alert(
          "Authentication Required",
          "Your session has expired. Please sign in again.",
          [
            { text: "OK", onPress: () => router.push("/(auth)/signin") }
          ]
        );
      } else {
        Alert.alert(
          "Failed to Save",
          errorMessage || "Could not connect to server. Make sure the backend is running and check your network connection.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const recentIdeas = ideas.slice(0, 3);
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  
  // Get cluster label for an idea
  const getClusterLabel = (idea: Idea) => {
    if (!idea.clusterId) return null;
    
    // Try to find cluster by ID in the clusters array
    // Clusters array contains both database clusters and local categories
    const cluster = clusters.find(c => c.id === idea.clusterId);
    
    if (cluster) {
      return cluster.label;
    }
    
    // If not found, it might be a database cluster that hasn't been fetched yet
    // Return null for now - will be updated when clusters refresh
    return null;
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={Keyboard.dismiss}
          className="flex-1"
        >
        <View className="flex-1 px-6">
          {/* Header with gradient background */}
          <View className="pt-6 pb-6" style={{
            backgroundColor: isDark ? "#000000" : "#E8F5E9",
            marginHorizontal: -24,
            paddingHorizontal: 24,
            paddingTop: 24,
          }}>
            <Text className="text-3xl font-bold text-black dark:text-white mb-2">
              Capture Idea
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-400">
              Record or type your thoughts
            </Text>
          </View>

          {/* Text Input Section */}
          <View className="mb-6">
            <View className="bg-white dark:bg-card-dark rounded-2xl p-4 shadow-sm" style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <TextInput
                className="text-base text-black dark:text-white min-h-[120]"
                placeholder="Type your idea here..."
                placeholderTextColor={isDark ? "#8E8E93" : "#8E8E93"}
                value={textInput}
                onChangeText={setTextInput}
                multiline
                textAlignVertical="top"
                returnKeyType="default"
                blurOnSubmit={false}
                style={{
                  fontSize: 16,
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              />
              {textInput.trim() && (
                <View className="mt-4">
                  {/* Category Selection */}
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                      Category
                    </Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingRight: 8 }}
                    >
                      {/* Auto-categorize (Default) */}
                      <TouchableOpacity
                        onPress={() => setSelectedClusterId(null)}
                        className="px-4 py-2.5 rounded-full mr-2"
                        style={{
                          backgroundColor: selectedClusterId === null ? "#34C759" : (isDark ? "#2C2C2E" : "#F2F2F7"),
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{
                            color: selectedClusterId === null ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#000000"),
                          }}
                        >
                          ✨ Auto-categorize
                        </Text>
                      </TouchableOpacity>

                      {/* Category Options */}
                      {clusters.slice(0, 10).map((cluster) => (
                        <TouchableOpacity
                          key={cluster.id}
                          onPress={() => setSelectedClusterId(cluster.id)}
                          className="px-4 py-2.5 rounded-full mr-2"
                          style={{
                            backgroundColor: selectedClusterId === cluster.id ? "#34C759" : (isDark ? "#2C2C2E" : "#F2F2F7"),
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            className="text-sm font-medium"
                            style={{
                              color: selectedClusterId === cluster.id ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#000000"),
                            }}
                          >
                            {cluster.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    onPress={handleSaveText}
                    className="w-full py-3 rounded-full flex-row items-center justify-center"
                    style={{ backgroundColor: "#34C759" }}
                    activeOpacity={0.8}
                    disabled={status === "saved" || isAssigningCategory}
                  >
                    {(status === "saved" || isAssigningCategory) ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-white font-semibold text-base">Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Voice Recording */}
          {true && (
            <>
              {/* Divider */}
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                <Text className="mx-4 text-xs text-gray-500 dark:text-gray-400 font-medium">OR</Text>
                <View className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              </View>

              {/* Record Button Container */}
              <View className="py-6 items-center" style={{ minHeight: 200 }}>
                <View className="items-center">
                  {/* Status Text */}
                  {status !== "idle" && (
                    <Text className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-6">
                      {status === "recording" && `Recording... ${formatTime(recordingTime)}`}
                      {status === "transcribing" && "Transcribing..."}
                      {status === "saved" && !isAssigningCategory && "✓ Idea saved!"}
                      {isAssigningCategory && "Assigning category..."}
                    </Text>
                  )}

                  {/* Record Button with gradient - fixed position */}
                  <TouchableOpacity
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    className="w-24 h-24 rounded-full items-center justify-center shadow-lg"
                    style={{
                      backgroundColor: isRecording ? "#30D158" : "#34C759",
                      shadowColor: "#34C759",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.3,
                      shadowRadius: 16,
                      elevation: 8,
                    }}
                    activeOpacity={1}
                    delayPressIn={0}
                    delayPressOut={0}
                  >
                    <Ionicons
                      name={isRecording ? "stop" : "mic"}
                      size={48}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center px-4">
                    Hold to record • Release when done
                  </Text>
                </View>
              </View>
            </>
          )}

        {/* Recent Ideas */}
        {ideas.length > 0 && (
          <View className="pb-6 mt-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-black dark:text-white">
                Recent Ideas
              </Text>
              {ideas.length > 3 && !showAllIdeas && (
                <TouchableOpacity
                  onPress={() => setShowAllIdeas(true)}
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#E8F5E9" }}
                >
                  <Text className="text-sm font-medium text-green-600 dark:text-green-400">
                    View All ({ideas.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(showAllIdeas ? ideas : recentIdeas).map((idea) => {
                const clusterLabel = getClusterLabel(idea);
                const handleToggleFavorite = async (e: any) => {
                  e.stopPropagation();
                  try {
                    await apiClient.put(API_ENDPOINTS.ideas.toggleFavorite(idea.id));
                    await refetch();
                    await refetchClusters();
                  } catch (err) {
                    console.error("Toggle favorite error:", err);
                  }
                };

                return (
                  <TouchableOpacity
                    key={idea.id}
                    onPress={() => router.push({
                      pathname: "/idea/[id]",
                      params: { id: idea.id },
                    })}
                    className="bg-white dark:bg-card-dark rounded-xl p-4 mb-3"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        {clusterLabel && (
                          <View className="bg-green-50 dark:bg-green-900/20 rounded-full px-3 py-1 mr-2">
                            <Text className="text-xs font-medium text-green-600 dark:text-green-400">
                              {clusterLabel}
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={handleToggleFavorite}
                          className="p-1"
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons
                            name={idea.isFavorite ? "star" : "star-outline"}
                            size={16}
                            color={idea.isFavorite ? "#FFD700" : "#8E8E93"}
                          />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(idea.createdAt), {
                          addSuffix: true,
                        })}
                      </Text>
                    </View>
                    {idea.audioUrl && (!idea.transcript || idea.transcript.trim() === '') ? (
                      <View className="flex-row items-center">
                        <Ionicons name="musical-notes-outline" size={16} color="#34C759" />
                        <Text className="text-sm text-gray-500 dark:text-gray-400 ml-2 italic">
                          Audio recording (transcribing...)
                        </Text>
                      </View>
                    ) : idea.transcript && idea.transcript.trim() ? (
                      <Text
                        className="text-base text-black dark:text-white"
                        numberOfLines={2}
                      >
                        {idea.transcript}
                      </Text>
                    ) : (
                      <Text className="text-sm text-gray-400 dark:text-gray-500 italic">
                        Empty note
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {showAllIdeas && ideas.length > 3 && (
              <TouchableOpacity
                onPress={() => setShowAllIdeas(false)}
                className="mt-3 self-center px-4 py-2 rounded-full"
                style={{ backgroundColor: "#F2F2F7" }}
              >
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Less
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        </View>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>


      {/* New Cluster Modal */}
      <Modal
        visible={showNewClusterModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowNewClusterModal(false);
          setNewClusterName("");
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-sm"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 16,
            }}
          >
            <Text className="text-xl font-bold text-black dark:text-white mb-4">
              New Category
            </Text>
            <TextInput
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base text-black dark:text-white mb-4"
              placeholder="Category name"
              placeholderTextColor="#9CA3AF"
              value={newClusterName}
              onChangeText={setNewClusterName}
              autoFocus
              onSubmitEditing={handleCreateNewCluster}
            />
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowNewClusterModal(false);
                  setNewClusterName("");
                }}
                className="px-6 py-3 rounded-xl"
                style={{ backgroundColor: "#F2F2F7" }}
              >
                <Text className="text-gray-700 dark:text-gray-300 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateNewCluster}
                className="px-6 py-3 rounded-xl"
                style={{ backgroundColor: "#34C759" }}
                disabled={!newClusterName.trim()}
              >
                <Text className="text-white font-semibold">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Suggested Category Modal */}
      <Modal
        visible={showSuggestedCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuggestedCategoryModal(false);
          setSuggestedCategoryLabel(null);
          setEditableCategoryName("");
          setPendingIdeaId(null);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-sm"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 16,
            }}
          >
            <View className="items-center mb-4">
              <Ionicons name="sparkles" size={32} color="#34C759" />
            </View>
            <Text className="text-xl font-bold text-black dark:text-white mb-2 text-center">
              Suggested Category
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
              We couldn't find a similar category. You can edit the suggested name or create a new one.
            </Text>
            
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category Name
              </Text>
              <TextInput
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base text-black dark:text-white"
                placeholder="Enter category name"
                placeholderTextColor="#9CA3AF"
                value={editableCategoryName}
                onChangeText={setEditableCategoryName}
                autoFocus={false}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <View className="flex-row gap-3 mb-3">
              <TouchableOpacity
                onPress={async () => {
                  // User approves suggested category (with edited name if changed)
                  const categoryName = editableCategoryName.trim() || suggestedCategoryLabel || "New Category";
                  if (pendingIdeaId && categoryName) {
                    try {
                      const newCluster = await createCluster(categoryName);
                      await assignIdeaToCluster(newCluster.id, pendingIdeaId);
                      await refetch();
                      await refetchClusters();
                    } catch (err) {
                      console.error("Failed to create and assign cluster:", err);
                      Alert.alert("Error", "Failed to create category");
                    }
                  }
                  setShowSuggestedCategoryModal(false);
                  setSuggestedCategoryLabel(null);
                  setEditableCategoryName("");
                  setPendingIdeaId(null);
                }}
                className="flex-1 px-6 py-3 rounded-xl"
                style={{ backgroundColor: "#34C759" }}
              >
                <Text className="text-white font-semibold text-center">Create Category</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                // User wants to select existing category - show categories inline
                setShowSuggestedCategoryModal(false);
                // Categories are now shown inline when typing, so just close the modal
              }}
              className="px-6 py-3 rounded-xl border-2"
              style={{ borderColor: "#34C759" }}
            >
              <Text className="text-green-600 dark:text-green-400 font-semibold text-center">
                Choose Existing Category
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // User skips categorization
                setShowSuggestedCategoryModal(false);
                setSuggestedCategoryLabel(null);
                setEditableCategoryName("");
                setPendingIdeaId(null);
                refetch();
              }}
              className="px-6 py-3 mt-3"
            >
              <Text className="text-gray-500 dark:text-gray-400 text-center text-sm">
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

