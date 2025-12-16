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
} from "@/lib/todos-cache";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TodoScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAuthenticated } = useAuthStore();
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

  const loadTodos = useCallback(async (useCache = true) => {
    if (!isAuthenticated) return;
    
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log("[TodoScreen] ⏭️ Fetch already in progress, skipping...");
      return;
    }
    
    fetchingRef.current = true;
    setIsLoading(true);
    
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      // Try cache first for instant UI update
      if (useCache) {
        const cachedTodos = await getAllTodosIncludingPending(dateStr);
        if (cachedTodos !== null) {
          // Show cached data immediately
          setTodos(cachedTodos);
          setIsLoading(false);
          
          // Fetch from API in background (non-blocking)
          // Don't await - let it update cache and state when done
          apiClient.get<Todo[]>(API_ENDPOINTS.todos.today(dateStr))
            .then(async (data) => {
              await setCachedTodos(dateStr, data);
              setTodos(data);
            })
            .catch((error) => {
              console.error("[TodoScreen] Background refresh error:", error);
              // Keep using cached data on error
            });
          
          // Return early - we have cache, API will update in background
          fetchingRef.current = false;
          return;
        }
      }

      // No cache available - fetch from API (blocking)
      const endpoint = API_ENDPOINTS.todos.today(dateStr);
      const data = await apiClient.get<Todo[]>(endpoint);
      
      // Update cache and state
      await setCachedTodos(dateStr, data);
      setTodos(data);
    } catch (error) {
      console.error("Load todos error:", error);
      // If API fails but we have cache, keep using it
      const cachedTodos = await getAllTodosIncludingPending(dateStr);
      if (cachedTodos !== null) {
        setTodos(cachedTodos);
        console.log("[TodoScreen] API failed but using cached data");
      }
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [isAuthenticated, selectedDate]);

  const moveIncompleteTasks = async () => {
    // Prevent multiple simultaneous calls
    if (isMovingTasks) {
      console.log("[TodoScreen] Move already in progress, skipping");
      return;
    }

    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      
      // Only move if we haven't moved today yet
      if (lastMoveDate === todayStr) {
        console.log("[TodoScreen] Already moved tasks today, skipping");
        return;
      }

      setIsMovingTasks(true);
      console.log("[TodoScreen] Calling move-incomplete endpoint...");
      
      const result = await apiClient.post<{ success: boolean; moved: number; message?: string }>(
        API_ENDPOINTS.todos.moveIncompleteToNextDay
      );
      
      if (result.success) {
        setLastMoveDate(todayStr);
        console.log(`[TodoScreen] ✅ Moved ${result.moved} incomplete tasks to today`);
        // Clear cache for yesterday and today since tasks were moved
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = format(yesterday, "yyyy-MM-dd");
        await clearCacheForDate(yesterdayStr);
        await clearCacheForDate(todayStr);
        // Reload todos after moving
        await loadTodos();
      }
    } catch (error) {
      // Log error but don't show to user - this is a background operation
      console.error("Move incomplete tasks error:", error);
      // Don't set lastMoveDate on error so it can retry
    } finally {
      setIsMovingTasks(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Always load todos for the selected date (with cache)
    loadTodos(true);
    
    // Only auto-move incomplete tasks when viewing today's date
    // And only if it's past midnight (at least 1 hour into the day)
    // And only once per day
    if (isToday(selectedDate)) {
      const now = new Date();
      const hoursSinceMidnight = now.getHours() + (now.getMinutes() / 60);
      const todayStr = format(now, "yyyy-MM-dd");
      
      // Only move if:
      // 1. It's past 1 AM (to ensure it's a new day)
      // 2. We haven't moved today yet
      // 3. Not already moving
      if (hoursSinceMidnight >= 1 && lastMoveDate !== todayStr && !isMovingTasks) {
        console.log("[TodoScreen] Conditions met for auto-move, calling moveIncompleteTasks");
        moveIncompleteTasks();
      }
    }
  }, [isAuthenticated, selectedDate, loadTodos]);

  const handleDateChange = (days: number) => {
    setSelectedDate(addDays(selectedDate, days));
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setShowCalendarModal(false);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleOpenCalendar = () => {
    // Sync calendar month/year with selected date when opening
    setCalendarYear(selectedDate.getFullYear());
    setCalendarMonth(selectedDate.getMonth());
    setShowCalendarModal(true);
  };

  const handleAddTodo = async () => {
    if (!input.trim() || !isAuthenticated || addingTodo) return;

    const tempId = `temp-${Date.now()}`;
    const todoText = input.trim();
    const todoDate = format(selectedDate, "yyyy-MM-dd"); // Use selected date
    
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
    const cachedTodos = await getAllTodosIncludingPending(todoDate);
    if (cachedTodos) {
      await setCachedTodos(todoDate, [...cachedTodos, tempTodo]);
    }

    try {
      const newTodo = await apiClient.post<Todo>(API_ENDPOINTS.todos.create, {
        text: todoText,
        date: todoDate, // Use selected date (can be today or future date)
      });
      // Replace temp todo with real one using functional update
      setTodos(prevTodos => prevTodos.map(t => t.id === tempId ? newTodo : t));
      // Update cache with real todo
      const updatedCached = await getAllTodosIncludingPending(todoDate);
      if (updatedCached) {
        const finalTodos = updatedCached.map(t => t.id === tempId ? newTodo : t);
        await setCachedTodos(todoDate, finalTodos);
      }
    } catch (error) {
      console.error("Add todo error:", error);
      // Revert optimistic update
      setTodos(prevTodos => prevTodos.filter(t => t.id !== tempId));
      // Revert cache
      const cachedTodos = await getAllTodosIncludingPending(todoDate);
      if (cachedTodos) {
        await setCachedTodos(todoDate, cachedTodos.filter(t => t.id !== tempId));
      }
      setInput(todoText);
      Alert.alert("Error", "Failed to add todo");
    } finally {
      setAddingTodo(false);
    }
  };


  const handleToggleTodo = async (id: string, completed: boolean) => {
    if (!isAuthenticated || togglingTodoId === id) return;

    // Optimistic update
    const newCompleted = !completed;
    const todoDate = todos.find(t => t.id === id)?.date || format(selectedDate, "yyyy-MM-dd");
    setTodos(prevTodos => prevTodos.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)));
    // Update cache optimistically
    const cachedTodos = await getAllTodosIncludingPending(todoDate);
    if (cachedTodos) {
      const updatedCached = cachedTodos.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t));
      await setCachedTodos(todoDate, updatedCached);
    }
    setTogglingTodoId(id);

    try {
      const updatedTodo = await apiClient.put<Todo>(
        API_ENDPOINTS.todos.update(id),
        { completed: newCompleted }
      );
      setTodos(prevTodos => prevTodos.map((t) => (t.id === id ? updatedTodo : t)));
      // Update cache with real todo
      const cachedTodos = await getAllTodosIncludingPending(todoDate);
      if (cachedTodos) {
        const finalTodos = cachedTodos.map((t) => (t.id === id ? updatedTodo : t));
        await setCachedTodos(todoDate, finalTodos);
      }
    } catch (error) {
      console.error("Toggle todo error:", error);
      // Revert optimistic update
      setTodos(prevTodos => prevTodos.map((t) => (t.id === id ? { ...t, completed } : t)));
      // Revert cache
      const cachedTodos = await getAllTodosIncludingPending(todoDate);
      if (cachedTodos) {
        const revertedCached = cachedTodos.map((t) => (t.id === id ? { ...t, completed } : t));
        await setCachedTodos(todoDate, revertedCached);
      }
      Alert.alert("Error", "Failed to update todo");
    } finally {
      setTogglingTodoId(null);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!isAuthenticated || deletingTodoId === id) return;

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
            
            // Optimistic update - remove from list
            setTodos(prevTodos => prevTodos.filter((t) => t.id !== id));
            // Update cache optimistically
            const cachedTodos = await getAllTodosIncludingPending(todoDate);
            if (cachedTodos) {
              await setCachedTodos(todoDate, cachedTodos.filter((t) => t.id !== id));
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
                const cachedTodos = await getAllTodosIncludingPending(todoDate);
                if (cachedTodos) {
                  await setCachedTodos(todoDate, [...cachedTodos, deletedTodo]);
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#F5F5F7" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <LinearGradient
          colors={isDark 
            ? ["#0A0A0A", "#1A1A2E", "#16213E"] 
            : ["#A8E6CF", "#88D8C0", "#7EC8E3", "#4ECDC4"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 py-5 border-b"
          style={{
            borderBottomColor: isDark ? "#38383A" : "rgba(255,255,255,0.3)",
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => handleDateChange(-1)}
                  className="p-2 rounded-full"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)" }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-back" size={20} color={isDark ? "#FFFFFF" : "#1A1A1A"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleOpenCalendar}
                  className="flex-1"
                  activeOpacity={0.7}
                >
                  <Text className="text-2xl font-bold text-white dark:text-white text-center" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                    {isToday(selectedDate) ? "Today's Tasks" : format(selectedDate, "EEEE, MMMM d")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDateChange(1)}
                  className="p-2 rounded-full"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)" }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-forward" size={20} color={isDark ? "#FFFFFF" : "#1A1A1A"} />
                </TouchableOpacity>
              </View>
              {!isToday(selectedDate) && (
                <TouchableOpacity
                  onPress={goToToday}
                  className="mt-2 self-center"
                >
                  <Text className="text-xs font-medium text-white" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                    Go to Today
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <View className="mt-4">
              <View className="flex-row items-center justify-between mb-2">
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
                    backgroundColor: "#FF6B9D",
                  }}
                />
              </View>
            </View>
          )}
        </LinearGradient>

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
            todos.map((todo) => (
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
                    <ActivityIndicator size="small" color="#FF6B9D" />
                  ) : (
                    <View
                      className="w-6 h-6 rounded-full border-2 items-center justify-center"
                      style={{
                        borderColor: todo.completed ? "#FF6B9D" : "#D1D1D6",
                        backgroundColor: todo.completed ? "#FF6B9D" : "transparent",
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
                    ? "#FF6B9D"
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
                  {format(new Date(calendarYear, calendarMonth, 1), "MMMM yyyy")}
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
              <View className="mb-4">
                {/* Day headers */}
                <View className="flex-row mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <View key={day} className="flex-1 items-center">
                      <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {day}
                      </Text>
                    </View>
                  ))}
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

                  return (
                    <View>
                      {rows.map((row, rowIndex) => {
                        const isLastRow = rowIndex === rows.length - 1;
                        const firstNonNullIndex = row.findIndex(d => d !== null);
                        const lastRowDates = row.filter(d => d !== null);
                        return (
                          <View 
                            key={rowIndex} 
                            className="flex-row mb-1"
                            style={isLastRow && firstNonNullIndex > 0 ? { justifyContent: 'flex-start' } : {}}
                          >
                            {row.map((date, colIndex) => {
                              if (!date) {
                                // For last row, skip empty cells at the start
                                if (isLastRow && colIndex < firstNonNullIndex) {
                                  return null;
                                }
                                // For other rows or empty cells after dates, render placeholder
                                return <View key={`${rowIndex}-${colIndex}`} className="flex-1 h-10" style={{ minWidth: (SCREEN_WIDTH - 48) / 7 }} />;
                              }
                            const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                            const isTodayDate = isToday(date);
                            const isPast = date < startOfDay(new Date()) && !isTodayDate;

                            return (
                              <TouchableOpacity
                                key={`${rowIndex}-${colIndex}`}
                                onPress={() => handleSelectDate(date)}
                                className="flex-1 h-10 items-center justify-center rounded-lg mx-0.5"
                                style={{
                                  backgroundColor: isSelected
                                    ? "#FF6B9D"
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
    </SafeAreaView>
  );
}

