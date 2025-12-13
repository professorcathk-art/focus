/**
 * Sign up screen
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuthStore();

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Please fill in email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signUp(email, password, name || undefined);
      // If we get here, user is signed in (email confirmation disabled)
      router.replace("/(tabs)/record");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign up failed";
      setError(errorMessage);
      
      // If email confirmation is required, show helpful message
      if (errorMessage.includes("check your email") || errorMessage.includes("confirm") || errorMessage.includes("Account created")) {
        Alert.alert(
          "Check Your Email",
          "We've sent you a confirmation email. Please click the link in the email to verify your account, then you can sign in.",
          [
            { 
              text: "OK", 
              onPress: () => {
                // Navigate to sign in page after alert
                router.replace("/(auth)/signin");
              }
            }
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      // OAuth will handle redirect, session will be set via auth state listener
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <Pressable onPress={Keyboard.dismiss} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            contentContainerClassName="py-8"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View className="mb-12">
            <Text className="text-4xl font-bold text-black dark:text-white mb-2">
              Create account
            </Text>
            <Text className="text-lg text-gray-600 dark:text-gray-400">
              Start capturing your ideas instantly
            </Text>
          </View>

          {error && (
            <View className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <Text className="text-red-600 dark:text-red-400">{error}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name (Optional)
            </Text>
            <TextInput
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base text-black dark:text-white"
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </Text>
            <TextInput
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base text-black dark:text-white"
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </Text>
            <TextInput
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base text-black dark:text-white"
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center justify-center mb-4"
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            <Text className="mx-4 text-xs text-gray-500 dark:text-gray-400">OR</Text>
            <View className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl py-4 items-center justify-center mb-4 flex-row"
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="logo-google" size={20} color="#4285F4" style={{ marginRight: 8 }} />
            <Text className="text-gray-900 dark:text-white text-base font-semibold">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text className="text-primary font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
}

