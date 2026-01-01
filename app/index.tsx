/**
 * Root index - redirects to auth or tabs based on auth state
 */

import { useEffect, useRef, useState } from "react";
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

  // Don't redirect while loading or if we haven't checked yet
  if (isLoading || !hasCheckedRef.current) {
    return null; // TODO: Add loading screen
  }

  useEffect(() => {
    if (isAuthenticated && !shouldRedirect) {
      // Small delay to ensure auth state is fully settled before navigation
      // This prevents crashes from race conditions
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, shouldRedirect]);

  if (isAuthenticated) {
    // Wait for redirect flag to prevent race conditions
    if (!shouldRedirect) {
      return null; // Wait for state to settle
    }
    
    // Use try-catch to prevent crashes
    try {
      return <Redirect href="/(tabs)/record" />;
    } catch (err) {
      console.error("[Index] Redirect error:", err);
      return null;
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

