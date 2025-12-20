/**
 * Sign in screen
 */

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  ScrollView,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";

const { width, height } = Dimensions.get("window");

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log("[SignIn] Already authenticated, redirecting...");
      router.replace("/(tabs)/record");
    }
  }, [isAuthenticated, authLoading, router]);
  
  // Check if Apple Sign-In is available
  useEffect(() => {
    const checkAppleAuth = async () => {
      if (Platform.OS === 'ios') {
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          setIsAppleAvailable(available);
        } catch (error) {
          console.log("[SignIn] Apple Sign-In not available:", error);
          setIsAppleAvailable(false);
        }
      }
    };
    checkAppleAuth();
  }, []);
  
  // Don't render if already authenticated
  if (!authLoading && isAuthenticated) {
    return <Redirect href="/(tabs)/record" />;
  }
  
  // Animation values for fluid green elements
  const flow1 = useRef(new Animated.Value(0)).current;
  const flow2 = useRef(new Animated.Value(0)).current;
  const flow3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Create smooth flowing animation for green fluid elements
    const createFlow = (animValue: Animated.Value, duration: number, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };
    
    Animated.parallel([
      createFlow(flow1, 12000, 0),
      createFlow(flow2, 15000, 2000),
      createFlow(flow3, 18000, 4000),
    ]).start();
  }, []);
  
  // Interpolate positions for fluid movement
  const flow1X = flow1.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.5, width * 0.5],
  });
  
  const flow1Y = flow1.interpolate({
    inputRange: [0, 1],
    outputRange: [-height * 0.3, height * 0.7],
  });
  
  const flow2X = flow2.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.5, -width * 0.5],
  });
  
  const flow2Y = flow2.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.7, -height * 0.3],
  });
  
  const flow3X = flow3.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.4, width * 0.6],
  });
  
  const flow3Y = flow3.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.5, -height * 0.5],
  });

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      router.replace("/(tabs)/record");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      // OAuth opens browser for Google sign-in
      // After sign-in, browser redirects back to app
      // Session will be set via onAuthStateChange listener in auth-store
      // Keep loading state - will be cleared when auth state changes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithApple();
      router.replace("/(tabs)/record");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Apple sign in failed";
      // Don't show error if user cancelled
      if (!errorMessage.includes("cancelled")) {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Gradient Background matching onboarding style */}
      <LinearGradient
        colors={["#A8E6CF", "#88D8C0", "#7EC8E3", "#4ECDC4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      
      <SafeAreaView className="flex-1">
        {/* Back button to onboarding */}
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/onboarding")}
          className="absolute top-12 left-6 z-10 px-4 py-2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Pressable 
          onPress={Keyboard.dismiss}
          className="flex-1"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 px-6 justify-center"
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Branding Section */}
              <View className="mb-12 items-center">
            <Text className="text-6xl font-bold text-white mb-4" style={{
              textShadowColor: "rgba(0, 0, 0, 0.3)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 8,
              letterSpacing: 2,
            }}>
              Focus
            </Text>
            <Text className="text-xl text-white/90 text-center px-4" style={{
              textShadowColor: "rgba(0, 0, 0, 0.2)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}>
              Ready to stay focused?
            </Text>
            <Text className="text-base text-white/80 text-center mt-2 px-4" style={{
              textShadowColor: "rgba(0, 0, 0, 0.2)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}>
              Capture your ideas instantly
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white/95 rounded-3xl p-6 shadow-2xl" style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}>
            {error && (
              <View className="mb-4 p-4 bg-red-50 rounded-xl">
                <Text className="text-red-600 text-center">{error}</Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Email
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-black"
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isLoading}
                returnKeyType="next"
                blurOnSubmit={false}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  paddingVertical: 12,
                  lineHeight: 20,
                  minHeight: 48,
                }}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Password
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-black"
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!isLoading}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  paddingVertical: 12,
                  lineHeight: 20,
                  minHeight: 48,
                }}
              />
            </View>

            <TouchableOpacity
              className="rounded-xl py-4 items-center justify-center mb-4"
              onPress={handleSignIn}
              disabled={isLoading}
              style={{
                backgroundColor: "#34C759",
                shadowColor: "#34C759",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-bold">Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center mb-4">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-xs text-gray-500">OR</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              className="bg-white border border-gray-300 rounded-xl py-4 items-center justify-center mb-4 flex-row"
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
              <Text className="text-gray-900 text-base font-semibold">
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Apple Sign In Button (iOS only) */}
            {isAppleAvailable && (
              <TouchableOpacity
                className="bg-black rounded-xl py-4 items-center justify-center mb-4 flex-row"
                onPress={handleAppleSignIn}
                disabled={isLoading}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text className="text-white text-base font-semibold">
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            )}

            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600">
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup")}
                disabled={isLoading}
              >
                <Text className="text-[#34C759] font-bold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

