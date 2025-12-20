/**
 * Root index - redirects to auth or tabs based on auth state
 */

import { useEffect, useRef } from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth-store";

export default function Index() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Check auth status on mount (only once)
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  // Don't redirect while loading or if we haven't checked yet
  if (isLoading || !hasCheckedRef.current) {
    return null; // TODO: Add loading screen
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/record" />;
  }

  // Check if user has seen onboarding
  // For now, always show onboarding first time
  // TODO: Add AsyncStorage check to skip onboarding after first time
  return <Redirect href="/(auth)/onboarding" />;
}

