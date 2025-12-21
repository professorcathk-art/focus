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

  // Load todos for selected date with INSTANT cache display
  const loadTodos = useCallback(async (date: Date, skipCache = false) => {
    // Safety checks
    if (!isAuthenticated || !user?.id) {
      console.warn('[Tasks] Cannot load todos: not authenticated or no user');
      return;
    }
    
    if (fetchingRef.current) {
      console.log('[Tasks] Already fetching, skipping...');
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
          // Only update if still viewing the same date
          if (format(selectedDate, "yyyy-MM-dd") === dateStr) {
            setTodos(filteredData);
          }
        } catch (error) {
          console.error("Background refresh error:", error);
        } finally {
          fetchingRef.current = false;
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
            if (format(selectedDate, "yyyy-MM-dd") === dateStr) {
              setTodos(filteredData);
            }
          } catch (error) {
            console.error("Background refresh error:", error);
          } finally {
            fetchingRef.current = false;
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
      setTodos(filtered);
    } catch (error) {
      console.error("Load todos error:", error);
      setTodos([]);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [isAuthenticated, user?.id, selectedDate]);

  // Load todos when date changes - with instant cache check
  useEffect(() => {
    // Safety check: don't run if not authenticated or user not ready
    if (!isAuthenticated || !user?.id) {
      setTodos([]);
      setIsLoading(false);
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
      
      // INSTANT: Check memory cache synchronously FIRST (before any async operations)
      const memoryKey = `${userId}_${dateStr}`;
      const memoryCached = memoryCache.get(memoryKey);
      if (memoryCached && Date.now() - memoryCached.timestamp < 30 * 60 * 1000) {
        const filtered = memoryCached.todos.filter(todo => todo.date === dateStr);
        if (filtered.length > 0) {
          console.log(`[Tasks] ⚡ INSTANT on date change: Showing ${filtered.length} tasks`);
          setTodos(filtered);
          setIsLoading(false);
          // Load fresh data in background (with error handling)
          loadTodos(selectedDate, false).catch((error) => {
            console.error('[Tasks] Background load error:', error);
            // Don't crash - just log the error
          });
          return; // Exit early - instant display!
        }
      }
      
      // No memory cache - load normally (will check AsyncStorage cache in loadTodos)
      loadTodos(selectedDate).catch((error) => {
        console.error('[Tasks] Load todos error in useEffect:', error);
        setIsLoading(false);
        setTodos([]);
      });
    } catch (error) {
      console.error('[Tasks] Error in useEffect:', error);
      setIsLoading(false);
      setTodos([]);
    }
  }, [selectedDate, isAuthenticated, user?.id, loadTodos]);

  // Simple: Add todo
  const handleAddTodo = async () => {
    if (!input.trim() || addingTodo || !isAuthenticated || !user?.id) return;
    
    const todoText = input.trim();
    const todoDate = format(selectedDate, "yyyy-MM-dd");
    setInput("");
    setAddingTodo(true);
    
    try {
      const newTodo = await apiClient.post<Todo>(API_ENDPOINTS.todos.create, {
        text: todoText,
        date: todoDate,
      });
      setTodos(prev => [...prev, newTodo]);
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
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    
    try {
      await apiClient.put(API_ENDPOINTS.todos.update(id), { completed: newCompleted });
    } catch (error) {
      console.error("Toggle error:", error);
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
          setTodos(prev => prev.filter(t => t.id !== id));
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

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
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
        ) : todos.length === 0 ? (
          <View className="py-8 items-center">
            <Text className="text-gray-500 text-center">No tasks for this day</Text>
          </View>
        ) : (
          todos.map((todo) => (
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

