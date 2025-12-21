/**
 * Profile tab - Stats and settings
 */

import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, useColorScheme, Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { useUserStats } from "@/hooks/use-user-stats";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, checkAuth } = useAuthStore();
  const { stats, isLoading } = useUserStats();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("General");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  useEffect(() => {
    if (showNameEditModal) {
      setDisplayName(user?.name || user?.email?.split("@")[0] || "");
    }
  }, [showNameEditModal, user]);

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty");
      return;
    }

    setIsUpdatingName(true);
    try {
      await supabase.auth.updateUser({
        data: {
          name: displayName.trim(),
          full_name: displayName.trim(),
        },
      });
      await checkAuth();
      setShowNameEditModal(false);
      Alert.alert("Success", "Display name updated!");
    } catch (error) {
      console.error("Error updating display name:", error);
      Alert.alert("Error", "Failed to update display name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/signin");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    // First confirmation
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone. All your data (ideas, todos, categories) will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: () => {
            // Second confirmation - double check
            Alert.alert(
              "Final Confirmation",
              "This is your last chance. Are you absolutely certain you want to permanently delete your account? This action cannot be reversed.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Forever",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      // Call backend to delete account
                      await apiClient.delete(API_ENDPOINTS.user.delete);
                      
                      // Sign out and clear local data
                      await signOut();
                      
                      Alert.alert(
                        "Account Deleted",
                        "Your account has been successfully deleted.",
                        [
                          {
                            text: "OK",
                            onPress: () => {
                              router.replace("/(auth)/signin");
                            },
                          },
                        ]
                      );
                    } catch (error) {
                      console.error("Delete account error:", error);
                      Alert.alert(
                        "Error",
                        "Failed to delete account. Please try again or contact support."
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert("Error", "Please enter your feedback message");
      return;
    }

    setIsSendingFeedback(true);
    try {
      await apiClient.post(API_ENDPOINTS.feedback.send, {
        subject: feedbackSubject.trim() || undefined,
        message: feedbackMessage.trim(),
        type: feedbackType,
      });
      
      Alert.alert(
        "Thank You!",
        "Your feedback has been sent successfully. We'll get back to you soon.",
        [
          {
            text: "OK",
            onPress: () => {
              setShowFeedbackModal(false);
              setFeedbackSubject("");
              setFeedbackMessage("");
              setFeedbackType("General");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Send feedback error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to send feedback. Please try again later."
      );
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const isDark = useColorScheme() === "dark";
  
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
      <ScrollView className="flex-1 px-6">
        {/* Header */}
        <View className="pt-6 pb-6">
          <Text className="text-3xl font-bold text-black dark:text-white mb-2">
            Profile
          </Text>
          {user && (
            <>
              <Text className="text-base text-gray-600 dark:text-gray-400 mb-1">
                {user.name || user.email?.split("@")[0] || "User"}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-500">
                {user.email}
              </Text>
            </>
          )}
        </View>

        {/* Display Name Section */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => {
              setDisplayName(user?.name || user?.email?.split("@")[0] || "");
              setShowNameEditModal(true);
            }}
            className="bg-white dark:bg-card-dark rounded-xl p-4 flex-row items-center justify-between"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Display Name
              </Text>
              <Text className="text-base font-medium text-black dark:text-white">
                {user?.name || user?.email?.split("@")[0] || "Not set"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? "#8E8E93" : "#8E8E93"} />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-black dark:text-white mb-4">
            Your Stats
          </Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#34C759" />
          ) : stats ? (
            <View className="bg-white dark:bg-card-dark rounded-xl p-5"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-3xl font-bold text-black dark:text-white">
                    {stats.totalIdeas}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Total Ideas
                  </Text>
                </View>
                <View>
                  <Text className="text-3xl font-bold text-black dark:text-white">
                    {stats.ideasThisMonth}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    This Month
                  </Text>
                </View>
                <View>
                  <Text className="text-3xl font-bold text-black dark:text-white">
                    {stats.averagePerDay.toFixed(1)}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Per Day
                  </Text>
                </View>
              </View>
              {stats.topCategory && (
                <View className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Top Category
                  </Text>
                  <Text className="text-lg font-semibold text-black dark:text-white">
                    {stats.topCategory.label} ({stats.topCategory.count})
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text className="text-gray-500 dark:text-gray-400">
              No stats available yet
            </Text>
          )}
        </View>

        {/* Support Section - Hidden for now */}
        {false && (
          <View className="mb-8">
            <Text className="text-lg font-semibold text-black dark:text-white mb-4">
              Support
            </Text>

            <TouchableOpacity 
              onPress={() => setShowFeedbackModal(true)}
              className="bg-white dark:bg-card-dark rounded-xl p-4 mb-3 flex-row items-center justify-between"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="mail" size={20} color="#34C759" />
                <Text className="text-base text-black dark:text-white ml-3">
                  Send Feedback
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-black dark:text-white mb-4">
            Settings
          </Text>

          <TouchableOpacity 
            className="bg-white dark:bg-card-dark rounded-xl p-4 mb-3 flex-row items-center justify-between"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="language" size={20} color="#8E8E93" />
              <Text className="text-base text-black dark:text-white ml-3">
                Language
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                English
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </View>
          </TouchableOpacity>


          <TouchableOpacity 
            className="bg-white dark:bg-card-dark rounded-xl p-4 mb-3 flex-row items-center justify-between"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="notifications" size={20} color="#8E8E93" />
              <View className="ml-3 flex-1">
                <Text className="text-base text-black dark:text-white">
                  Notifications
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  To-do reminders
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Data Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-black dark:text-white mb-4">
            Data
          </Text>

          {/* Export Ideas - Hidden for now */}
          {false && (
            <TouchableOpacity 
              className="bg-white dark:bg-card-dark rounded-xl p-4 mb-3 flex-row items-center justify-between"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="download" size={20} color="#8E8E93" />
                <Text className="text-base text-black dark:text-white ml-3">
                  Export Ideas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={handleDeleteAccount}
            className="bg-white dark:bg-card-dark rounded-xl p-4 mb-3 flex-row items-center justify-between"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="trash" size={20} color="#FF3B30" />
              <Text className="text-base text-red-600 dark:text-red-400 ml-3">
                Delete Account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="rounded-xl py-4 items-center justify-center mb-8"
          style={{
            backgroundColor: "#34C759",
            shadowColor: "#34C759",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text className="text-white text-base font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowFeedbackModal(false);
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
              setShowFeedbackModal(false);
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
                  Send Feedback
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowFeedbackModal(false);
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
                {/* Feedback Type */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </Text>
                  <View className="flex-row gap-2">
                    {["General", "Bug Report", "Feature Request", "Question"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setFeedbackType(type)}
                        className="px-4 py-2 rounded-full"
                        style={{
                          backgroundColor:
                            feedbackType === type
                              ? "#34C759"
                              : isDark
                              ? "#2C2C2E"
                              : "#F2F2F7",
                        }}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{
                            color: feedbackType === type ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#000000"),
                          }}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Subject */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject (Optional)
                  </Text>
                  <TextInput
                    className="bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-black dark:text-white"
                    placeholder="Brief description..."
                    placeholderTextColor="#9CA3AF"
                    value={feedbackSubject}
                    onChangeText={setFeedbackSubject}
                    returnKeyType="next"
                  />
                </View>

                {/* Message */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </Text>
                  <TextInput
                    className="bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-black dark:text-white"
                    placeholder="Tell us what you think..."
                    placeholderTextColor="#9CA3AF"
                    value={feedbackMessage}
                    onChangeText={setFeedbackMessage}
                    multiline
                    textAlignVertical="top"
                    style={{ minHeight: 150 }}
                    returnKeyType="default"
                    blurOnSubmit={false}
                  />
                </View>
              </ScrollView>

              <View className="flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowFeedbackModal(false);
                  }}
                  className="px-6 py-3 rounded-xl"
                  style={{ backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }}
                  activeOpacity={0.7}
                  disabled={isSendingFeedback}
                >
                  <Text className="text-gray-700 dark:text-gray-300 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSendFeedback}
                  className="px-6 py-3 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: "#34C759" }}
                  disabled={!feedbackMessage.trim() || isSendingFeedback}
                  activeOpacity={0.7}
                >
                  {isSendingFeedback ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-semibold">Send</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Display Name Edit Modal */}
      <Modal
        visible={showNameEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNameEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setShowNameEditModal(false)}
          />
          <View
            className="bg-white dark:bg-[#1C1C1E] rounded-t-3xl px-6 pt-6 pb-8"
            style={{
              maxHeight: "50%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-black dark:text-white">
                Change Display Name
              </Text>
              <TouchableOpacity
                onPress={() => setShowNameEditModal(false)}
                className="p-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>

            <TextInput
              className="bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-black dark:text-white mb-6"
              placeholder="Enter your display name"
              placeholderTextColor="#9CA3AF"
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleUpdateDisplayName}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowNameEditModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border-2"
                style={{ borderColor: isDark ? "#8E8E93" : "#D1D1D6" }}
              >
                <Text className="text-center font-semibold" style={{ color: isDark ? "#FFFFFF" : "#000000" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateDisplayName}
                className="flex-1 px-6 py-3 rounded-xl"
                style={{
                  backgroundColor: isUpdatingName ? "#9CA3AF" : "#34C759",
                  opacity: isUpdatingName ? 0.6 : 1,
                }}
                disabled={isUpdatingName}
              >
                {isUpdatingName ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-center font-semibold text-white">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

