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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn } = useAuthStore();
  
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

  return (
    <View className="flex-1">
      {/* Light Blue Base Background */}
      <LinearGradient
        colors={["#E3F2FD", "#BBDEFB", "#90CAF9", "#64B5F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      
      {/* Flowing Green Fluid Element 1 */}
      <Animated.View
        style={{
          position: "absolute",
          width: width * 1.2,
          height: height * 0.8,
          borderRadius: width * 0.6,
          transform: [
            { translateX: flow1X },
            { translateY: flow1Y },
            { rotate: "45deg" },
          ],
          opacity: 0.4,
        }}
      >
        <LinearGradient
          colors={["#34C759", "#30D158", "#5FE27A", "#34C759"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: width * 0.6 }}
        />
      </Animated.View>
      
      {/* Flowing Green Fluid Element 2 */}
      <Animated.View
        style={{
          position: "absolute",
          width: width * 1.0,
          height: height * 0.6,
          borderRadius: width * 0.5,
          transform: [
            { translateX: flow2X },
            { translateY: flow2Y },
            { rotate: "-30deg" },
          ],
          opacity: 0.35,
        }}
      >
        <LinearGradient
          colors={["#5FE27A", "#34C759", "#30D158", "#5FE27A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: width * 0.5 }}
        />
      </Animated.View>
      
      {/* Flowing Green Fluid Element 3 */}
      <Animated.View
        style={{
          position: "absolute",
          width: width * 0.9,
          height: height * 0.7,
          borderRadius: width * 0.45,
          transform: [
            { translateX: flow3X },
            { translateY: flow3Y },
            { rotate: "60deg" },
          ],
          opacity: 0.3,
        }}
      >
        <LinearGradient
          colors={["#30D158", "#5FE27A", "#34C759", "#30D158"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: width * 0.45 }}
        />
      </Animated.View>
      
      {/* Subtle overlay for depth */}
      <LinearGradient
        colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)", "rgba(255,255,255,0.1)"]}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 px-6 justify-center"
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
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
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
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

