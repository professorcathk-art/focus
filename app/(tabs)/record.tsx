/**
 * Record tab - Main capture interface
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard, Alert, Modal, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  const { isAuthenticated, user } = useAuthStore();
  
  // Get user name safely - skip name if cannot identify
  const getUserName = () => {
    if (!user) return "there";
    return user.name || user.email?.split("@")[0] || "there";
  };
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<"idle" | "recording" | "transcribing" | "saved">("idle");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const savingRef = useRef(false); // Prevent duplicate saves
  const [textInput, setTextInput] = useState("");
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null); // null = auto-categorize
  const [showNewClusterModal, setShowNewClusterModal] = useState(false);
  const [newClusterName, setNewClusterName] = useState("");
  const [showSuggestedCategoryModal, setShowSuggestedCategoryModal] = useState(false);
  const [suggestedCategoryLabel, setSuggestedCategoryLabel] = useState<string | null>(null);
  const [editableCategoryName, setEditableCategoryName] = useState<string>("");
  const [pendingIdeaId, setPendingIdeaId] = useState<string | null>(null);
  const [isAssigningCategory, setIsAssigningCategory] = useState(false);
  const [showCategoryPickerInModal, setShowCategoryPickerInModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false); // Loading state for auto-categorize
  const { ideas, createIdea, refetch } = useIdeas();
  const { clusters, createCluster, assignIdeaToCluster, refetch: refetchClusters } = useClusters();
  
  // Polling for audio notes that are still transcribing (every 30 seconds)
  const transcriptionPollingRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Check if there are any audio notes still transcribing
    const hasTranscribingAudio = ideas.some(
      idea => idea.audioUrl && (!idea.transcript || idea.transcript.trim() === '') && !idea.transcriptionError
    );
    
    if (hasTranscribingAudio) {
      // Poll every 30 seconds to check for transcript updates
      transcriptionPollingRef.current = setInterval(() => {
        console.log('[Record Screen] Polling for transcript updates...');
        refetch().catch(err => console.error('Error polling for transcripts:', err));
      }, 30000); // 30 seconds
    } else {
      // Clear polling when no transcribing audio
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideas]); // Only depend on ideas, not refetch (refetch is stable now)
  
  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchClusters()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchClusters]);
  
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

    // IMMEDIATELY set recording state and start timer to ensure UI responds instantly
    setIsRecording(true);
    setStatus("recording");
    setRecordingTime(0);
    
    // Start timer immediately (before async operations)
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    try {
      // Check authentication
      if (!isAuthenticated) {
        // Reset if not authenticated
        setIsRecording(false);
        setStatus("idle");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
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
        // Reset if permission denied
        setIsRecording(false);
        setStatus("idle");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
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
      // State already set above, timer already started
    } catch (error) {
      console.error("Error starting recording:", error);
      // Reset on error
      setIsRecording(false);
      setStatus("idle");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      recordingRef.current = null;
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  const handlePressOut = async () => {
    // Prevent multiple calls
    if (!isRecording || !recordingRef.current) {
      return;
    }

    // Minimum recording duration check (prevent accidental releases and API errors)
    // Require recordings >= 1 second - Deepgram API needs at least 1 second of audio
    if (recordingTime < 1.0) {
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
      setStatus("idle");
      
      // Show user-friendly warning
      Alert.alert(
        "Recording Too Short",
        "Please record for at least 1 second. The recording was not saved.",
        [{ text: "OK" }]
      );
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
        setShowCategoryPickerInModal(false); // Reset to show suggested category view
        setShowSuggestedCategoryModal(true);
        setStatus("idle");
      } else {
        // Auto-assigned or no category - show option to categorize later
        // For voice recordings, allow user to save first and categorize later
        setPendingIdeaId(idea.id); // Store idea ID for later categorization
        setTimeout(() => setStatus("idle"), 2000);
      }

      recordingRef.current = null;
    } catch (error) {
      console.error("Error stopping recording:", error);
      setStatus("idle");
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Handle specific error cases
      if (errorMessage.includes("token") || errorMessage.includes("auth") || errorMessage.includes("401")) {
        Alert.alert(
          "Recording Failed",
          "Authentication error. Please check your connection and try again.",
          [
            { text: "OK" }
          ]
        );
      } else if (errorMessage.includes("too short") || errorMessage.includes("RECORDING_TOO_SHORT")) {
        // Recording too short - already handled above, but catch backend response too
        Alert.alert(
          "Recording Too Short",
          "Please record for at least 1 second. The recording was not saved.",
          [{ text: "OK" }]
        );
      } else if (errorMessage.includes("No words detected") || errorMessage.includes("no words")) {
        // No words detected in recording
        Alert.alert(
          "No Words Detected",
          "No words were detected in the recording. Please try speaking more clearly or check your microphone.",
          [{ text: "OK" }]
        );
      } else if (errorMessage.includes("Transcription failed") || errorMessage.includes("no transcript")) {
        // Transcription error - likely due to API issue
        Alert.alert(
          "Transcription Failed",
          "Could not transcribe the recording. Please try recording again.",
          [{ text: "OK" }]
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

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const handleCreateNewCluster = async () => {
    if (!newClusterName.trim() || isCreatingCategory) return;

    try {
      setIsCreatingCategory(true);
      // Use waitForSync=true to get the real cluster ID immediately for proper assignment
      const newCluster = await createCluster(newClusterName.trim(), true);
      console.log(`[Frontend] Created new cluster: ${newCluster.id} with label: "${newCluster.label}"`);
      setSelectedClusterId(newCluster.id);
      setNewClusterName("");
      setShowNewClusterModal(false);
      // Refresh clusters to ensure the new one is in the list
      await refetchClusters();
      console.log(`[Frontend] Selected cluster ID set to: ${newCluster.id}`);
      Alert.alert("Success", "Category created!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create category";
      if (errorMessage.includes("already exists")) {
        // Find existing cluster and select it
        const existingCluster = clusters.find(c => 
          c.label.toLowerCase() === newClusterName.trim().toLowerCase() && !c.id.startsWith('cat-')
        );
        if (existingCluster) {
          setSelectedClusterId(existingCluster.id);
          setNewClusterName("");
          setShowNewClusterModal(false);
          Alert.alert("Info", "Category already exists. Selected it for you.");
        } else {
          Alert.alert("Error", "Category already exists");
        }
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsCreatingCategory(false);
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

    // Prevent double-save - check both state and ref
    if (status === "saved" || isAssigningCategory || savingRef.current) {
      console.log("[RecordScreen] ⏭️ Save already in progress, skipping duplicate save");
      return;
    }

    // Mark as saving immediately (but don't set status to "saved" yet - wait for category approval)
    savingRef.current = true;
    const textToSave = textInput.trim();
    setIsAssigningCategory(false); // Reset assignment state at start
    
    // Show loading indicator if auto-categorize is enabled (no manual category selected)
    if (!selectedClusterId) {
      setIsCategorizing(true);
    }
    
    // Clear input immediately to prevent duplicate saves
    setTextInput("");
    
    try {
      // Add timeout to prevent hanging on slow API
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Save timeout after 30 seconds")), 30000);
      });
      
      const newIdea = await Promise.race([
        createIdea(textToSave),
        timeoutPromise
      ]);
      
      // If a cluster was manually selected, assign the idea to it
      // This overrides automatic clustering (backend won't auto-assign if already assigned)
      if (selectedClusterId && newIdea) {
        setStatus("saved"); // Mark as saved after manual category assignment
        setIsAssigningCategory(true);
        try {
          let actualClusterId: string | null = null;
          
          console.log(`[Frontend] Assigning idea ${newIdea.id} to selected cluster: ${selectedClusterId}`);
          
          // Check if it's already a real database cluster ID (doesn't start with "cat-")
          if (!selectedClusterId.startsWith("cat-")) {
            // It's already a real database cluster ID - use it directly
            actualClusterId = selectedClusterId;
            console.log(`[Frontend] Using real cluster ID directly: ${actualClusterId}`);
          } else {
            // It's a temp/local category ID - need to find or create the real cluster
            const selectedCategory = clusters.find(c => c.id === selectedClusterId);
            if (selectedCategory) {
              // First try to find existing database cluster with same label
              const existingCluster = clusters.find(c => 
                c.label === selectedCategory.label && !c.id.startsWith("cat-")
              );
              
              if (existingCluster) {
                actualClusterId = existingCluster.id;
              } else {
                // Need to create the cluster in database
                // This should rarely happen since plus button creates with waitForSync=true
                console.log(`[Frontend] Creating cluster "${selectedCategory.label}" for assignment`);
                const newCluster = await createCluster(selectedCategory.label, true);
              actualClusterId = newCluster.id;
                // Refresh clusters to include the new one
                await refetchClusters();
              }
            } else {
              // Category not found - this shouldn't happen if created via plus button
              console.warn(`[Frontend] Selected cluster ${selectedClusterId} not found in clusters array`);
              // Try refreshing clusters and checking again
              await refetchClusters();
              await new Promise(resolve => setTimeout(resolve, 200));
              const refreshedCategory = clusters.find(c => c.id === selectedClusterId);
              if (refreshedCategory && !refreshedCategory.id.startsWith("cat-")) {
                actualClusterId = refreshedCategory.id;
              }
            }
          }
          
          // Only assign if we have a valid database cluster ID
          if (actualClusterId && !actualClusterId.startsWith("cat-")) {
            console.log(`[Frontend] Assigning idea ${newIdea.id} to cluster ${actualClusterId}`);
            await assignIdeaToCluster(actualClusterId, newIdea.id);
            console.log(`[Frontend] Successfully assigned idea ${newIdea.id} to cluster ${actualClusterId}`);
            // Refetch in background - don't block on errors
            refetch().catch(err => console.error("Error refetching ideas:", err));
            refetchClusters().catch(err => console.error("Error refetching clusters:", err));
            setStatus("idle");
          } else {
            console.error(`[Frontend] ERROR: Could not determine actual cluster ID for ${selectedClusterId}. ActualClusterId: ${actualClusterId}`);
            Alert.alert("Warning", "Note saved but category assignment failed. Please assign manually.");
            // Refetch in background - don't block on errors
            refetch().catch(err => console.error("Error refetching ideas:", err));
            refetchClusters().catch(err => console.error("Error refetching clusters:", err));
            setStatus("idle");
          }
        } catch (err) {
          console.error("Failed to assign to cluster:", err);
          // Don't fail the save if assignment fails, but reset status
          // Refetch in background - don't block on errors
          refetch().catch(refetchErr => console.error("Error refetching ideas:", refetchErr));
          refetchClusters().catch(refetchErr => console.error("Error refetching clusters:", refetchErr));
          setStatus("idle");
        } finally {
          setIsAssigningCategory(false);
        }
      } else {
        // No manual selection - check backend response
        setIsCategorizing(false); // Stop loading indicator
        if (newIdea.suggestedClusterLabel && !newIdea.clusterId) {
          // Backend suggests a new category - show modal BEFORE marking as saved
          console.log(`[Frontend] Backend suggested category: "${newIdea.suggestedClusterLabel}"`);
          setSuggestedCategoryLabel(newIdea.suggestedClusterLabel);
          setEditableCategoryName(newIdea.suggestedClusterLabel);
          setPendingIdeaId(newIdea.id);
          setShowSuggestedCategoryModal(true);
          // DON'T set status to "saved" yet - wait for user approval
          // Status stays as "idle" so user can interact with modal
        } else if (newIdea.clusterId) {
          // Backend auto-assigned to existing cluster - mark as saved
          console.log(`[Frontend] Backend auto-assigned idea ${newIdea.id} to cluster ${newIdea.clusterId}`);
          setStatus("saved");
          // Refetch in background - don't block on errors
          refetch().catch(err => console.error("Error refetching ideas:", err));
          refetchClusters().catch(err => console.error("Error refetching clusters:", err));
          setTimeout(() => setStatus("idle"), 2000);
        } else {
          // No assignment and no suggestion - mark as saved
          setStatus("saved");
          // Refetch in background - don't block on errors
          refetch().catch(err => console.error("Error refetching ideas:", err));
          refetchClusters().catch(err => console.error("Error refetching clusters:", err));
          setTimeout(() => setStatus("idle"), 2000);
        }
      }
      
      // Reset selection only after all operations complete
      // Don't reset if assignment is still in progress (shouldn't happen, but safety check)
      if (!isAssigningCategory) {
      setSelectedClusterId(null);
      }
    } catch (error) {
      console.error("Failed to save idea:", error);
      
      // Restore input text if save failed (unless it was a timeout)
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const isTimeout = errorMessage.includes("timeout");
      
      if (!isTimeout) {
        setTextInput(textToSave); // Restore text on error
      }
      
      setStatus("idle");
      setIsAssigningCategory(false);
      setSelectedClusterId(null);
      
      // Handle authentication errors
      if (errorMessage.includes("token") || errorMessage.includes("auth") || errorMessage.includes("401")) {
        Alert.alert(
          "Authentication Required",
          "Your session has expired. Please sign in again.",
          [
            { text: "OK", onPress: () => router.push("/(auth)/signin") }
          ]
        );
      } else if (isTimeout) {
        Alert.alert(
          "Save Timeout",
          "Save is taking longer than expected. Your note may still be saved. Please check your notes in a moment.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Failed to Save",
          errorMessage || "Could not connect to server. Make sure the backend is running and check your network connection.",
          [{ text: "OK" }]
        );
      }
    } finally {
      // Always reset saving flag
      savingRef.current = false;
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
    <SafeAreaView className="flex-1" edges={['top', 'left', 'right']} style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "#FFFFFF" : "#34C759"}
              colors={["#34C759"]}
            />
          }
        >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={Keyboard.dismiss}
          className="flex-1"
        >
        <View className="flex-1 px-6">
          {/* Header - Clean minimalist design with greeting */}
          <View className="pt-8 pb-6 flex-row items-start justify-between" style={{
            marginHorizontal: -24,
            paddingHorizontal: 24,
            minHeight: 80,
          }}>
            <View className="flex-1" style={{ paddingRight: 12 }}>
              <Text className="text-3xl font-bold text-black dark:text-white">
                Hi {getUserName()}
              </Text>
              <Text className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Record or type your thoughts
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              className="p-2"
              style={{ marginTop: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="settings-outline" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
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
                      {/* Auto-categorize (Default) - Colorful gradient style */}
                      <TouchableOpacity
                        onPress={() => setSelectedClusterId(null)}
                        className="px-5 py-3 rounded-full mr-3"
                        style={{
                          backgroundColor: selectedClusterId === null ? "#34C759" : (isDark ? "#1C1C1E" : "#F5F5F7"),
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          className="text-sm font-semibold"
                          style={{
                            color: selectedClusterId === null ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#000000"),
                          }}
                        >
                          ✨ Auto
                        </Text>
                      </TouchableOpacity>

                      {/* Category Options - Colorful pills */}
                      {clusters.slice(0, 10).map((cluster, index) => {
                        const colors = [
                          "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", 
                          "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
                        ];
                        const color = colors[index % colors.length];
                        const isSelected = selectedClusterId === cluster.id;
                        
                        return (
                          <TouchableOpacity
                            key={cluster.id}
                            onPress={() => setSelectedClusterId(cluster.id)}
                            className="px-5 py-3 rounded-full mr-3"
                            style={{
                              backgroundColor: isSelected ? color : (isDark ? "#1C1C1E" : "#F5F5F7"),
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              className="text-sm font-semibold"
                              style={{
                                color: isSelected ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#000000"),
                              }}
                            >
                              {cluster.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      
                      {/* Plus button to add new category */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowNewClusterModal(true);
                        }}
                        className="px-5 py-3 rounded-full mr-3 border-2 items-center justify-center"
                        style={{
                          borderColor: isDark ? "#8E8E93" : "#D1D1D6",
                          backgroundColor: "transparent",
                          minWidth: 44,
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name="add" 
                          size={20} 
                          color={isDark ? "#8E8E93" : "#8E8E93"} 
                        />
                      </TouchableOpacity>
                    </ScrollView>
                  </View>

                  {/* Save Button - Modern Apple style */}
                  <TouchableOpacity
                    onPress={handleSaveText}
                    className="w-full py-4 rounded-2xl flex-row items-center justify-center"
                    style={{ 
                      backgroundColor: "#34C759",
                      shadowColor: "#34C759",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    activeOpacity={0.8}
                    disabled={status === "saved" || isAssigningCategory || savingRef.current || isCategorizing}
                  >
                    {(status === "saved" || isAssigningCategory || isCategorizing) ? (
                      <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-base">
                          {isCategorizing ? "Suggesting category..." : isAssigningCategory ? "Assigning..." : "Saving..."}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white font-bold text-base">Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Voice Recording */}
          {true && (
            <>
              {/* Divider - Minimalist */}
              <View className="flex-row items-center mb-8">
                <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <Text className="mx-4 text-xs text-gray-400 dark:text-gray-500 font-medium">OR</Text>
                <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </View>

              {/* Record Button Container */}
              <View className="py-6 items-center" style={{ minHeight: 200 }}>
                <View className="items-center">
                  {/* Status Text */}
                  {status !== "idle" && (
                    <View className="items-center mb-6">
                      <Text className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        {status === "recording" && `Recording... ${formatTime(recordingTime)}`}
                        {status === "transcribing" && "Transcribing..."}
                        {status === "saved" && !isAssigningCategory && "✓ Idea saved!"}
                        {isAssigningCategory && "Assigning category..."}
                      </Text>
                      {isCategorizing && status === "idle" && (
                        <View className="flex-row items-center mt-2">
                          <ActivityIndicator size="small" color="#34C759" style={{ marginRight: 8 }} />
                          <Text className="text-sm text-gray-500 dark:text-gray-400">
                            Suggesting category...
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Record Button with gradient - fixed position */}
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      position: 'relative',
                    }}
                  >
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
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                      activeOpacity={1}
                      delayPressIn={0}
                      delayPressOut={0}
                      disabled={status === "transcribing" || status === "saved"}
                    >
                      <Ionicons
                        name={isRecording ? "stop" : "mic"}
                        size={48}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>

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
                    className="bg-white dark:bg-gray-900 rounded-2xl p-5 mb-3"
                    style={{
                      shadowColor: isDark ? "#000" : "#34C759",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                      borderWidth: isDark ? 1 : 0,
                      borderColor: isDark ? "#2C2C2E" : "transparent",
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        {clusterLabel && (
                          <View className="rounded-full px-3 py-1.5 mr-2" style={{
                            backgroundColor: "#34C759",
                          }}>
                            <Text className="text-xs font-semibold text-white">
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
                        <Ionicons name="musical-notes" size={18} color="#FF6B6B" />
                        <Text className="text-sm text-gray-500 dark:text-gray-400 ml-2 font-medium">
                          {idea.transcriptionError ? `Error: ${idea.transcriptionError.substring(0, 50)}...` : "Transcribing audio..."}
                        </Text>
                      </View>
                    ) : idea.transcript && idea.transcript.trim() ? (
                      <Text
                        className="text-base text-black dark:text-white leading-6"
                        numberOfLines={2}
                        style={{ fontWeight: '500' }}
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
                style={{ 
                  backgroundColor: (!newClusterName.trim() || isCreatingCategory) ? "#9CA3AF" : "#34C759",
                  opacity: (!newClusterName.trim() || isCreatingCategory) ? 0.6 : 1
                }}
                disabled={!newClusterName.trim() || isCreatingCategory}
              >
                {isCreatingCategory ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text className="text-white font-semibold">Creating...</Text>
                  </View>
                ) : (
                <Text className="text-white font-semibold">Create</Text>
                )}
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
          setShowCategoryPickerInModal(false);
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
            {!showCategoryPickerInModal ? (
              <>
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
                      // Prevent double-clicks
                      if (isAssigningCategory) return;
                      
                  // User approves suggested category (with edited name if changed)
                  const categoryName = editableCategoryName.trim() || suggestedCategoryLabel || "New Category";
                  if (pendingIdeaId && categoryName) {
                    try {
                          setIsAssigningCategory(true);
                          // Wait for sync to complete since we need the real cluster ID for assignment
                          const newCluster = await createCluster(categoryName, true);
                      await assignIdeaToCluster(newCluster.id, pendingIdeaId);
                      await refetch();
                      await refetchClusters();
                          
                          // Close modal on success
                          setShowSuggestedCategoryModal(false);
                          setShowCategoryPickerInModal(false);
                          setSuggestedCategoryLabel(null);
                          setEditableCategoryName("");
                          setPendingIdeaId(null);
                          setStatus("saved"); // Mark as saved after category approval
                          setTimeout(() => setStatus("idle"), 2000);
                    } catch (err) {
                      console.error("Failed to create and assign cluster:", err);
                          const errorMessage = err instanceof Error ? err.message : "Failed to create category";
                          
                          // Handle duplicate error gracefully
                          if (errorMessage.includes("already exists")) {
                            // Find existing cluster and assign to it
                            const existingCluster = clusters.find(c => 
                              c.label.toLowerCase() === categoryName.toLowerCase()
                            );
                            if (existingCluster && !existingCluster.id.startsWith('cat-')) {
                              try {
                                await assignIdeaToCluster(existingCluster.id, pendingIdeaId);
                                await refetch();
                                await refetchClusters();
                  setShowSuggestedCategoryModal(false);
                                setShowCategoryPickerInModal(false);
                  setSuggestedCategoryLabel(null);
                  setEditableCategoryName("");
                  setPendingIdeaId(null);
                                setStatus("saved"); // Mark as saved after category assignment
                                setTimeout(() => setStatus("idle"), 2000);
                                return; // Success, exit early
                              } catch (assignErr) {
                                Alert.alert("Error", "Category exists but failed to assign idea");
                                setStatus("idle");
                              }
                            } else {
                              Alert.alert("Info", "Category already exists. Please select it from the list.");
                              setStatus("idle");
                            }
                          } else {
                            Alert.alert("Error", errorMessage);
                            setStatus("idle");
                          }
                        } finally {
                          setIsAssigningCategory(false);
                        }
                      }
                }}
                    disabled={isAssigningCategory}
                className="flex-1 px-6 py-3 rounded-xl"
                    style={{ 
                      backgroundColor: isAssigningCategory ? "#9CA3AF" : "#34C759",
                      opacity: isAssigningCategory ? 0.6 : 1
                    }}
              >
                    {isAssigningCategory ? (
                      <View className="flex-row items-center justify-center">
                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text className="text-white font-semibold text-center">Creating...</Text>
                      </View>
                    ) : (
                <Text className="text-white font-semibold text-center">Create Category</Text>
                    )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={async () => {
                    // Ensure clusters are loaded before showing picker
                    await refetchClusters();
                    // Show category picker
                    setShowCategoryPickerInModal(true);
              }}
                  className="px-6 py-3 rounded-xl border-2 mb-3"
              style={{ borderColor: "#34C759" }}
            >
              <Text className="text-green-600 dark:text-green-400 font-semibold text-center">
                Choose Existing Category
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  // User wants to categorize later - save first, then allow categorization later
                  if (pendingIdeaId) {
                    // Mark as saved, but keep idea ID for later categorization
                    setShowSuggestedCategoryModal(false);
                    setShowCategoryPickerInModal(false);
                    setSuggestedCategoryLabel(null);
                    setEditableCategoryName("");
                    // Don't clear pendingIdeaId - user can categorize later from idea detail page
                    setStatus("saved");
                    setTimeout(() => setStatus("idle"), 2000);
                    refetch();
                  }
                }}
                className="flex-1 px-6 py-3 rounded-xl border-2"
                style={{ borderColor: "#34C759" }}
              >
                <Text className="text-green-600 dark:text-green-400 text-center text-sm font-semibold">
                  Categorize Later
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  // User skips categorization completely
                  setShowSuggestedCategoryModal(false);
                  setShowCategoryPickerInModal(false);
                  setSuggestedCategoryLabel(null);
                  setEditableCategoryName("");
                  setPendingIdeaId(null);
                  setStatus("saved"); // Mark as saved even when skipping category
                  setTimeout(() => setStatus("idle"), 2000);
                  refetch();
                }}
                className="px-6 py-3"
              >
                <Text className="text-gray-500 dark:text-gray-400 text-center text-sm">
                  Skip
                </Text>
              </TouchableOpacity>
            </View>
              </>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold text-black dark:text-white">
                    Select Category
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCategoryPickerInModal(false)}
                    className="p-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
                </View>
                
                <ScrollView 
                  className="mb-4"
                  style={{ maxHeight: 400 }}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {isAssigningCategory ? (
                    <View className="py-8 items-center">
                      <ActivityIndicator size="large" color="#34C759" />
                      <Text className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Assigning category...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={async () => {
                          // Unassign category (set to null)
                          if (pendingIdeaId) {
                            try {
                              setIsAssigningCategory(true);
                              await apiClient.put(API_ENDPOINTS.ideas.update(pendingIdeaId), {
                                clusterId: null,
                              });
                              await refetch();
                              await refetchClusters();
                              setShowSuggestedCategoryModal(false);
                              setShowCategoryPickerInModal(false);
                              setSuggestedCategoryLabel(null);
                              setEditableCategoryName("");
                              setPendingIdeaId(null);
                              setStatus("saved"); // Mark as saved after removing category
                              setTimeout(() => setStatus("idle"), 2000);
                            } catch (err) {
                              Alert.alert("Error", err instanceof Error ? err.message : "Failed to remove category");
                            } finally {
                              setIsAssigningCategory(false);
                            }
                          }
                        }}
                        className="py-3 px-4 rounded-xl mb-2"
                        style={{ backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }}
                        disabled={isAssigningCategory}
                      >
                        <Text className="text-base text-black dark:text-white">Uncategorized</Text>
                      </TouchableOpacity>
                      {/* Show ALL clusters (excluding temporary 'cat-' prefixed ones) */}
                      {clusters.filter(c => !c.id.startsWith('cat-')).map((cluster) => (
                        <TouchableOpacity
                          key={cluster.id}
                          onPress={async () => {
                            if (pendingIdeaId && !isAssigningCategory) {
                              try {
                                setIsAssigningCategory(true);
                                await assignIdeaToCluster(cluster.id, pendingIdeaId);
                                await refetch();
                                await refetchClusters();
                                setShowSuggestedCategoryModal(false);
                                setShowCategoryPickerInModal(false);
                                setSuggestedCategoryLabel(null);
                                setEditableCategoryName("");
                                setPendingIdeaId(null);
                                setStatus("saved"); // Mark as saved after category assignment
                                setTimeout(() => setStatus("idle"), 2000);
                              } catch (err) {
                                Alert.alert("Error", err instanceof Error ? err.message : "Failed to assign category");
                              } finally {
                                setIsAssigningCategory(false);
                              }
                            }
                          }}
                          className="py-3 px-4 rounded-xl mb-2"
                          style={{ backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }}
                          disabled={isAssigningCategory}
                        >
                          <Text className="text-base text-black dark:text-white">{cluster.label}</Text>
                        </TouchableOpacity>
                      ))}
                      {clusters.filter(c => !c.id.startsWith('cat-')).length === 0 && (
                        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          No categories yet. Create one first!
                        </Text>
                      )}
                    </>
                  )}
                </ScrollView>
                
                {/* Debug info - shows total categories available */}
                {__DEV__ && (
                  <Text className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                    Total categories: {clusters.filter(c => !c.id.startsWith('cat-')).length}
                  </Text>
                )}

                <TouchableOpacity
                  onPress={() => {
                    setShowSuggestedCategoryModal(false);
                    setShowCategoryPickerInModal(false);
                    setSuggestedCategoryLabel(null);
                    setEditableCategoryName("");
                    setPendingIdeaId(null);
                  }}
                  className="px-6 py-3 rounded-xl"
                  style={{ backgroundColor: "#F2F2F7" }}
                >
                  <Text className="text-center text-gray-700 dark:text-gray-300 font-semibold">Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

