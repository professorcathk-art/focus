/**
 * Todos cache using AsyncStorage for persistent local storage
 * Reduces API calls by caching todos locally, organized by date
 * Supports optimistic updates to prevent data loss
 * More reliable than SecureStore in Expo Go
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Todo } from "@/types";

const CACHE_PREFIX = "todos_cache_";
const CACHE_TIMESTAMP_PREFIX = "todos_cache_timestamp_";
const PENDING_TODOS_KEY_PREFIX = "pending_todos_"; // Todos waiting to sync to server (user-scoped)
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes cache expiry (longer for better performance)

interface CachedTodos {
  todos: Todo[];
  timestamp: number;
}

/**
 * In-memory cache for instant access (Tier 1)
 * Key: date string (yyyy-MM-dd), Value: { todos, timestamp }
 * Exported for cache clearing when date changes
 */
export const memoryCache = new Map<string, { todos: Todo[]; timestamp: number }>();

interface PendingTodo {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  dueDate?: string;
  createdAt: string;
  synced: boolean;
  error?: string;
  retryCount?: number;
  lastRetryAt?: string;
  operation: "create" | "update" | "delete";
}

/**
 * Get cache key for a specific date and user
 */
function getCacheKey(date: string, userId: string): string {
  return `${CACHE_PREFIX}${userId}_${date}`;
}

function getTimestampKey(date: string, userId: string): string {
  return `${CACHE_TIMESTAMP_PREFIX}${userId}_${date}`;
}

/**
 * Get todos from in-memory cache (Tier 1 - fastest)
 */
function getFromMemory(date: string, userId: string): Todo[] | null {
  const key = `${userId}_${date}`;
  const cached = memoryCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_EXPIRY_MS) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached.todos;
}

/**
 * Set todos in in-memory cache (Tier 1)
 */
function setInMemory(date: string, userId: string, todos: Todo[]): void {
  const key = `${userId}_${date}`;
  memoryCache.set(key, {
    todos,
    timestamp: Date.now(),
  });
}

/**
 * Get todos from cache for a specific date if not expired
 * Checks memory cache first, then AsyncStorage
 * REQUIRES userId to prevent cross-account data leakage
 */
export async function getCachedTodos(date: string, userId: string): Promise<Todo[] | null> {
  if (!userId) {
    console.warn("[Todos Cache] ⚠️ No userId provided, skipping cache");
    return null;
  }
  
  // Tier 1: Check in-memory cache first (instant)
  const memoryCached = getFromMemory(date, userId);
  if (memoryCached) {
    console.log(`[Todos Cache] ✅ Using memory cache for ${date} (user: ${userId.substring(0, 8)}..., ${memoryCached.length} todos)`);
    return memoryCached;
  }
  
  // Tier 2: Check AsyncStorage
  try {
    const cacheKey = getCacheKey(date, userId);
    const timestampKey = getTimestampKey(date, userId);
    
    // Use multiGet for better performance (single async call)
    // multiGet returns: [[key1, value1], [key2, value2], ...]
    const results = await AsyncStorage.multiGet([cacheKey, timestampKey]);
    
    // Extract values from results array
    const cachedValue = results.find(([key]) => key === cacheKey)?.[1] || null;
    const timestampValue = results.find(([key]) => key === timestampKey)?.[1] || null;
    
    if (!cachedValue || !timestampValue || cachedValue === 'null' || timestampValue === 'null') {
      return null;
    }
    
    // Validate timestamp is a valid number
    const timestamp = parseInt(timestampValue, 10);
    if (isNaN(timestamp)) {
      console.log(`[Todos Cache] Invalid timestamp for ${date} (user: ${userId.substring(0, 8)}...), clearing cache`);
      await clearCacheForDate(date, userId);
      return null;
    }
    
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRY_MS) {
      console.log(`[Todos Cache] Cache expired for ${date} (user: ${userId.substring(0, 8)}...), will fetch fresh data`);
      return null;
    }
    
    // Validate and parse JSON
    if (typeof cachedValue !== 'string' || cachedValue.trim() === '') {
      console.log(`[Todos Cache] Invalid cache data for ${date} (user: ${userId.substring(0, 8)}...), clearing cache`);
      await clearCacheForDate(date, userId);
      return null;
    }
    
    let cached: CachedTodos;
    try {
      cached = JSON.parse(cachedValue);
    } catch (parseError) {
      console.error(`[Todos Cache] JSON parse error for ${date} (user: ${userId.substring(0, 8)}...), clearing corrupted cache:`, parseError);
      await clearCacheForDate(date, userId);
      return null;
    }
    
    // Validate cached structure
    if (!cached || !Array.isArray(cached.todos)) {
      console.log(`[Todos Cache] Invalid cache structure for ${date} (user: ${userId.substring(0, 8)}...), clearing cache`);
      await clearCacheForDate(date, userId);
      return null;
    }
    
    console.log(`[Todos Cache] ✅ Using AsyncStorage cache for ${date} (user: ${userId.substring(0, 8)}..., ${cached.todos.length} todos, ${Math.round((now - timestamp) / 1000)}s old)`);
    
    // Update memory cache for next time
    setInMemory(date, userId, cached.todos);
    
    return cached.todos;
  } catch (error) {
    console.error("[Todos Cache] Error reading cache:", error);
    // Clear potentially corrupted cache
    try {
      await clearCacheForDate(date, userId);
    } catch (clearError) {
      console.error("[Todos Cache] Error clearing corrupted cache:", clearError);
    }
    return null;
  }
}

