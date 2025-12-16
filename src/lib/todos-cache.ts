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
const PENDING_TODOS_KEY = "pending_todos"; // Todos waiting to sync to server
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes cache expiry (longer for better performance)

interface CachedTodos {
  todos: Todo[];
  timestamp: number;
}

/**
 * In-memory cache for instant access (Tier 1)
 * Key: date string (yyyy-MM-dd), Value: { todos, timestamp }
 */
const memoryCache = new Map<string, { todos: Todo[]; timestamp: number }>();

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
 * Get cache key for a specific date
 */
function getCacheKey(date: string): string {
  return `${CACHE_PREFIX}${date}`;
}

function getTimestampKey(date: string): string {
  return `${CACHE_TIMESTAMP_PREFIX}${date}`;
}

/**
 * Get todos from in-memory cache (Tier 1 - fastest)
 */
function getFromMemory(date: string): Todo[] | null {
  const cached = memoryCache.get(date);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_EXPIRY_MS) {
    memoryCache.delete(date);
    return null;
  }
  
  return cached.todos;
}

/**
 * Set todos in in-memory cache (Tier 1)
 */
function setInMemory(date: string, todos: Todo[]): void {
  memoryCache.set(date, {
    todos,
    timestamp: Date.now(),
  });
}

/**
 * Get todos from cache for a specific date if not expired
 * Checks memory cache first, then AsyncStorage
 */
export async function getCachedTodos(date: string): Promise<Todo[] | null> {
  // Tier 1: Check in-memory cache first (instant)
  const memoryCached = getFromMemory(date);
  if (memoryCached) {
    console.log(`[Todos Cache] ✅ Using memory cache for ${date} (${memoryCached.length} todos)`);
    return memoryCached;
  }
  
  // Tier 2: Check AsyncStorage
  try {
    const cacheKey = getCacheKey(date);
    const timestampKey = getTimestampKey(date);
    
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
      console.log(`[Todos Cache] Invalid timestamp for ${date}, clearing cache`);
      await clearCacheForDate(date);
      return null;
    }
    
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRY_MS) {
      console.log(`[Todos Cache] Cache expired for ${date}, will fetch fresh data`);
      return null;
    }
    
    // Validate and parse JSON
    if (typeof cachedValue !== 'string' || cachedValue.trim() === '') {
      console.log(`[Todos Cache] Invalid cache data for ${date}, clearing cache`);
      await clearCacheForDate(date);
      return null;
    }
    
    let cached: CachedTodos;
    try {
      cached = JSON.parse(cachedValue);
    } catch (parseError) {
      console.error(`[Todos Cache] JSON parse error for ${date}, clearing corrupted cache:`, parseError);
      await clearCacheForDate(date);
      return null;
    }
    
    // Validate cached structure
    if (!cached || !Array.isArray(cached.todos)) {
      console.log(`[Todos Cache] Invalid cache structure for ${date}, clearing cache`);
      await clearCacheForDate(date);
      return null;
    }
    
    console.log(`[Todos Cache] ✅ Using AsyncStorage cache for ${date} (${cached.todos.length} todos, ${Math.round((now - timestamp) / 1000)}s old)`);
    
    // Update memory cache for next time
    setInMemory(date, cached.todos);
    
    return cached.todos;
  } catch (error) {
    console.error("[Todos Cache] Error reading cache:", error);
    // Clear potentially corrupted cache
    try {
      await clearCacheForDate(date);
    } catch (clearError) {
      console.error("[Todos Cache] Error clearing corrupted cache:", clearError);
    }
    return null;
  }
}

/**
 * Cache todos for a specific date
 * Updates both memory cache (Tier 1) and AsyncStorage (Tier 2)
 */
export async function setCachedTodos(date: string, todos: Todo[]): Promise<void> {
  // Update memory cache immediately (Tier 1)
  setInMemory(date, todos);
  
  // Update AsyncStorage in background (Tier 2)
  try {
    const cacheKey = getCacheKey(date);
    const timestampKey = getTimestampKey(date);
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
    console.log(`[Todos Cache] 💾 Cached ${todos.length} todos for ${date}`);
  } catch (error) {
    console.error("[Todos Cache] Error caching todos:", error);
  }
}

