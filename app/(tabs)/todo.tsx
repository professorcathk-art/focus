import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import { Todo } from "@/types";
import { format, isToday, addDays, startOfDay } from "date-fns";
import {
  getCachedTodos,
  setCachedTodos,
  getAllTodosIncludingPending,
  clearCacheForDate,
  memoryCache,
} from "@/lib/todos-cache";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TodoScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAuthenticated, user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [addingTodo, setAddingTodo] = useState(false);
  const [togglingTodoId, setTogglingTodoId] = useState<string | null>(null);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  const [lastMoveDate, setLastMoveDate] = useState<string | null>(null);
  const [isMovingTasks, setIsMovingTasks] = useState(false);
  const fetchingRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const checkingRef = useRef<Set<string>>(new Set()); // Track which dates we've checked for moving
  const lastLoadedDateRef = useRef<string | null>(null); // Track last loaded date to prevent flashing
  const togglingRef = useRef<Set<string>>(new Set()); // Track todos currently being toggled to prevent filtering
  
  // Get user's timezone offset in minutes (e.g., -480 for PST which is UTC-8)
  const getTimezoneOffset = useCallback(() => {
    return new Date().getTimezoneOffset(); // Returns offset in minutes, negative for timezones ahead of UTC
  }, []);
  
  // Load lastMoveDate from AsyncStorage on mount
  useEffect(() => {
    if (!user?.id) return;
    
    const loadLastMoveDate = async () => {
      try {
        const key = `lastMoveDate_${user.id}`;
        const stored = await AsyncStorage.getItem(key);
        const todayStr = format(new Date(), "yyyy-MM-dd");
        
        if (stored) {
          // Validate stored date - if it's a future date or invalid, clear it
          if (stored > todayStr || stored.length !== 10) {
            console.log(`[TodoScreen] ⚠️ Invalid lastMoveDate in storage: ${stored}, clearing it`);
            await AsyncStorage.removeItem(key);
            setLastMoveDate(null);
          } else if (stored === todayStr) {
            // If lastMoveDate is today, check if it's still early in the day
            // If it's before 2 AM, it might have been set incorrectly, so clear it
            const now = new Date();
            const hoursSinceMidnight = now.getHours() + (now.getMinutes() / 60);
            if (hoursSinceMidnight < 2) {
              console.log(`[TodoScreen] ⚠️ lastMoveDate is today but it's only ${hoursSinceMidnight.toFixed(2)} hours since midnight, clearing it to allow retry`);
              await AsyncStorage.removeItem(key);
              setLastMoveDate(null);
            } else {
              setLastMoveDate(stored);
              console.log(`[TodoScreen] Loaded lastMoveDate from storage: ${stored} (today: ${todayStr})`);
            }
          } else {
            // Stored date is in the past, which is fine
            setLastMoveDate(stored);
            console.log(`[TodoScreen] Loaded lastMoveDate from storage: ${stored} (today: ${todayStr})`);
          }
        } else {
          console.log(`[TodoScreen] No lastMoveDate in storage (today: ${todayStr})`);
        }
      } catch (error) {
        console.error("[TodoScreen] Error loading lastMoveDate:", error);
      }
    };
    
    loadLastMoveDate();
  }, [user?.id]);
  
  // Save lastMoveDate to AsyncStorage whenever it changes
  const saveLastMoveDate = useCallback(async (date: string) => {
    if (!user?.id) return;
    try {
      const key = `lastMoveDate_${user.id}`;
      await AsyncStorage.setItem(key, date);
      console.log(`[TodoScreen] Saved lastMoveDate to storage: ${date}`);
    } catch (error) {
      console.error("[TodoScreen] Error saving lastMoveDate:", error);
    }
  }, [user?.id]);

  const loadTodos = useCallback(async (useCache = true, dateOverride?: Date) => {
    if (!isAuthenticated || !user?.id) return;
    
    // Use dateOverride if provided (for goToToday), otherwise use selectedDate
    // Capture the date at the start to avoid stale closure issues
    const targetDate = dateOverride || selectedDate;
    const dateStr = format(targetDate, "yyyy-MM-dd");
    const userId = user.id;
    
    console.log(`[TodoScreen] Loading todos for date: ${dateStr}`);
    
    // Check cache FIRST before checking fetchingRef - cache is instant
    // BUT: Skip cache check when useCache=false (e.g., on date change) to prevent flashing
    if (useCache) {
      const cachedTodos = await getAllTodosIncludingPending(dateStr, userId);
      if (cachedTodos !== null && cachedTodos.length >= 0) {
        // ALWAYS filter cached todos to only include those matching the requested date
        // This prevents showing wrong-date todos even if cache is corrupted
        const filteredCachedTodos = cachedTodos.filter(todo => todo.date === dateStr);
        
        // Only use cache if we have todos that match the date
        if (filteredCachedTodos.length > 0) {
          console.log(`[TodoScreen] ✅ Using ${filteredCachedTodos.length} cached todos for ${dateStr} (filtered from ${cachedTodos.length} total)`);
          
          // CRITICAL: Double-check we're still on the same date before showing cache
          // This prevents showing cached data for wrong date if user navigated quickly
          const currentDateStr = format(dateOverride || selectedDate, "yyyy-MM-dd");
          if (currentDateStr !== dateStr) {
            console.log(`[TodoScreen] ⚠️ Date changed during cache check (${dateStr} -> ${currentDateStr}), skipping cache`);
            // Continue to API fetch below
          } else {
            // Show cached data immediately - don't wait for fetchingRef
            setTodos(filteredCachedTodos);
            setIsLoading(false);
            
            // If cached todos had wrong dates, clear and re-cache only correct ones
            if (filteredCachedTodos.length < cachedTodos.length) {
              console.log(`[TodoScreen] ⚠️ Found ${cachedTodos.length - filteredCachedTodos.length} todos with wrong dates in cache, cleaning up...`);
              await clearCacheForDate(dateStr, userId);
              // Re-cache only the filtered (correct) todos
              await setCachedTodos(dateStr, userId, filteredCachedTodos);
            }
            
            // If a fetch is already in progress, don't start another one
            if (fetchingRef.current) {
              console.log("[TodoScreen] ⏭️ Using cache, fetch already in progress, skipping duplicate API call");
              return;
            }
            
            // Fetch from API in background (non-blocking)
            fetchingRef.current = true;
            apiClient.get<Todo[]>(API_ENDPOINTS.todos.today(dateStr))
              .then(async (data) => {
                // Double-check we're still on the same date before updating
                const currentDateStr = format(dateOverride || selectedDate, "yyyy-MM-dd");
                if (currentDateStr === dateStr) {
                  // Filter API data to only include todos matching the date
                  const filteredData = data.filter(todo => todo.date === dateStr);
                  if (filteredData.length === data.length) {
                    // All data matches - safe to cache
                    await setCachedTodos(dateStr, userId, filteredData);
                    setTodos(filteredData);
                  } else {
                    console.log(`[TodoScreen] ⚠️ API returned ${data.length - filteredData.length} todos with wrong dates, caching only correct ones`);
                    await setCachedTodos(dateStr, userId, filteredData);
                    setTodos(filteredData);
                  }
                } else {
                  console.log(`[TodoScreen] Date changed during fetch (${dateStr} -> ${currentDateStr}), ignoring response`);
                }
                fetchingRef.current = false;
              })
              .catch((error) => {
                console.error("[TodoScreen] Background refresh error:", error);
                fetchingRef.current = false;
                // Keep using cached data on error
              });
            
            return;
          }
        } else if (cachedTodos.length > 0) {
          // Cache has todos but none match the requested date - clear it
          console.log(`[TodoScreen] ⚠️ Cached todos date mismatch for ${dateStr}. Found ${cachedTodos.length} todos with dates:`, cachedTodos.map(t => t.date));
          await clearCacheForDate(dateStr, userId);
        }
        // If cachedTodos.length === 0, continue to API fetch below
      }
    }
    
    // Prevent concurrent fetches (only if no cache available)
    if (fetchingRef.current) {
      console.log("[TodoScreen] ⏭️ Fetch already in progress, skipping...");
      return;
    }
    
    fetchingRef.current = true;
    setIsLoading(true);
    
    try {
      // No cache available - fetch from API (blocking)
      const endpoint = API_ENDPOINTS.todos.today(dateStr);
      
      // Add timeout to prevent hanging on network errors
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 10000); // 10 second timeout
      });
      
      const data = await Promise.race([
        apiClient.get<Todo[]>(endpoint),
        timeoutPromise
      ]);
      
      // Double-check we're still on the same date before updating
      const currentDateStr = format(dateOverride || selectedDate, "yyyy-MM-dd");
      if (currentDateStr === dateStr) {
        // Verify API data matches date before caching
        const apiDataMatchesDate = data.every(todo => todo.date === dateStr);
        if (apiDataMatchesDate) {
          // Update cache and state
          await setCachedTodos(dateStr, userId, data);
          setTodos(data);
          console.log(`[TodoScreen] ✅ Loaded ${data.length} todos for ${dateStr}`);
        } else {
          console.log(`[TodoScreen] ⚠️ API returned todos with wrong dates for ${dateStr}. Dates found:`, data.map(t => t.date));
          // Filter to only show todos matching the requested date
          const filteredData = data.filter(todo => todo.date === dateStr);
          await setCachedTodos(dateStr, userId, filteredData);
          setTodos(filteredData);
          console.log(`[TodoScreen] ✅ Loaded ${filteredData.length} filtered todos for ${dateStr}`);
        }
      } else {
        console.log(`[TodoScreen] Date changed during fetch, ignoring response for ${dateStr}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[TodoScreen] Load todos error: ${errorMessage}`);
      
      // Check if it's a network/connection error
      const isNetworkError = errorMessage.includes("Network connection lost") || 
                            errorMessage.includes("timeout") ||
                            errorMessage.includes("ECONNREFUSED") ||
                            errorMessage.includes("ENOTFOUND") ||
                            errorMessage.includes("Failed to fetch");
      
      if (isNetworkError) {
        console.log("[TodoScreen] ⚠️ Network error detected, using cache if available");
      }
      
      // If API fails but we have cache, keep using it
      try {
        const cachedTodos = await getAllTodosIncludingPending(dateStr, userId);
        if (cachedTodos !== null) {
          setTodos(cachedTodos);
          console.log("[TodoScreen] API failed but using cached data");
        } else {
          // No cache available - show empty state instead of hanging
          setTodos([]);
          console.log("[TodoScreen] No cache available, showing empty state");
        }
      } catch (cacheError) {
        console.error("[TodoScreen] Error reading cache:", cacheError);
        setTodos([]); // Show empty state on cache error too
      }
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [isAuthenticated, selectedDate, user?.id]);

  const moveIncompleteTasks = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isMovingTasks || !user?.id) {
      console.log("[TodoScreen] Move already in progress or no user, skipping");
      return;
    }

    try {
      // Get today's date in user's timezone
      const now = new Date();
      const todayStr = format(now, "yyyy-MM-dd");
      const userId = user.id;
      const timezoneOffset = getTimezoneOffset();
      
      // Only move if we haven't moved today yet (in user's timezone)
      if (lastMoveDate === todayStr) {
        console.log("[TodoScreen] Already moved tasks today, skipping");
        return;
      }

      setIsMovingTasks(true);
      console.log(`[TodoScreen] Calling move-incomplete endpoint with timezone offset: ${timezoneOffset} minutes`);
      
      // Send timezone offset to backend so it can calculate dates in user's timezone
      const result = await apiClient.post<{ success: boolean; moved: number; message?: string }>(
        API_ENDPOINTS.todos.moveIncompleteToNextDay,
        { timezoneOffset } // Send timezone offset in minutes
      );
      
      if (result.success) {
        // CRITICAL: Only set lastMoveDate if tasks were actually moved
        // If 0 tasks moved, don't set lastMoveDate so it can retry later
        if (result.moved > 0) {
          setLastMoveDate(todayStr);
          await saveLastMoveDate(todayStr);
          console.log(`[TodoScreen] ✅ Moved ${result.moved} incomplete tasks to today`);
          // Clear cache for yesterday and today since tasks were moved
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = format(yesterday, "yyyy-MM-dd");
          await clearCacheForDate(yesterdayStr, userId);
          await clearCacheForDate(todayStr, userId);
          // Reload todos after moving to show the moved tasks
          await loadTodos();
        } else {
          // Don't set lastMoveDate if no tasks were moved
          // This allows the check to run again later (e.g., if user adds incomplete tasks to yesterday)
          console.log(`[TodoScreen] ⚠️ Backend returned: ${result.message || 'No incomplete tasks found from yesterday'}`);
          console.log(`[TodoScreen] ⚠️ NOT setting lastMoveDate, so it can retry if tasks are added later`);
          // Still clear cache to ensure fresh data
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = format(yesterday, "yyyy-MM-dd");
          await clearCacheForDate(yesterdayStr, userId);
          await clearCacheForDate(todayStr, userId);
        }
      }
    } catch (error) {
      // Log error but don't show to user - this is a background operation
      console.error("Move incomplete tasks error:", error);
      // Don't set lastMoveDate on error so it can retry
    } finally {
      setIsMovingTasks(false);
    }
  }, [isMovingTasks, user?.id, lastMoveDate, getTimezoneOffset, loadTodos, saveLastMoveDate]);
  
  // Check if it's a new day in user's timezone and move tasks if needed
  const checkAndMoveTasks = useCallback(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const hoursSinceMidnight = now.getHours() + (now.getMinutes() / 60);
    
    console.log("[TodoScreen] checkAndMoveTasks called", {
      isAuthenticated,
      hasUser: !!user?.id,
      isToday: isToday(selectedDate),
      selectedDate: format(selectedDate, "yyyy-MM-dd"),
      actualToday: todayStr,
      lastMoveDate,
      isMovingTasks,
      hoursSinceMidnight: hoursSinceMidnight.toFixed(2),
    });
    
    if (!isAuthenticated || !user?.id) {
      console.log("[TodoScreen] ⏭️ Skipping check: not authenticated or no user");
      return;
    }
    
    // Always check and move tasks if it's a new day, regardless of which date is selected
    // This ensures tasks are moved even if user is viewing a different date
    if (!isToday(selectedDate)) {
      console.log("[TodoScreen] ⚠️ Not viewing today, but will still check for task movement");
      // Don't return - continue to check if tasks need to be moved
    }
    
    console.log("[TodoScreen] Checking conditions:", {
      todayStr,
      hoursSinceMidnight: hoursSinceMidnight.toFixed(2),
      lastMoveDate,
      isMovingTasks,
      shouldMove: hoursSinceMidnight >= 1 && lastMoveDate !== todayStr && !isMovingTasks,
    });
    
    // Only move if:
    // 1. It's past midnight (right after 12:00 AM) in user's timezone
    // 2. We haven't moved today yet
    // 3. Not already moving
    if (hoursSinceMidnight >= 0 && lastMoveDate !== todayStr && !isMovingTasks) {
      console.log("[TodoScreen] ✅ All conditions met! Calling moveIncompleteTasks...");
      moveIncompleteTasks();
    } else {
      if (lastMoveDate === todayStr) {
        console.log("[TodoScreen] ⏭️ Already moved tasks today, skipping");
      } else if (isMovingTasks) {
        console.log("[TodoScreen] ⏭️ Already moving tasks, skipping");
      } else {
        console.log("[TodoScreen] ⏭️ Conditions not met, skipping move");
      }
    }
  }, [isAuthenticated, user?.id, selectedDate, lastMoveDate, isMovingTasks, moveIncompleteTasks]);

  useEffect(() => {
    // Early return if not authenticated - but don't clear todos to prevent flashing
    if (!isAuthenticated || !user?.id) {
      // Only clear if we were previously authenticated (to handle sign-out)
      if (todos.length > 0) {
        setTodos([]);
      }
      return;
    }
    
    // Capture the current selectedDate to avoid stale closure
    const currentDate = selectedDate;
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const userId = user.id;
    
    console.log(`[TodoScreen] useEffect triggered for date: ${dateStr}`);
    
    // INSTANT LOAD: Check memory cache FIRST (synchronous, instant)
    const memoryKey = `${userId}_${dateStr}`;
    const memoryCached = memoryCache.get(memoryKey);
    const isMemoryCacheValid = memoryCached && Date.now() - memoryCached.timestamp < 30 * 60 * 1000;
    
    // Also check AsyncStorage cache for instant display (faster than API)
    if (lastLoadedDateRef.current !== dateStr) {
      // Try AsyncStorage cache first (instant, synchronous check)
      getAllTodosIncludingPending(dateStr, userId).then((cachedTodos) => {
        if (cachedTodos !== null && cachedTodos.length >= 0) {
          const filteredCached = cachedTodos.filter(todo => todo.date === dateStr);
          if (filteredCached.length > 0) {
            console.log(`[TodoScreen] ⚡ INSTANT: Showing ${filteredCached.length} todos from AsyncStorage cache`);
            setTodos(filteredCached);
            setIsLoading(false);
            lastLoadedDateRef.current = dateStr;
            // Refresh from API in background
            loadTodos(false, currentDate).catch((error) => {
              console.error(`[TodoScreen] Error refreshing todos for ${dateStr}:`, error);
            });
            return;
          }
        }
        
        // No cache - check memory cache
        if (isMemoryCacheValid) {
          const filteredMemoryTodos = memoryCached.todos.filter(todo => todo.date === dateStr);
          if (filteredMemoryTodos.length > 0) {
            console.log(`[TodoScreen] ⚡ INSTANT: Showing ${filteredMemoryTodos.length} todos from memory cache`);
            setTodos(filteredMemoryTodos);
            setIsLoading(false);
            lastLoadedDateRef.current = dateStr;
            // Load from AsyncStorage/API in background to refresh (non-blocking)
            loadTodos(true, currentDate).catch((error) => {
              console.error(`[TodoScreen] Error refreshing todos for ${dateStr}:`, error);
            });
            return; // Exit early - we have instant data
          }
        }
        
        // No cache available - load from API
        console.log(`[TodoScreen] Date changed from ${lastLoadedDateRef.current} to ${dateStr}`);
        setTodos([]);
        setIsLoading(true);
        lastLoadedDateRef.current = dateStr;
        
        // Load todos from API
        loadTodos(false, currentDate).catch((error) => {
          console.error(`[TodoScreen] Error loading todos for ${dateStr}:`, error);
        });
        
        // Check and move incomplete tasks if it's a new day
        if (isToday(selectedDate)) {
          const checkKey = `moveCheck_${dateStr}`;
          if (!checkingRef.current.has(checkKey)) {
            checkingRef.current.add(checkKey);
            setTimeout(() => {
              checkAndMoveTasks();
            }, 1000);
          }
        }
      }).catch((error) => {
        console.error(`[TodoScreen] Error checking cache for ${dateStr}:`, error);
        // Fallback to API load
        setTodos([]);
        setIsLoading(true);
        lastLoadedDateRef.current = dateStr;
        loadTodos(false, currentDate).catch((err) => {
          console.error(`[TodoScreen] Error loading todos for ${dateStr}:`, err);
        });
      });
    }
  }, [isAuthenticated, selectedDate, loadTodos, checkAndMoveTasks]);
  
  // Listen for app state changes (foreground/background) to check for new day
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground - check if it's a new day
        console.log("[TodoScreen] App came to foreground, checking for new day...");
        checkAndMoveTasks();
      }
      appStateRef.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, user?.id, checkAndMoveTasks]);
  
  // Preload today's todos on mount/foreground for instant display
  useEffect(() => {
    if (isAuthenticated && user?.id && isToday(selectedDate)) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const memoryKey = `${user.id}_${todayStr}`;
      
      // Check memory cache immediately (synchronous)
      const memoryCached = memoryCache.get(memoryKey);
      if (memoryCached && Date.now() - memoryCached.timestamp < 30 * 60 * 1000) {
        const filteredTodos = memoryCached.todos.filter(todo => todo.date === todayStr);
        if (filteredTodos.length > 0 && todos.length === 0) {
          console.log(`[TodoScreen] ⚡ Preloading ${filteredTodos.length} todos from memory cache`);
          setTodos(filteredTodos);
          setIsLoading(false);
        }
      }
      
      // Also check and move tasks
      const timer = setTimeout(() => {
        checkAndMoveTasks();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.id, selectedDate, checkAndMoveTasks]);

  // Preload todos for a date (non-blocking, for smooth calendar browsing)
  const preloadTodosForDate = useCallback(async (date: Date) => {
    if (!isAuthenticated || !user?.id) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const userId = user.id;
    
    // Check if already cached
    const cached = await getAllTodosIncludingPending(dateStr, userId);
    if (cached !== null && cached.length >= 0) {
      return; // Already cached
    }
    
    // Preload in background (don't await - non-blocking)
    apiClient.get<Todo[]>(API_ENDPOINTS.todos.today(dateStr))
      .then(async (data) => {
        const filteredData = data.filter(todo => todo.date === dateStr);
        await setCachedTodos(dateStr, userId, filteredData);
        console.log(`[TodoScreen] ✅ Preloaded ${filteredData.length} todos for ${dateStr}`);
      })
      .catch((error) => {
        console.log(`[TodoScreen] Preload failed for ${dateStr}:`, error.message);
        // Ignore preload errors - they're non-critical
      });
  }, [isAuthenticated, user?.id]);

  const handleDateChange = (days: number) => {
    const newDate = addDays(selectedDate, days);
    
    // Preload adjacent dates for smooth browsing
    preloadTodosForDate(addDays(newDate, -1)); // Previous day
    preloadTodosForDate(addDays(newDate, 1)); // Next day
    
    // Clear todos immediately when changing date to prevent flashing wrong-date todos
    setTodos([]);
    setIsLoading(true);
    // Update date - this will trigger useEffect which will load correct todos
    setSelectedDate(newDate);
  };

  const handleSelectDate = (date: Date) => {
    // Preload adjacent dates for smooth browsing
    preloadTodosForDate(addDays(date, -1)); // Previous day
    preloadTodosForDate(addDays(date, 1)); // Next day
    
    // Clear todos immediately when selecting date to prevent flashing wrong-date todos
    setTodos([]);
    setIsLoading(true);
    // Update date - this will trigger useEffect which will load correct todos
    setSelectedDate(date);
    setShowCalendarModal(false);
  };

  const goToToday = () => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const currentDateStr = format(selectedDate, "yyyy-MM-dd");
    
    // If already on today, do nothing
    if (currentDateStr === todayStr) {
      return;
    }
    
    // Preload adjacent dates for smooth browsing
    preloadTodosForDate(addDays(today, -1)); // Previous day
    preloadTodosForDate(addDays(today, 1)); // Next day
    
    // Clear todos immediately to prevent flashing wrong-date todos
    setTodos([]);
    setIsLoading(true);
    // Set date - this will trigger useEffect which will load correct todos
    setSelectedDate(today);
  };

  const handleOpenCalendar = () => {
    // Sync calendar month/year with selected date when opening
    setCalendarYear(selectedDate.getFullYear());
    setCalendarMonth(selectedDate.getMonth());
    setShowCalendarModal(true);
  };

  const handleAddTodo = async () => {
    if (!input.trim() || !isAuthenticated || !user?.id || addingTodo) return;

    const tempId = `temp-${Date.now()}`;
    const todoText = input.trim();
    const todoDate = format(selectedDate, "yyyy-MM-dd"); // Use selected date
    const userId = user.id;
    
    const tempTodo: Todo = {
      id: tempId,
      text: todoText,
      completed: false,
      date: todoDate,
      dueDate: todoDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInput("");
    Keyboard.dismiss();
    setAddingTodo(true);

    // Optimistic update
    setTodos(prevTodos => [...prevTodos, tempTodo]);
    // Update cache optimistically
    const cachedTodos = await getAllTodosIncludingPending(todoDate, userId);
    if (cachedTodos) {
      await setCachedTodos(todoDate, userId, [...cachedTodos, tempTodo]);
    }

    try {
      const newTodo = await apiClient.post<Todo>(API_ENDPOINTS.todos.create, {
        text: todoText,
        date: todoDate, // Use selected date (can be today or future date)
      });
      // Replace temp todo with real one using functional update
      setTodos(prevTodos => prevTodos.map(t => t.id === tempId ? newTodo : t));
      // Update cache with real todo
      const updatedCached = await getAllTodosIncludingPending(todoDate, userId);
      if (updatedCached) {
        const finalTodos = updatedCached.map(t => t.id === tempId ? newTodo : t);
        await setCachedTodos(todoDate, userId, finalTodos);
      }
    } catch (error) {
      console.error("Add todo error:", error);
      // Revert optimistic update
      setTodos(prevTodos => prevTodos.filter(t => t.id !== tempId));
      // Revert cache
      const cachedTodos = await getAllTodosIncludingPending(todoDate, userId);
      if (cachedTodos) {
        await setCachedTodos(todoDate, userId, cachedTodos.filter(t => t.id !== tempId));
      }
      setInput(todoText);
      Alert.alert("Error", "Failed to add todo");
    } finally {
      setAddingTodo(false);
    }
  };


  const handleToggleTodo = async (id: string, completed: boolean) => {
    if (!isAuthenticated || !user?.id || togglingTodoId === id) return;

    // Mark as toggling to prevent filtering during update
    togglingRef.current.add(id);
    setTogglingTodoId(id);

    // Optimistic update - use functional update to ensure atomic state change
    const newCompleted = !completed;
    const todoDate = todos.find(t => t.id === id)?.date || format(selectedDate, "yyyy-MM-dd");
    const userId = user.id;
    const currentDateStr = format(selectedDate, "yyyy-MM-dd");
    
    // Optimistic state update - ensure it matches current date
    setTodos(prevTodos => {
      return prevTodos.map((t) => {
        if (t.id === id) {
          return { ...t, completed: newCompleted };
        }
        return t;
      });
    });
    
    // Update cache optimistically
    const cachedTodos = await getAllTodosIncludingPending(todoDate, userId);
    if (cachedTodos) {
      const updatedCached = cachedTodos.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t));
      await setCachedTodos(todoDate, userId, updatedCached);
    }

    try {
      const updatedTodo = await apiClient.put<Todo>(
        API_ENDPOINTS.todos.update(id),
        { completed: newCompleted }
      );
      
      // Update state with API response - ensure date still matches and use functional update
      setTodos(prevTodos => {
        // Double-check we're still on the same date
        const stillOnSameDate = format(selectedDate, "yyyy-MM-dd") === currentDateStr;
        if (!stillOnSameDate) {
          console.log(`[TodoScreen] Date changed during toggle, ignoring update for ${id}`);
          return prevTodos; // Don't update if date changed
        }
        
        // Update the todo atomically
        return prevTodos.map((t) => {
          if (t.id === id) {
            // Ensure the updated todo matches the current date
            if (updatedTodo.date === currentDateStr) {
              return updatedTodo;
            } else {
              // If API returned wrong date, keep optimistic update
              console.log(`[TodoScreen] ⚠️ API returned todo with wrong date (${updatedTodo.date}), keeping optimistic update`);
              return { ...t, completed: newCompleted };
            }
          }
          return t;
        });
      });
      
      // Update cache with real todo
      const cachedTodosAfter = await getAllTodosIncludingPending(todoDate, userId);
      if (cachedTodosAfter) {
        const finalTodos = cachedTodosAfter.map((t) => (t.id === id ? updatedTodo : t));
        await setCachedTodos(todoDate, userId, finalTodos);
      }
    } catch (error) {
      console.error("Toggle todo error:", error);
      // Revert optimistic update - use functional update
      setTodos(prevTodos => {
        const stillOnSameDate = format(selectedDate, "yyyy-MM-dd") === currentDateStr;
        if (!stillOnSameDate) {
          return prevTodos; // Don't revert if date changed
        }
        return prevTodos.map((t) => (t.id === id ? { ...t, completed } : t));
      });
      
      // Revert cache
      const cachedTodos = await getAllTodosIncludingPending(todoDate, userId);
      if (cachedTodos) {
        const revertedCached = cachedTodos.map((t) => (t.id === id ? { ...t, completed } : t));
        await setCachedTodos(todoDate, userId, revertedCached);
      }
      Alert.alert("Error", "Failed to update todo");
    } finally {
      setTogglingTodoId(null);
      togglingRef.current.delete(id);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!isAuthenticated || !user?.id || deletingTodoId === id) return;

    Alert.alert(
      "Delete Todo",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Store deleted todo for potential revert
            const deletedTodo = todos.find(t => t.id === id);
            const todoDate = deletedTodo?.date || format(selectedDate, "yyyy-MM-dd");
            const userId = user.id;
            
            // Optimistic update - remove from list
            setTodos(prevTodos => prevTodos.filter((t) => t.id !== id));
            // Update cache optimistically
            const cachedTodos = await getAllTodosIncludingPending(todoDate, userId);
            if (cachedTodos) {
              await setCachedTodos(todoDate, userId, cachedTodos.filter((t) => t.id !== id));
            }
            setDeletingTodoId(id);

            try {
              await apiClient.delete(API_ENDPOINTS.todos.delete(id));
            } catch (error) {
              console.error("Delete todo error:", error);
              // Revert optimistic update
              if (deletedTodo) {
                setTodos(prevTodos => [...prevTodos, deletedTodo]);
                // Revert cache
                const cachedTodos = await getAllTodosIncludingPending(todoDate, userId);
                if (cachedTodos) {
                  await setCachedTodos(todoDate, userId, [...cachedTodos, deletedTodo]);
                }
              }
              Alert.alert("Error", "Failed to delete todo");
            } finally {
              setDeletingTodoId(null);
            }
          },
        },
      ]
    );
  };


  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
      {/* Header - extends to top */}
      <LinearGradient
        colors={isDark 
          ? ["#0A0A0A", "#1A1A2E", "#16213E"] 
          : ["#A8E6CF", "#88D8C0", "#7EC8E3", "#4ECDC4"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="border-b"
        style={{
          borderBottomColor: isDark ? "#38383A" : "rgba(255,255,255,0.3)",
          paddingTop: Platform.OS === "ios" ? 50 : 20, // Safe area top padding
          minHeight: Platform.OS === "ios" ? 140 : 120, // Fixed minimum height
        }}
      >
        <SafeAreaView edges={['left', 'right']}>
          <View className="px-6 pb-5" style={{ minHeight: 140 }}>
            <View className="flex-row items-center justify-between mb-3 mt-2">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => handleDateChange(-1)}
                    className="p-2.5 rounded-full"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)" }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="chevron-back" size={20} color={isDark ? "#FFFFFF" : "#1A1A1A"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleOpenCalendar}
                    className="flex-1 flex-row items-center justify-center gap-2"
                    activeOpacity={0.7}
                  >
                    <Text className="text-3xl font-bold text-white dark:text-white text-center" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                      {isToday(selectedDate) ? "Today's Tasks" : format(selectedDate, "EEE, MMM d")}
                    </Text>
                    <Ionicons 
                      name="calendar-outline" 
                      size={20} 
                      color={isDark ? "#FFFFFF" : "#1A1A1A"} 
                      style={{ opacity: 0.8 }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDateChange(1)}
                    className="p-2.5 rounded-full"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)" }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="chevron-forward" size={20} color={isDark ? "#FFFFFF" : "#1A1A1A"} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Progress Bar - Reserve space even when hidden */}
            <View style={{ minHeight: 48 }}>
              {totalCount > 0 && (
                <View className="mt-4">
                  <View className="flex-row items-center justify-between mb-2 px-1">
                    <Text className="text-sm font-medium text-white" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                      Progress
                    </Text>
                    <Text className="text-sm font-semibold text-white" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                      {completedCount} / {totalCount}
                    </Text>
                  </View>
                  <View
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: isDark ? "#38383A" : "#E5E5EA" }}
                  >
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${progress * 100}%`,
                        backgroundColor: "#34C759",
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
            
            {/* Go to Today Button - at bottom of banner */}
            {!isToday(selectedDate) && (
              <TouchableOpacity
                onPress={goToToday}
                className="self-center mt-3"
              >
                <Text className="text-xs font-medium text-white" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                  Go to Today
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Todos List */}
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {todos.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons
                name="checkmark-circle-outline"
                size={64}
                color={isDark ? "#8E8E93" : "#C7C7CC"}
              />
              <Text className="text-lg font-semibold text-gray-500 dark:text-gray-400 mt-4">
                No tasks yet
              </Text>
              <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center px-8">
                Add a task below to get started
              </Text>
            </View>
          ) : (
            todos
              .filter(todo => {
                // Don't filter out todos that are currently being toggled
                if (togglingRef.current.has(todo.id)) {
                  return true;
                }
                // Double-check date match
                return todo.date === format(selectedDate, "yyyy-MM-dd");
              })
              .map((todo) => (
              <View
                key={todo.id}
                className="bg-white dark:bg-card-dark rounded-xl p-4 mb-3 flex-row items-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <TouchableOpacity
                  onPress={() => handleToggleTodo(todo.id, todo.completed)}
                  className="mr-3 p-2 -ml-2"
                  disabled={togglingTodoId === todo.id}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {togglingTodoId === todo.id ? (
                    <ActivityIndicator size="small" color="#34C759" />
                  ) : (
                    <View
                      className="w-6 h-6 rounded-full border-2 items-center justify-center"
                      style={{
                        borderColor: todo.completed ? "#34C759" : "#D1D1D6",
                        backgroundColor: todo.completed ? "#34C759" : "transparent",
                      }}
                    >
                      {todo.completed && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  )}
                </TouchableOpacity>

                <Text
                  className="flex-1 text-base"
                  style={{
                    color: todo.completed
                      ? isDark
                        ? "#8E8E93"
                        : "#8E8E93"
                      : isDark
                      ? "#FFFFFF"
                      : "#000000",
                    textDecorationLine: todo.completed ? "line-through" : "none",
                  }}
                >
                  {todo.text}
                </Text>

                <TouchableOpacity
                  onPress={() => handleDeleteTodo(todo.id)}
                  className="ml-2 p-2"
                  disabled={deletingTodoId === todo.id}
                >
                  {deletingTodoId === todo.id ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={isDark ? "#8E8E93" : "#8E8E93"}
                    />
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input */}
        <View
          className="px-4 py-3 border-t"
          style={{
            backgroundColor: isDark ? "#000000" : "#F5F5F7",
            borderTopColor: isDark ? "#38383A" : "#E5E5EA",
          }}
        >
          <View className="flex-row items-center gap-3">
            <TextInput
              className="flex-1 bg-white dark:bg-card-dark rounded-full px-4 py-3 text-base text-black dark:text-white"
              placeholder="Add a task..."
              placeholderTextColor={isDark ? "#8E8E93" : "#8E8E93"}
              value={input}
              onChangeText={setInput}
              maxLength={200}
              returnKeyType="done"
              onSubmitEditing={handleAddTodo}
              editable={isAuthenticated}
              style={{
                fontSize: 16,
              }}
            />
            <TouchableOpacity
              onPress={handleAddTodo}
              disabled={!input.trim() || !isAuthenticated || addingTodo}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  input.trim() && isAuthenticated && !addingTodo
                    ? "#34C759"
                    : isDark
                    ? "#38383A"
                    : "#E5E5EA",
              }}
            >
              {addingTodo ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="add"
                  size={24}
                  color={
                    input.trim() && isAuthenticated
                      ? "#FFFFFF"
                      : isDark
                      ? "#8E8E93"
                      : "#8E8E93"
                  }
                />
              )}
            </TouchableOpacity>
          </View>
          {!isAuthenticated && (
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Please sign in to manage your tasks
            </Text>
          )}
        </View>

        {/* Calendar Modal */}
        <Modal
          visible={showCalendarModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-6">
            <View className="bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-sm"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 16,
                overflow: 'hidden', // Prevent content from going outside
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-black dark:text-white">
                  Select Date
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCalendarModal(false)}
                  className="p-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
                </TouchableOpacity>
              </View>

              {/* Month Navigation */}
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={() => {
                    const newDate = new Date(calendarYear, calendarMonth - 1, 1);
                    setCalendarMonth(newDate.getMonth());
                    setCalendarYear(newDate.getFullYear());
                  }}
                  className="p-2"
                >
                  <Ionicons name="chevron-back" size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-black dark:text-white">
                  {format(new Date(calendarYear, calendarMonth, 1), "MMM yyyy")}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const newDate = new Date(calendarYear, calendarMonth + 1, 1);
                    setCalendarMonth(newDate.getMonth());
                    setCalendarYear(newDate.getFullYear());
                  }}
                  className="p-2"
                >
                  <Ionicons name="chevron-forward" size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                </TouchableOpacity>
              </View>

              {/* Calendar Grid */}
              <View className="mb-4" style={{ overflow: 'hidden' }}>
                {/* Day headers */}
                <View className="flex-row mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
                    const dayCellWidth = (SCREEN_WIDTH - 48 - 48) / 7; // 48 = modal padding, 48 = outer padding
                    return (
                      <View key={day} style={{ width: dayCellWidth, alignItems: 'center' }}>
                        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {day}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Calendar days */}
                {(() => {
                  const firstDay = new Date(calendarYear, calendarMonth, 1);
                  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
                  const startDate = startOfDay(firstDay);
                  const daysInMonth = lastDay.getDate();
                  const startingDayOfWeek = firstDay.getDay();
                  const days: (Date | null)[] = [];

                  // Add empty cells for days before month starts
                  for (let i = 0; i < startingDayOfWeek; i++) {
                    days.push(null);
                  }

                  // Add days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    days.push(new Date(calendarYear, calendarMonth, day));
                  }

                  const rows: (Date | null)[][] = [];
                  for (let i = 0; i < days.length; i += 7) {
                    rows.push(days.slice(i, i + 7));
                  }

                  // Calculate fixed width for each day cell to ensure consistent alignment
                  // Account for modal padding (24px * 2) and outer padding (24px * 2)
                  const dayCellWidth = (SCREEN_WIDTH - 48 - 48) / 7;
                  
                  // Ensure all rows have exactly 7 cells for consistent layout
                  // Pad last row with nulls if needed
                  const paddedRows = rows.map(row => {
                    const padded = [...row];
                    while (padded.length < 7) {
                      padded.push(null);
                    }
                    return padded;
                  });
                  
                  return (
                    <View>
                      {paddedRows.map((row, rowIndex) => {
                        return (
                          <View 
                            key={rowIndex} 
                            className="flex-row mb-1"
                          >
                            {row.map((date, colIndex) => {
                              if (!date) {
                                // Always render empty placeholder with fixed width to maintain alignment
                                return (
                                  <View 
                                    key={`${rowIndex}-${colIndex}`} 
                                    style={{ 
                                      width: dayCellWidth,
                                      height: 40,
                                    }} 
                                  />
                                );
                              }
                              
                              const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                              const isTodayDate = isToday(date);
                              const isPast = date < startOfDay(new Date()) && !isTodayDate;

                              return (
                                <TouchableOpacity
                                  key={`${rowIndex}-${colIndex}`}
                                  onPress={() => handleSelectDate(date)}
                                  className="items-center justify-center rounded-lg"
                                  style={{
                                    width: dayCellWidth,
                                    height: 40,
                                    backgroundColor: isSelected
                                      ? "#34C759"
                                      : isTodayDate
                                      ? isDark
                                        ? "#38383A"
                                        : "#E8F5E9"
                                      : "transparent",
                                  }}
                                >
                                  <Text
                                    className="text-sm"
                                    style={{
                                      color: isSelected
                                        ? "#FFFFFF"
                                        : isPast
                                        ? isDark
                                          ? "#8E8E93"
                                          : "#8E8E93"
                                        : isDark
                                        ? "#FFFFFF"
                                        : "#000000",
                                      fontWeight: isSelected || isTodayDate ? "bold" : "normal",
                                    }}
                                  >
                                    {format(date, "d")}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  );
                })()}
              </View>

              <TouchableOpacity
                onPress={() => {
                  goToToday();
                  setShowCalendarModal(false);
                }}
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: isDark ? "#38383A" : "#F2F2F7" }}
              >
                <Text className="text-center text-black dark:text-white font-semibold">
                  Go to Today
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

