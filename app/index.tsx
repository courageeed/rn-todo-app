import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Checkbox } from "expo-checkbox";
import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";

type ToDoType = {
  id: number;
  title: string;
  isDone: boolean;
};

export default function Index() {
  const [todos, setTodos] = useState<ToDoType[]>([]);
  const [todoText, setTodoText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "done" | "undone">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");

  // Load todos from AsyncStorage
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const stored = await AsyncStorage.getItem("my-todo");
        if (stored) setTodos(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading todos:", error);
      }
    };
    loadTodos();
  }, []);

  const saveTodos = useCallback(async (newTodos: ToDoType[]) => {
    try {
      await AsyncStorage.setItem("my-todo", JSON.stringify(newTodos));
    } catch (error) {
      console.error("Error saving todos:", error);
    }
  }, []);

  const addTodo = useCallback(async () => {
    if (!todoText.trim()) {
      alert("Please enter todo content!");
      return;
    }
    const newTodo: ToDoType = {
      id: Date.now(),
      title: todoText.trim(),
      isDone: false,
    };
    const updatedTodos = [newTodo, ...todos];
    setTodos(updatedTodos);
    await saveTodos(updatedTodos);
    setTodoText("");
    Keyboard.dismiss();
  }, [todoText, todos, saveTodos]);

  const deleteTodo = useCallback(
    async (id: number) => {
      const updatedTodos = todos.filter((todo) => todo.id !== id);
      setTodos(updatedTodos);
      await saveTodos(updatedTodos);
      Toast.show({
        type: "success",
        text1: "Todo deleted!",
        visibilityTime: 2000,
      });
    },
    [todos, saveTodos]
  );

  const handleDone = useCallback(
    async (id: number) => {
      const updatedTodos = todos.map((todo) =>
        todo.id === id ? { ...todo, isDone: !todo.isDone } : todo
      );
      updatedTodos.sort((a, b) => (a.isDone ? 1 : 0) - (b.isDone ? 1 : 0));
      setTodos(updatedTodos);
      await saveTodos(updatedTodos);
    },
    [todos, saveTodos]
  );

  const startEdit = useCallback((id: number, title: string) => {
    setEditingId(id);
    setEditText(title);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  const editTodo = useCallback(
    async (id: number) => {
      if (!editText.trim()) {
        alert("Please enter todo content!");
        return;
      }
      const updatedTodos = todos.map((todo) =>
        todo.id === id ? { ...todo, title: editText.trim() } : todo
      );
      setTodos(updatedTodos);
      await saveTodos(updatedTodos);
      setEditingId(null);
      setEditText("");
      Keyboard.dismiss();
    },
    [editText, todos, saveTodos]
  );

  const filteredTodos = useMemo(() => {
    let result = todos;
    if (filter === "done") result = todos.filter((todo) => todo.isDone);
    else if (filter === "undone") result = todos.filter((todo) => !todo.isDone);

    if (searchQuery)
      result = result.filter((todo) =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return result;
  }, [todos, filter, searchQuery]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => alert("Menu clicked!")}>
            <Ionicons name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => alert("Avatar clicked!")}>
            <Image
              source={{ uri: "https://xsgames.co/randomusers/avatar.php?g=male" }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>

        {/* Filter */}
        <View style={styles.filterContainer}>
          <Picker
            selectedValue={filter}
            onValueChange={(itemValue) => setFilter(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="All" value="all" />
            <Picker.Item label="Done" value="done" />
            <Picker.Item label="Undone" value="undone" />
          </Picker>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={24} color="#333" />
          <TextInput
            placeholder="Search todo..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="always"
          />
        </View>

        {/* Todo List */}
        <FlatList
          data={filteredTodos}
          extraData={editingId}
          keyExtractor={(item) => item.id.toString()}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          renderItem={({ item }) => (
            <ToDoItem
              todo={item}
              onDelete={deleteTodo}
              onToggleDone={handleDone}
              editingId={editingId}
              editText={editText}
              onEditTextChange={setEditText}
              onStartEdit={startEdit}
              onEdit={editTodo}
              onCancelEdit={cancelEdit}
            />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No todos!</Text>}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <TextInput
            placeholder="Add new todo..."
            value={todoText}
            onChangeText={setTodoText}
            style={styles.newTodoInput}
            autoCorrect={false}
            onSubmitEditing={addTodo}
          />
          <TouchableOpacity style={styles.addButton} onPress={addTodo}>
            <Ionicons name="add" size={34} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// TodoItem component
const ToDoItem = ({
  todo,
  onDelete,
  onToggleDone,
  editingId,
  editText,
  onEditTextChange,
  onStartEdit,
  onEdit,
  onCancelEdit,
}: {
  todo: ToDoType;
  onDelete: (id: number) => void;
  onToggleDone: (id: number) => void;
  editingId: number | null;
  editText: string;
  onEditTextChange: (text: string) => void;
  onStartEdit: (id: number, title: string) => void;
  onEdit: (id: number) => void;
  onCancelEdit: () => void;
}) => {
  const isEditing = editingId === todo.id;

  return (
    <View style={styles.todoContainer}>
      <View style={styles.todoInfoContainer}>
        <Checkbox
          value={todo.isDone}
          onValueChange={() => onToggleDone(todo.id)}
          color={todo.isDone ? "#4630EB" : "#ccc"}
        />
        {isEditing ? (
          <TextInput
            value={editText}
            onChangeText={onEditTextChange}
            style={styles.editInput}
            autoFocus
            onSubmitEditing={() => onEdit(todo.id)}
          />
        ) : (
          <Text style={[styles.todoText, todo.isDone && styles.doneText]}>
            {todo.title}
          </Text>
        )}
      </View>
      <View style={styles.actionContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity onPress={() => onEdit(todo.id)}>
              <Ionicons name="checkmark" size={24} color="green" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancelEdit}>
              <Ionicons name="close" size={24} color="red" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => onStartEdit(todo.id, todo.title)}>
              <Ionicons name="pencil" size={24} color="blue" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(todo.id)}>
              <Ionicons name="trash" size={24} color="red" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

// Styles (giữ nguyên)
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  filterContainer: { backgroundColor: "#fff", borderRadius: 10, marginBottom: 20 },
  picker: { height: 50, width: "100%" },
  searchBar: { flexDirection: "row", backgroundColor: "#fff", alignItems: "center", paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 16 : 8, borderRadius: 10, gap: 10, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  todoContainer: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: 16, borderRadius: 10, marginBottom: 20 },
  todoInfoContainer: { flexDirection: "row", gap: 10, alignItems: "center", flex: 1 },
  todoText: { fontSize: 16, color: "#333" },
  doneText: { textDecorationLine: "line-through" },
  editInput: { flex: 1, fontSize: 16, color: "#333", borderBottomWidth: 1, borderBottomColor: "#4630EB" },
  actionContainer: { flexDirection: "row", gap: 10 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  newTodoInput: { flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 10, fontSize: 16, color: "#333" },
  addButton: { backgroundColor: "#4630EB", padding: 8, borderRadius: 10, marginLeft: 20 },
  emptyText: { textAlign: "center", fontSize: 16, color: "#999", marginTop: 20 },
});
