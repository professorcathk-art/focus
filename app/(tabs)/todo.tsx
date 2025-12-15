import { useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import { Todo } from "@/types";
import { format, isToday, addDays, startOfDay } from "date-fns";

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
  const [resettingTodos, setResettingTodos] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  const [lastMoveDate, setLastMoveDate] = useState<string | null>(null);

  const moveIncompleteTasks = async () => {
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      
      // Only move if we haven't moved today yet
      if (lastMoveDate === todayStr) {
        console.log("[TodoScreen] Already moved tasks today, skipping");
        return;
      }

      const result = await apiClient.post<{ success: boolean; moved: number; message?: string }>(
        API_ENDPOINTS.todos.moveIncompleteToNextDay
      );
      
      if (result.success) {
        setLastMoveDate(todayStr);
        console.log(`[TodoScreen] Moved ${result.moved} incomplete tasks to today`);
        // Reload todos after moving
        await loadTodos();
      }
    } catch (error) {
      // Silently fail - this is a background operation
      console.error("Move incomplete tasks error:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Only auto-move incomplete tasks when viewing today's date
      // And only if it's past midnight (at least 1 hour into the day)
      if (isToday(selectedDate)) {
        const now = new Date();
        const hoursSinceMidnight = now.getHours() + (now.getMinutes() / 60);
        
        // Only move if it's past 1 AM (to ensure it's a new day)
        if (hoursSinceMidnight >= 1) {
          moveIncompleteTasks();
        }
      }
      loadTodos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, selectedDate]);

  const loadTodos = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const endpoint = API_ENDPOINTS.todos.today(dateStr);
      const data = await apiClient.get<Todo[]>(endpoint);
      setTodos(data);
    } catch (error) {
      console.error("Load todos error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

    try {
      const newTodo = await apiClient.post<Todo>(API_ENDPOINTS.todos.create, {
        text: todoText,
        date: todoDate, // Use selected date (can be today or future date)
      });
      // Replace temp todo with real one using functional update
      setTodos(prevTodos => prevTodos.map(t => t.id === tempId ? newTodo : t));
    } catch (error) {
      console.error("Add todo error:", error);
      // Revert optimistic update
      setTodos(prevTodos => prevTodos.filter(t => t.id !== tempId));
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
    setTodos(prevTodos => prevTodos.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)));
    setTogglingTodoId(id);

    try {
      const updatedTodo = await apiClient.put<Todo>(
        API_ENDPOINTS.todos.update(id),
        { completed: newCompleted }
      );
      setTodos(prevTodos => prevTodos.map((t) => (t.id === id ? updatedTodo : t)));
    } catch (error) {
      console.error("Toggle todo error:", error);
      // Revert optimistic update
      setTodos(prevTodos => prevTodos.map((t) => (t.id === id ? { ...t, completed } : t)));
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
            
            // Optimistic update - remove from list
            setTodos(prevTodos => prevTodos.filter((t) => t.id !== id));
            setDeletingTodoId(id);

            try {
              await apiClient.delete(API_ENDPOINTS.todos.delete(id));
            } catch (error) {
              console.error("Delete todo error:", error);
              // Revert optimistic update
              if (deletedTodo) {
                setTodos(prevTodos => [...prevTodos, deletedTodo]);
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

  const handleResetToday = async () => {
    if (!isAuthenticated || resettingTodos) return;

    Alert.alert(
      "Reset Today's Tasks",
      "This will mark all tasks as incomplete. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            setResettingTodos(true);
            try {
              await apiClient.post(API_ENDPOINTS.todos.resetToday);
              await loadTodos();
            } catch (error) {
              console.error("Reset todos error:", error);
              Alert.alert("Error", "Failed to reset todos");
            } finally {
              setResettingTodos(false);
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
        <View
          className="px-6 py-4 border-b"
          style={{
            backgroundColor: isDark ? "#000000" : "#E8F5E9",
            borderBottomColor: isDark ? "#38383A" : "#E5E5EA",
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => handleDateChange(-1)}
                  className="p-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-back" size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleOpenCalendar}
                  className="flex-1"
                  activeOpacity={0.7}
                >
                  <Text className="text-2xl font-bold text-black dark:text-white text-center">
                    {isToday(selectedDate) ? "Today's Tasks" : format(selectedDate, "EEEE, MMMM d")}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
                    {isToday(selectedDate) ? format(selectedDate, "EEEE, MMMM d") : format(selectedDate, "yyyy-MM-dd")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDateChange(1)}
                  className="p-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-forward" size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                </TouchableOpacity>
              </View>
              {!isToday(selectedDate) && (
                <TouchableOpacity
                  onPress={goToToday}
                  className="mt-2 self-center"
                >
                  <Text className="text-xs text-green-600 dark:text-green-400">
                    Go to Today
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {totalCount > 0 && isToday(selectedDate) && (
              <TouchableOpacity
                onPress={handleResetToday}
                className="px-3 py-1.5 rounded-full ml-2"
                style={{ backgroundColor: isDark ? "#38383A" : "#FFFFFF" }}
                disabled={resettingTodos}
              >
                {resettingTodos ? (
                  <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#000000"} />
                ) : (
                  <Ionicons name="refresh" size={18} color={isDark ? "#FFFFFF" : "#000000"} />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <View className="mt-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </Text>
                <Text className="text-sm font-semibold text-green-600 dark:text-green-400">
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
                      {rows.map((row, rowIndex) => (
                        <View key={rowIndex} className="flex-row mb-1">
                          {row.map((date, colIndex) => {
                            if (!date) {
                              return <View key={`${rowIndex}-${colIndex}`} className="flex-1 h-10" />;
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
                      ))}
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

