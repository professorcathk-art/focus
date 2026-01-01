/**
 * DISABLED: This page is replaced by Tasks page
 * All functionality has been moved to app/(tabs)/tasks.tsx
 */

import { useAuthStore } from "@/store/auth-store";

export default function TodoScreen() {
  // DISABLED: This page is replaced by Tasks page
  // Return early to prevent any code execution and crashes
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return null;
  }
  
  // Even if authenticated, return null to prevent crashes
  // Users should use the Tasks page instead
  return null;
}