/**
 * Get all pending todos (not yet synced to server)
 */
export async function getPendingTodos(): Promise<PendingTodo[]> {
  try {
    const pendingData = await AsyncStorage.getItem(PENDING_TODOS_KEY);
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
 */
export async function addPendingTodo(todo: Todo, operation: "create" | "update" | "delete"): Promise<void> {
  try {
    const pending = await getPendingTodos();
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
    
    await AsyncStorage.setItem(PENDING_TODOS_KEY, JSON.stringify(filtered));
    console.log(`[Todos Cache] 📝 Added pending todo: ${operation} ${todo.id}`);
  } catch (error) {
    console.error("[Todos Cache] Error adding pending todo:", error);
  }
}

/**
 * Mark a pending todo as synced
 */
export async function markTodoSynced(todoId: string): Promise<void> {
  try {
    const pending = await getPendingTodos();
    const updated = pending.map((p) =>
      p.id === todoId ? { ...p, synced: true } : p
    );
    await AsyncStorage.setItem(PENDING_TODOS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("[Todos Cache] Error marking todo as synced:", error);
  }
}

/**
 * Remove a pending todo (after successful sync)
 */
export async function removePendingTodo(todoId: string): Promise<void> {
  try {
    const pending = await getPendingTodos();
    const filtered = pending.filter((p) => p.id !== todoId);
    await AsyncStorage.setItem(PENDING_TODOS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("[Todos Cache] Error removing pending todo:", error);
  }
}

/**
 * Get all todos for a date including pending ones
 * This merges cached todos with pending operations
 * Optimized to check memory cache first, then AsyncStorage
 */
export async function getAllTodosIncludingPending(date: string): Promise<Todo[] | null> {
  try {
    // Check memory cache first (fastest)
    let cached = getFromMemory(date);
    
    // If not in memory, check AsyncStorage
    if (!cached) {
      cached = await getCachedTodos(date);
    }
    
    // Get pending todos (usually empty, so this is fast)
    const pending = await getPendingTodos();
    
    // Filter pending todos for this date
    const pendingForDate = pending.filter(
      (p) => p.date === date && !p.synced
    );
    
    if (!cached && pendingForDate.length === 0) {
      return null;
    }
    
    let todos = cached || [];
    
    // Apply pending operations (usually none, so this is fast)
    for (const pendingTodo of pendingForDate) {
      if (pendingTodo.operation === "delete") {
        todos = todos.filter((t) => t.id !== pendingTodo.id);
      } else if (pendingTodo.operation === "update") {
        const index = todos.findIndex((t) => t.id === pendingTodo.id);
        if (index >= 0) {
          todos[index] = {
            ...todos[index],
            text: pendingTodo.text,
            completed: pendingTodo.completed,
            date: pendingTodo.date,
            dueDate: pendingTodo.dueDate,
          };
        }
      } else if (pendingTodo.operation === "create") {
        // Check if already exists (might have been synced)
        const exists = todos.some((t) => t.id === pendingTodo.id);
        if (!exists) {
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
    
    return todos;
  } catch (error) {
    console.error("[Todos Cache] Error getting todos with pending:", error);
    return null;
  }
}

/**
 * Clear cache for a specific date
 */
export async function clearCacheForDate(date: string): Promise<void> {
  try {
    // Clear memory cache
    memoryCache.delete(date);
    
    // Clear AsyncStorage
    const cacheKey = getCacheKey(date);
    const timestampKey = getTimestampKey(date);
    
    // Use multiRemove for better performance
    const keysToRemove = [cacheKey, timestampKey].filter(Boolean);
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
    console.log(`[Todos Cache] 🗑️ Cleared cache for ${date}`);
  } catch (error) {
    console.error("[Todos Cache] Error clearing cache:", error);
    // Don't throw - clearing cache should be safe even if it fails
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

