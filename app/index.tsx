/**
 * Root index - redirects to auth or tabs based on auth state
 */

import { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth-store";

export default function Index() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const hasCheckedRef = useRef(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Check auth status on mount (only once)
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && !shouldRedirect) {
      // Longer delay to ensure auth state and navigation stack are fully settled
      // This prevents crashes from race conditions and navigation conflicts
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 500); // Increased delay to 500ms for better stability
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, shouldRedirect]);

  // Don't redirect while loading or if we haven't checked yet
  if (isLoading || !hasCheckedRef.current) {
    return null; // TODO: Add loading screen
  }

  if (isAuthenticated) {
    // Wait for redirect flag to prevent race conditions
    if (!shouldRedirect) {
      // Show loading indicator while waiting
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
          <ActivityIndicator size="large" color="#34C759" />
        </View>
      );
    }
    
    // Use try-catch to prevent crashes
    try {
      return <Redirect href="/(tabs)/record" />;
    } catch (err) {
      console.error("[Index] Redirect error:", err);
      // Fallback: try again after a delay
      setTimeout(() => {
        setShouldRedirect(false);
      }, 1000);
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
          <ActivityIndicator size="large" color="#34C759" />
        </View>
      );
    }
  }

  // Check if user has seen onboarding
  // For now, always show onboarding first time
  // TODO: Add AsyncStorage check to skip onboarding after first time
  try {
    return <Redirect href="/(auth)/onboarding" />;
  } catch (err) {
    console.error("[Index] Redirect to onboarding error:", err);
    return null;
  }
}