/**
 * Cache todos for a specific date
 * Updates both memory cache (Tier 1) and AsyncStorage (Tier 2)
 * REQUIRES userId to prevent cross-account data leakage
 */
export async function setCachedTodos(date: string, userId: string, todos: Todo[]): Promise<void> {
  if (!userId) {
    console.warn("[Todos Cache] ⚠️ No userId provided, skipping cache");
    return;
  }
  
  // Update memory cache immediately (Tier 1)
  setInMemory(date, userId, todos);
  
  // Update AsyncStorage in background (Tier 2)
  try {
    const cacheKey = getCacheKey(date, userId);
    const timestampKey = getTimestampKey(date, userId);
    const timestamp = Date.now();
    
    const cached: CachedTodos = {
      todos,
      timestamp,
    };
    
    // Use multiSet for better performance (single async call)
    await AsyncStorage.multiSet([
      [cacheKey, JSON.stringify(cached)],
      [timestampKey, timestamp.toString()],
    ]);
    console.log(`[Todos Cache] 💾 Cached ${todos.length} todos for ${date} (user: ${userId.substring(0, 8)}...)`);
  } catch (error) {
    console.error("[Todos Cache] Error caching todos:", error);
  }
}

/**
 * Get all pending todos (not yet synced to server)
 */
function getPendingTodosKey(userId: string): string {
  return `${PENDING_TODOS_KEY_PREFIX}${userId}`;
}

export async function getPendingTodos(userId: string): Promise<PendingTodo[]> {
  if (!userId) {
    console.warn("[Todos Cache] ⚠️ No userId provided, skipping pending todos");
    return [];
  }
  
  try {
    const pendingData = await AsyncStorage.getItem(getPendingTodosKey(userId));
    if (!pendingData) {
      return [];
    }
    return JSON.parse(pendingData);
  } catch (error) {
    console.error("[Todos Cache] Error reading pending todos:", error);
    return [];
  }
}

/**
 * Add a todo to pending queue (for offline support)
 * REQUIRES userId to prevent cross-account data leakage
 */
