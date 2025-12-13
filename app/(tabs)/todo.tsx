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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/config/api";
import { Todo } from "@/types";
import { format, isToday } from "date-fns";

export default function TodoScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAuthenticated } = useAuthStore();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [addingTodo, setAddingTodo] = useState(false);
  const [togglingTodoId, setTogglingTodoId] = useState<string | null>(null);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);
  const [resettingTodos, setResettingTodos] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadTodos();
    }
  }, [isAuthenticated]);

  const loadTodos = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const data = await apiClient.get<Todo[]>(API_ENDPOINTS.todos.today);
      setTodos(data);
    } catch (error) {
      console.error("Load todos error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!input.trim() || !isAuthenticated || addingTodo) return;

    const tempId = `temp-${Date.now()}`;
    const tempTodo: Todo = {
      id: tempId,
      text: input.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    setTodos([...todos, tempTodo]);
    setInput("");
    Keyboard.dismiss();
    setAddingTodo(true);

    try {
      const newTodo = await apiClient.post<Todo>(API_ENDPOINTS.todos.create, {
        text: tempTodo.text,
      });
      // Replace temp todo with real one
      setTodos(todos.map(t => t.id === tempId ? newTodo : t));
    } catch (error) {
      console.error("Add todo error:", error);
      // Revert optimistic update
      setTodos(todos.filter(t => t.id !== tempId));
      setInput(tempTodo.text);
      Alert.alert("Error", "Failed to add todo");
    } finally {
      setAddingTodo(false);
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    if (!isAuthenticated || togglingTodoId === id) return;

    // Optimistic update
    const newCompleted = !completed;
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)));
    setTogglingTodoId(id);

    try {
      const updatedTodo = await apiClient.put<Todo>(
        API_ENDPOINTS.todos.update(id),
        { completed: newCompleted }
      );
      setTodos(todos.map((t) => (t.id === id ? updatedTodo : t)));
    } catch (error) {
      console.error("Toggle todo error:", error);
      // Revert optimistic update
      setTodos(todos.map((t) => (t.id === id ? { ...t, completed } : t)));
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
            // Optimistic update
            const deletedTodo = todos.find(t => t.id === id);
            setTodos(todos.filter((t) => t.id !== id));
            setDeletingTodoId(id);

            try {
              await apiClient.delete(API_ENDPOINTS.todos.delete(id));
            } catch (error) {
              console.error("Delete todo error:", error);
              // Revert optimistic update
              if (deletedTodo) {
                setTodos([...todos]);
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
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
            <View>
              <Text className="text-2xl font-bold text-black dark:text-white">
                Today's Tasks
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {format(new Date(), "EEEE, MMMM d")}
              </Text>
            </View>
            {totalCount > 0 && (
              <TouchableOpacity
                onPress={handleResetToday}
                className="px-3 py-1.5 rounded-full"
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
                  className="mr-3"
                  disabled={togglingTodoId === todo.id}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

