/**
 * Profile tab - Stats and settings
 */

import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { useUserStats } from "@/hooks/use-user-stats";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { stats, isLoading } = useUserStats();

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
            <Text className="text-base text-gray-600 dark:text-gray-400">
              {user.email}
            </Text>
          )}
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
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#8E8E93" />
              <Text className="text-base text-black dark:text-white ml-3">
                Notifications
              </Text>
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
    </SafeAreaView>
  );
}