export async function addPendingTodo(todo: Todo, operation: "create" | "update" | "delete", userId: string): Promise<void> {
  if (!userId) {
    console.warn("[Todos Cache] ⚠️ No userId provided, skipping pending todo");
    return;
  }
  
  try {
    const pending = await getPendingTodos(userId);
    const pendingTodo: PendingTodo = {
      id: todo.id,
      text: todo.text,
      completed: todo.completed,
      date: todo.date,
      dueDate: todo.dueDate,
      createdAt: todo.createdAt,
      synced: false,
      operation,
    };
    
    // Remove existing pending todo with same ID if exists
    const filtered = pending.filter((p) => p.id !== todo.id);
    filtered.push(pendingTodo);
    
    await AsyncStorage.setItem(getPendingTodosKey(userId), JSON.stringify(filtered));
    console.log(`[Todos Cache] 📝 Added pending todo: ${operation} ${todo.id}`);
  } catch (error) {
    console.error("[Todos Cache] Error adding pending todo:", error);
  }
}

/**
 * Mark a pending todo as synced
 * REQUIRES userId to prevent cross-account data leakage
 */
export async function markTodoSynced(todoId: string, userId: string): Promise<void> {
  if (!userId) {
    console.warn("[Todos Cache] ⚠️ No userId provided, skipping mark synced");
    return;
  }
  
  try {
    const pending = await getPendingTodos(userId);
    const updated = pending.map((p) =>
      p.id === todoId ? { ...p, synced: true } : p
    );
    await AsyncStorage.setItem(getPendingTodosKey(userId), JSON.stringify(updated));
  } catch (error) {
    console.error("[Todos Cache] Error marking todo as synced:", error);
  }
}

/**
 * Remove a pending todo (after successful sync)
 */
export async function removePendingTodo(todoId: string, userId: string): Promise<void> {
  if (!userId) {
    console.warn("[Todos Cache] ⚠️ No userId provided, skipping remove pending todo");
    return;
  }
  
  try {
    const pending = await getPendingTodos(userId);
    const filtered = pending.filter((p) => p.id !== todoId);
    await AsyncStorage.setItem(getPendingTodosKey(userId), JSON.stringify(filtered));
  } catch (error) {
    console.error("[Todos Cache] Error removing pending todo:", error);
  }
}

/**
 * Get all todos for a date including pending ones
 * This merges cached todos with pending operations
 * Optimized to check memory cache first, then AsyncStorage
 * REQUIRES userId to prevent cross-account data leakage
 * ALWAYS filters by date to ensure accuracy
 */
export async function getAllTodosIncludingPending(date: string, userId: string): Promise<Todo[] | null> {
  if (!userId) {
    console.warn("[Todos Cache] ⚠️ No userId provided, skipping cache");
    return null;
  }
  
  try {
    // Check memory cache first (fastest)
    let cached = getFromMemory(date, userId);
    
    // If not in memory, check AsyncStorage
    if (!cached) {
      cached = await getCachedTodos(date, userId);
    }
    
    // CRITICAL: Filter cached todos by date to ensure accuracy
    // This prevents showing todos from wrong dates even if cache is corrupted
    if (cached) {
      const filteredCached = cached.filter(todo => todo.date === date);
      if (filteredCached.length !== cached.length) {
        console.warn(`[Todos Cache] ⚠️ Found ${cached.length - filteredCached.length} todos with wrong dates in cache for ${date}`);
        // Update cache with filtered data
        await setCachedTodos(date, userId, filteredCached);
        cached = filteredCached;
      }
    }
    
    // Get pending todos (usually empty, so this is fast)
    const pending = await getPendingTodos(userId);
    
    // Filter pending todos for this date AND ensure they match the date
    const pendingForDate = pending.filter(
      (p) => p.date === date && !p.synced
    );
    
    if (!cached && pendingForDate.length === 0) {
      return null;
    }
    
    let todos = cached || [];
    
    // Apply pending operations (usually none, so this is fast)
    for (const pendingTodo of pendingForDate) {
      // Double-check pending todo date matches requested date
      if (pendingTodo.date !== date) {
        console.warn(`[Todos Cache] ⚠️ Skipping pending todo ${pendingTodo.id} with wrong date: ${pendingTodo.date} (expected: ${date})`);
        continue;
      }
      
      if (pendingTodo.operation === "delete") {
        todos = todos.filter((t) => t.id !== pendingTodo.id);
      } else if (pendingTodo.operation === "update") {
        const index = todos.findIndex((t) => t.id === pendingTodo.id);
        if (index >= 0) {
          // Ensure updated todo still matches the date
          const updatedTodo = {
            ...todos[index],
            text: pendingTodo.text,
            completed: pendingTodo.completed,
            date: pendingTodo.date,
            dueDate: pendingTodo.dueDate,
          };
          if (updatedTodo.date === date) {
            todos[index] = updatedTodo;
          } else {
            console.warn(`[Todos Cache] ⚠️ Updated todo ${pendingTodo.id} has wrong date: ${updatedTodo.date} (expected: ${date})`);
            todos = todos.filter((t) => t.id !== pendingTodo.id);
          }
        }
      } else if (pendingTodo.operation === "create") {
        // Check if already exists (might have been synced)
        const exists = todos.some((t) => t.id === pendingTodo.id);
        if (!exists && pendingTodo.date === date) {
          todos.push({
            id: pendingTodo.id,
            text: pendingTodo.text,
            completed: pendingTodo.completed,
            date: pendingTodo.date,
            dueDate: pendingTodo.dueDate,
            createdAt: pendingTodo.createdAt,
          });
        }
      }
    }
    
    // FINAL FILTER: Always filter by date one more time before returning
    // This is a safety net to ensure no wrong-date todos slip through
    const finalTodos = todos.filter(todo => todo.date === date);
    
    if (finalTodos.length !== todos.length) {
      console.warn(`[Todos Cache] ⚠️ Final filter removed ${todos.length - finalTodos.length} todos with wrong dates`);
    }
    
    return finalTodos;
  } catch (error) {
    console.error("[Todos Cache] Error getting todos with pending:", error);
    return null;
  }
}

