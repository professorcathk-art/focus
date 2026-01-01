/**
 * Tasks Screen - Simple calendar function for task management
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Alert, ActivityIndicator, Modal, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import { Todo } from "@/types";
import { format, isToday, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { getCachedTodos, setCachedTodos, memoryCache } from "@/lib/todos-cache";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function TasksScreen() {
  const isDark = useColorScheme() === "dark";
  const { isAuthenticated, user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [addingTodo, setAddingTodo] = useState(false);
  const fetchingRef = useRef(false);
  const currentLoadingDateRef = useRef<string | null>(null); // Track which date is currently being loaded

  // Load todos for selected date with INSTANT cache display
  const loadTodos = useCallback(async (date: Date, skipCache = false) => {
    // Safety checks
    if (!isAuthenticated || !user?.id) {
      console.warn('[Tasks] Cannot load todos: not authenticated or no user');
      return;
    }
    
    // Validate date
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.error('[Tasks] Invalid date provided:', date);
      return;
    }
    
    const dateStr = format(date, "yyyy-MM-dd");
    const userId = user.id;
    
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      console.error('[Tasks] Invalid userId:', userId);
      return;
    }
    
    // CRITICAL: Check if this date is still the one we want to load
    // If user switched dates while this function was queued, skip it
    const currentSelectedDateStr = format(selectedDate, "yyyy-MM-dd");
    if (dateStr !== currentSelectedDateStr) {
      console.log(`[Tasks] ⚠️ Date changed while loading (requested: ${dateStr}, current: ${currentSelectedDateStr}), skipping`);
      return;
    }
    
    // Set the current loading date BEFORE any async operations
    currentLoadingDateRef.current = dateStr;
    
    if (fetchingRef.current) {
      console.log('[Tasks] Already fetching, skipping...');
      return;
    }
    
    // CRITICAL: Check memory cache FIRST (synchronous, 0ms delay) BEFORE setting loading state
    if (!skipCache) {
      const memoryKey = `${userId}_${dateStr}`;
      const memoryCached = memoryCache.get(memoryKey);
      if (memoryCached && Date.now() - memoryCached.timestamp < 30 * 60 * 1000) {
        const filtered = memoryCached.todos.filter(todo => todo.date === dateStr);
        // Show cached data INSTANTLY (don't set loading state)
        console.log(`[Tasks] ⚡ INSTANT: Showing ${filtered.length} tasks from memory cache`);
        setTodos(filtered);
        setIsLoading(false); // Ensure loading is false
        
        // Refresh from API in background (non-blocking, doesn't affect UI)
        fetchingRef.current = true;
        try {
          const data = await apiClient.get<Todo[]>(API_ENDPOINTS.todos.today(dateStr));
          const filteredData = data.filter(todo => todo.date === dateStr);
          await setCachedTodos(dateStr, userId, filteredData);
          // CRITICAL: Only update if still viewing the same date AND this is still the current loading date
          const stillCurrentDate = format(selectedDate, "yyyy-MM-dd") === dateStr && currentLoadingDateRef.current === dateStr;
          if (stillCurrentDate) {
            console.log(`[Tasks] ✅ Background refresh complete for ${dateStr}, updating UI`);
            // Prevent duplicates - merge with existing todos, preferring API data
            setTodos(prev => {
              // Create a map of existing todos by ID
              const existingMap = new Map(prev.map(t => [t.id, t]));
              // Add/update todos from API
              filteredData.forEach(todo => {
                existingMap.set(todo.id, todo);
              });
              // Return deduplicated array
              return Array.from(existingMap.values());
            });
          } else {
            console.log(`[Tasks] ⚠️ Background refresh for ${dateStr} completed but date changed, ignoring update`);
          }
        } catch (error) {
          console.error("Background refresh error:", error);
        } finally {
          fetchingRef.current = false;
          // Clear loading date ref if this was the last operation
          if (currentLoadingDateRef.current === dateStr) {
            currentLoadingDateRef.current = null;
          }
        }
        return; // Exit early - we have instant data!
      }
      
      // Check AsyncStorage cache (fast, ~10-50ms) - but show loading only if no cache
      try {
        const cached = await getCachedTodos(dateStr, userId);
        if (cached && cached.length > 0) {
          console.log(`[Tasks] ⚡ FAST: Showing ${cached.length} tasks from AsyncStorage cache`);
          setTodos(cached);
          setIsLoading(false); // Ensure loading is false
          
          // Refresh from API in background
          fetchingRef.current = true;
          try {
            const data = await apiClient.get<Todo[]>(API_ENDPOINTS.todos.today(dateStr));
            const filteredData = data.filter(todo => todo.date === dateStr);
            await setCachedTodos(dateStr, userId, filteredData);
            // CRITICAL: Only update if still viewing the same date AND this is still the current loading date
            const stillCurrentDate = format(selectedDate, "yyyy-MM-dd") === dateStr && currentLoadingDateRef.current === dateStr;
            if (stillCurrentDate) {
              console.log(`[Tasks] ✅ Background refresh complete for ${dateStr}, updating UI`);
              // Prevent duplicates - merge with existing todos, preferring API data
              setTodos(prev => {
                // Create a map of existing todos by ID
                const existingMap = new Map(prev.map(t => [t.id, t]));
                // Add/update todos from API
                filteredData.forEach(todo => {
                  existingMap.set(todo.id, todo);
                });
                // Return deduplicated array
                return Array.from(existingMap.values());
              });
            } else {
              console.log(`[Tasks] ⚠️ Background refresh for ${dateStr} completed but date changed, ignoring update`);
            }
          } catch (error) {
            console.error("Background refresh error:", error);
          } finally {
            fetchingRef.current = false;
            // Clear loading date ref if this was the last operation
            if (currentLoadingDateRef.current === dateStr) {
              currentLoadingDateRef.current = null;
            }
          }
          return; // Exit early - we have cached data!
        }
      } catch (error) {
        console.error("Cache read error:", error);
      }
    }
    
    // No cache hit - fetch from API (only now show loading)
    fetchingRef.current = true;
    setIsLoading(true);
    
    try {
      const data = await apiClient.get<Todo[]>(API_ENDPOINTS.todos.today(dateStr));
      const filtered = data.filter(todo => todo.date === dateStr);
      await setCachedTodos(dateStr, userId, filtered);
      
      // CRITICAL: Only update if still viewing the same date AND this is still the current loading date
      const stillCurrentDate = format(selectedDate, "yyyy-MM-dd") === dateStr && currentLoadingDateRef.current === dateStr;
      if (stillCurrentDate) {
        console.log(`[Tasks] ✅ API fetch complete for ${dateStr}, updating UI`);
        setTodos(filtered);
      } else {
        console.log(`[Tasks] ⚠️ API fetch for ${dateStr} completed but date changed, ignoring update`);
      }
    } catch (error) {
      console.error("Load todos error:", error);
      // Only clear todos if still viewing this date
      const stillCurrentDate = format(selectedDate, "yyyy-MM-dd") === dateStr && currentLoadingDateRef.current === dateStr;
      if (stillCurrentDate) {
        setTodos([]);
      }
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
      // Clear loading date ref if this was the last operation
      if (currentLoadingDateRef.current === dateStr) {
        currentLoadingDateRef.current = null;
      }
    }
  }, [isAuthenticated, user?.id, selectedDate]);

  // Load todos when date changes - with instant cache check
  useEffect(() => {
    // Safety check: don't run if not authenticated or user not ready
    if (!isAuthenticated || !user?.id) {
      setTodos([]);
      setIsLoading(false);
      currentLoadingDateRef.current = null;
      return;
    }
    
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const userId = user.id;
      
      // Validate userId is a valid string
      if (!userId || typeof userId !== 'string') {
        console.warn('[Tasks] Invalid userId, skipping load');
        return;
      }
      
      // CRITICAL: Check memory cache FIRST (synchronously, 0ms delay) BEFORE clearing todos
      // This prevents flash of empty state when cache exists
      const memoryKey = `${userId}_${dateStr}`;
      const memoryCached = memoryCache.get(memoryKey);
      if (memoryCached && Date.now() - memoryCached.timestamp < 30 * 60 * 1000) {
        // Filter todos for this specific date (todos already have date property)
        const filtered = memoryCached.todos.filter(todo => {
          // Handle both string and Date formats
          const todoDate = typeof todo.date === 'string' ? todo.date : format(new Date(todo.date), "yyyy-MM-dd");
          return todoDate === dateStr;
        });
        
        // Show even if empty (0 tasks is valid state)
        console.log(`[Tasks] ⚡ INSTANT on date change: Showing ${filtered.length} tasks for ${dateStr} from memory cache`);
        // Set current loading date BEFORE any async operations
        currentLoadingDateRef.current = dateStr;
        // Show cached data INSTANTLY (don't clear todos, don't show loading)
        setTodos(filtered);
        setIsLoading(false);
        // Load fresh data in background (with error handling)
        // Use a small delay to prevent race condition with cache update
        setTimeout(() => {
          loadTodos(selectedDate, false).catch((error) => {
            console.error('[Tasks] Background load error:', error);
            // Don't crash - just log the error
          });
        }, 100);
        return; // Exit early - instant display!
      }
      
      // No memory cache - clear todos and show loading
      console.log(`[Tasks] 📅 Date changed to ${dateStr}, clearing todos and loading...`);
      setTodos([]);
      setIsLoading(true);
      
      // Set current loading date BEFORE any async operations
      currentLoadingDateRef.current = dateStr;
      
      // Load normally (will check AsyncStorage cache in loadTodos)
      loadTodos(selectedDate).catch((error) => {
        console.error('[Tasks] Load todos error in useEffect:', error);
        // Only update state if still viewing this date
        if (currentLoadingDateRef.current === dateStr) {
          setIsLoading(false);
          setTodos([]);
        }
      });
    } catch (error) {
      console.error('[Tasks] Error in useEffect:', error);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      if (currentLoadingDateRef.current === dateStr) {
        setIsLoading(false);
        setTodos([]);
      }
    }
  }, [selectedDate, isAuthenticated, user?.id, loadTodos]);

  // Simple: Add todo
  const handleAddTodo = async () => {
    if (!input.trim() || addingTodo || !isAuthenticated || !user?.id) return;
    
    const todoText = input.trim();
    const todoDate = format(selectedDate, "yyyy-MM-dd");
    const userId = user.id;
    setInput("");
    setAddingTodo(true);
    
    try {
      const newTodo = await apiClient.post<Todo>(API_ENDPOINTS.todos.create, {
        text: todoText,
        date: todoDate,
      });
      
      // Update state immediately
      setTodos(prev => {
        // Prevent duplicates - check if todo already exists
        if (prev.some(t => t.id === newTodo.id)) {
          return prev;
        }
        return [...prev, newTodo];
      });
      
      // CRITICAL: Update cache immediately so it persists when switching dates
      try {
        // Update memory cache
        const memoryKey = `${userId}_${todoDate}`;
        const memoryCached = memoryCache.get(memoryKey);
        if (memoryCached) {
          // Prevent duplicates in cache
          const existingIndex = memoryCached.todos.findIndex(t => t.id === newTodo.id);
          if (existingIndex === -1) {
            memoryCache.set(memoryKey, {
              todos: [...memoryCached.todos, newTodo],
              timestamp: Date.now(),
            });
          } else {
            // Update existing todo instead of duplicating
            memoryCache.set(memoryKey, {
              todos: memoryCached.todos.map((t, idx) => idx === existingIndex ? newTodo : t),
              timestamp: Date.now(),
            });
          }
        } else {
          // Create new cache entry
          memoryCache.set(memoryKey, {
            todos: [newTodo],
            timestamp: Date.now(),
          });
        }
        
        // Update AsyncStorage cache
        const cached = await getCachedTodos(todoDate, userId);
        if (cached) {
          // Prevent duplicates in AsyncStorage
          const existingIndex = cached.findIndex(t => t.id === newTodo.id);
          const updatedTodos = existingIndex === -1 
            ? [...cached, newTodo]
            : cached.map((t, idx) => idx === existingIndex ? newTodo : t);
          await setCachedTodos(todoDate, userId, updatedTodos);
        } else {
          await setCachedTodos(todoDate, userId, [newTodo]);
        }
        console.log(`[Tasks] ✅ Updated cache for ${todoDate} with new todo`);
      } catch (cacheError) {
        console.error("[Tasks] Cache update error:", cacheError);
        // Don't fail the operation if cache update fails
      }
    } catch (error) {
      console.error("Add todo error:", error);
      Alert.alert("Error", "Failed to add todo");
      setInput(todoText);
    } finally {
      setAddingTodo(false);
    }
  };

  // Simple: Toggle todo
  const handleToggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const newCompleted = !todo.completed;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const userId = user?.id;
    
    // Update state immediately
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    
    // Update cache immediately
    if (userId) {
      try {
        const memoryKey = `${userId}_${dateStr}`;
        const memoryCached = memoryCache.get(memoryKey);
        if (memoryCached) {
          memoryCache.set(memoryKey, {
            todos: memoryCached.todos.map(t => t.id === id ? { ...t, completed: newCompleted } : t),
            timestamp: memoryCached.timestamp,
          });
        }
        
        // Update AsyncStorage cache
        const cached = await getCachedTodos(dateStr, userId);
        if (cached) {
          const updatedTodos = cached.map(t => t.id === id ? { ...t, completed: newCompleted } : t);
          await setCachedTodos(dateStr, userId, updatedTodos);
        }
      } catch (cacheError) {
        console.error("[Tasks] Cache update error on toggle:", cacheError);
      }
    }
    
    try {
      await apiClient.put(API_ENDPOINTS.todos.update(id), { completed: newCompleted });
    } catch (error) {
      console.error("Toggle error:", error);
      // Revert state on error
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: todo.completed } : t));
      Alert.alert("Error", "Failed to update todo");
    }
  };

  // Simple: Delete todo
  const handleDeleteTodo = async (id: string) => {
    Alert.alert("Delete Todo", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const dateStr = format(selectedDate, "yyyy-MM-dd");
          const userId = user?.id;
          
          // Update state immediately
          setTodos(prev => prev.filter(t => t.id !== id));
          
          // Update cache immediately
          if (userId) {
            try {
              const memoryKey = `${userId}_${dateStr}`;
              const memoryCached = memoryCache.get(memoryKey);
              if (memoryCached) {
                memoryCache.set(memoryKey, {
                  todos: memoryCached.todos.filter(t => t.id !== id),
                  timestamp: memoryCached.timestamp,
                });
              }
              
              // Update AsyncStorage cache
              const cached = await getCachedTodos(dateStr, userId);
              if (cached) {
                const updatedTodos = cached.filter(t => t.id !== id);
                await setCachedTodos(dateStr, userId, updatedTodos);
              }
            } catch (cacheError) {
              console.error("[Tasks] Cache update error on delete:", cacheError);
            }
          }
          
          try {
            await apiClient.delete(API_ENDPOINTS.todos.delete(id));
          } catch (error) {
            console.error("Delete error:", error);
            loadTodos(selectedDate); // Reload on error
          }
        },
      },
    ]);
  };

  // Calendar helpers
  const handleDateChange = (days: number) => {
    setSelectedDate(addDays(selectedDate, days));
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setShowCalendar(false);
  };

  // Generate calendar days
  const calendarDays = (() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Pad to start on Sunday
    const firstDay = monthStart.getDay();
    const paddedDays = Array(firstDay).fill(null).concat(days);
    
    // Pad to end on Saturday (make rows of 7)
    const remaining = 7 - (paddedDays.length % 7);
    return paddedDays.concat(Array(remaining === 7 ? 0 : remaining).fill(null));
  })();

  // Safety check: Don't render if not authenticated or user not ready
  if (!isAuthenticated || !user?.id) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
        <Text className="text-lg text-gray-500">Please sign in to view your tasks</Text>
      </View>
    );
  }

  // CRITICAL: Final safety filter - ensure todos match selected date
  // This prevents any wrong-date todos from being displayed even if they somehow got into state
  const currentDateStr = format(selectedDate, "yyyy-MM-dd");
  const filteredTodos = todos.filter(todo => todo.date === currentDateStr);
  
  // CRITICAL: Use useEffect to update state if wrong-date todos are found
  // DO NOT update state during render - this causes race conditions and infinite loops
  useEffect(() => {
    if (filteredTodos.length !== todos.length) {
      console.warn(`[Tasks] ⚠️ Found ${todos.length - filteredTodos.length} todos with wrong dates in state! Filtering them out.`);
      setTodos(filteredTodos);
    }
  }, [todos.length, filteredTodos.length, currentDateStr]);
  
  const completedCount = filteredTodos.filter(t => t.completed).length;
  const totalCount = filteredTodos.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ["#4ECDC4", "#44A08D", "#7EC8E3"] : ["#4ECDC4", "#44A08D", "#7EC8E3"]}
        className="border-b"
        style={{ paddingTop: Platform.OS === "ios" ? 50 : 20, paddingBottom: 20 }}
      >
        <SafeAreaView edges={['left', 'right']}>
          <View className="px-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
                Tasks
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(true)}>
                <Ionicons name="calendar" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Date Navigation */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => handleDateChange(-1)}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCalendar(true)}>
                <Text className="text-lg font-semibold" style={{ color: "#FFFFFF" }}>
                  {format(selectedDate, "EEEE, MMMM d")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDateChange(1)}>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Progress */}
            {totalCount > 0 && (
              <View className="mt-4">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm" style={{ color: "#FFFFFF" }}>
                    {completedCount} of {totalCount} completed
                  </Text>
                  <Text className="text-sm" style={{ color: "#FFFFFF" }}>
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
                <View className="h-2 bg-white/30 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-white"
                    style={{ width: `${progress * 100}%` }}
                  />
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Todo List */}
      <ScrollView className="flex-1 px-6 pt-4">
        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#34C759" />
          </View>
        ) : filteredTodos.length === 0 ? (
          <View className="py-8 items-center">
            <Text className="text-gray-500 text-center">No tasks for this day</Text>
          </View>
        ) : (
          filteredTodos.map((todo) => (
            <TouchableOpacity
              key={todo.id}
              className="bg-white dark:bg-card-dark rounded-xl p-4 mb-3 flex-row items-center"
              onPress={() => handleToggleTodo(todo.id)}
            >
              <View className="flex-1 flex-row items-center">
                <Ionicons
                  name={todo.completed ? "checkbox" : "square-outline"}
                  size={24}
                  color={todo.completed ? "#34C759" : "#8E8E93"}
                />
                <Text
                  className={`ml-3 flex-1 ${todo.completed ? "line-through text-gray-400" : ""}`}
                >
                  {todo.text}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteTodo(todo.id)}
                className="ml-2 p-2"
              >
                <Ionicons name="trash" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View className="px-6 pb-6 pt-4 bg-white dark:bg-card-dark border-t border-gray-200 dark:border-gray-800">
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 mr-2"
              placeholder="Add a task..."
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleAddTodo}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleAddTodo}
              disabled={!input.trim() || addingTodo}
              className="bg-green-500 rounded-xl px-6 py-3"
              style={{ opacity: !input.trim() || addingTodo ? 0.5 : 1 }}
            >
              {addingTodo ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="add" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <TouchableOpacity
            className="bg-white dark:bg-card-dark rounded-2xl p-6 m-4"
            style={{ width: SCREEN_WIDTH - 48 }}
            activeOpacity={1}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold">{format(selectedDate, "MMMM yyyy")}</Text>
              <TouchableOpacity onPress={goToToday}>
                <Text className="text-green-500 font-semibold">Today</Text>
              </TouchableOpacity>
            </View>
            
            {/* Day headers */}
            <View className="flex-row mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <View key={day} className="flex-1 items-center">
                  <Text className="text-xs text-gray-500 font-semibold">{day}</Text>
                </View>
              ))}
            </View>
            
            {/* Calendar grid */}
            <View className="flex-row flex-wrap">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} className="w-[14.28%] aspect-square" />;
                }
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    className="w-[14.28%] aspect-square items-center justify-center"
                    onPress={() => handleSelectDate(date)}
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        isSelected ? "bg-green-500" : isTodayDate ? "bg-green-100 dark:bg-green-900" : ""
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          isSelected ? "text-white font-bold" : isTodayDate ? "text-green-600 dark:text-green-400 font-semibold" : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {format(date, "d")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

