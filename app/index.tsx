/**
 * Root index - redirects to auth or tabs based on auth state
 */

import { useEffect } from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth-store";

export default function Index() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check auth status on mount
    checkAuth();
  }, []);

  if (isLoading) {
    return null; // TODO: Add loading screen
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/record" />;
  }

  return <Redirect href="/(auth)/signin" />;
}