/**
 * Clear cache for a specific date and user
 */
export async function clearCacheForDate(date: string, userId: string): Promise<void> {
  if (!userId) {
    console.warn("[Todos Cache] ⚠️ No userId provided, skipping cache clear");
    return;
  }
  
  try {
    // Clear memory cache
    const key = `${userId}_${date}`;
    memoryCache.delete(key);
    
    // Clear AsyncStorage
    const cacheKey = getCacheKey(date, userId);
    const timestampKey = getTimestampKey(date, userId);
    
    // Use multiRemove for better performance
    const keysToRemove = [cacheKey, timestampKey].filter(Boolean);
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
    console.log(`[Todos Cache] 🗑️ Cleared cache for ${date} (user: ${userId.substring(0, 8)}...)`);
  } catch (error) {
    console.error("[Todos Cache] Error clearing cache:", error);
    // Don't throw - clearing cache should be safe even if it fails
  }
}

/**
 * Clear all cache for a specific user (useful when logging out)
 */
export async function clearAllCacheForUser(userId: string): Promise<void> {
  if (!userId) {
    console.warn("[Todos Cache] ⚠️ No userId provided, skipping cache clear");
    return;
  }
  
  try {
    // Clear all memory cache entries for this user
    const userPrefix = `${userId}_`;
    const keysToDelete: string[] = [];
    for (const key of memoryCache.keys()) {
      if (key.startsWith(userPrefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => memoryCache.delete(key));
    
    // Clear AsyncStorage entries for this user
    const allKeys = await AsyncStorage.getAllKeys();
    const userCacheKeys = allKeys.filter(
      (key) => (key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_TIMESTAMP_PREFIX)) && key.includes(`_${userId}_`)
    );
    
    if (userCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(userCacheKeys);
    }
    console.log(`[Todos Cache] 🗑️ Cleared all cache for user ${userId.substring(0, 8)}... (${userCacheKeys.length} keys)`);
  } catch (error) {
    console.error("[Todos Cache] Error clearing user cache:", error);
  }
}

/**
 * Clear all todos cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_TIMESTAMP_PREFIX)
    );
    await AsyncStorage.multiRemove(cacheKeys);
    console.log("[Todos Cache] 🗑️ Cleared all todos cache");
  } catch (error) {
    console.error("[Todos Cache] Error clearing all cache:", error);
  }
}

