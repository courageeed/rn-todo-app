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
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the data type for a todo item
type ToDoType = {
  id: number;
  title: string;
  isDone: boolean;
};

export default function Index() {
  // Sample data (not used directly, just for reference)
  const todoData = [
    {
      id: 1,
      title: "Todo 1",
      isDone: false,
    },
    {
      id: 2,
      title: "Todo 2",
      isDone: false,
    },
    {
      id: 3,
      title: "Todo 3",
      isDone: false,
    },
    {
      id: 4,
      title: "Todo 4",
      isDone: true,
    },
    {
      id: 5,
      title: "Todo 5",
      isDone: false,
    },
    {
      id: 6,
      title: "Todo 6",
      isDone: false,
    },
  ];

  // State to manage the list of displayed todos
  const [todos, setTodos] = useState<ToDoType[]>([]);
  // State for the text input when adding a todo
  const [todoText, setTodoText] = useState<string>("");
  // State for the search query
  const [searchQuery, setSearchQuery] = useState<string>("");
  // State for the original list of todos (to restore when searching)
  const [oldTodos, setOldTodos] = useState<ToDoType[]>([]);

  // useEffect to load data from AsyncStorage when component mounts
  useEffect(() => {
    const getTodos = async () => {
      try {
        const storedTodos = await AsyncStorage.getItem("my-todo");
        if (storedTodos !== null) {
          const parsedTodos = JSON.parse(storedTodos);
          setTodos(parsedTodos);
          setOldTodos(parsedTodos);
        }
      } catch (error) {
        console.log("Error loading todos:", error);
      }
    };
    getTodos();
  }, []);

  // Function to add a new todo
  const addTodo = async () => {
    // Check if text is empty, do not add
    if (todoText.trim() === "") {
      alert("Please enter todo content!");
      return;
    }

    // Create a new todo with a unique ID (use Date.now() instead of Math.random() to avoid duplicates)
    const newTodo: ToDoType = {
      id: Date.now(), // ID based on timestamp, ensures uniqueness
      title: todoText.trim(),
      isDone: false,
    };

    // Update the list
    const newTodos = [...oldTodos, newTodo];
    setOldTodos(newTodos);
    setTodos(newTodos);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem("my-todo", JSON.stringify(newTodos));
    } catch (error) {
      console.log("Error saving todo:", error);
    }

    // Reset input and hide keyboard
    setTodoText("");
    Keyboard.dismiss();
  };

  // Function to delete todo by ID
  const deleteTodo = async (id: number) => {
    try {
      const newTodos = oldTodos.filter((todo) => todo.id !== id);
      setOldTodos(newTodos);
      setTodos(newTodos); // Update the displayed list
      await AsyncStorage.setItem("my-todo", JSON.stringify(newTodos));
      alert("Todo deleted!");
    } catch (error) {
      console.log("Error deleting todo:", error);
    }
  };

  // Function to mark as done/not done
  const handleDone = async (id: number) => {
    const newTodos = oldTodos.map((todo) =>
      todo.id === id ? { ...todo, isDone: !todo.isDone } : todo
    );
    setOldTodos(newTodos);
    setTodos(newTodos);
    try {
      await AsyncStorage.setItem("my-todo", JSON.stringify(newTodos));
    } catch (error) {
      console.log("Error updating status:", error);
    }
  };

  // Function to search todos
  const onSearch = (query: string) => {
    if (query === "") {
      setTodos(oldTodos); // Display all if not searching
    } else {
      const filteredTodos = oldTodos.filter((todo) =>
        todo.title.toLowerCase().includes(query.toLowerCase())
      );
      setTodos(filteredTodos);
    }
  };

  // useEffect to call onSearch whenever searchQuery changes
  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with menu and avatar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => alert("Menu clicked!")}>
          <Ionicons name="menu" size={24} color={"#333"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => alert("Avatar clicked!")}>
          <Image
            source={{ uri: "https://xsgames.co/randomusers/avatar.php?g=male" }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={24} color={"#333"} />
        <TextInput
          placeholder="Search todo..."
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
          style={styles.searchInput}
          clearButtonMode="always"
        />
      </View>

      {/* List of todos */}
      <FlatList
        data={[...todos].reverse()} // Reverse to display newest on top
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ToDoItem
            todo={item}
            deleteTodo={deleteTodo}
            handleDone={handleDone}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No todos!</Text>} // Display when list is empty
      />

      {/* Footer with input box and add button */}
      <KeyboardAvoidingView
        style={styles.footer}
        behavior="padding"
        keyboardVerticalOffset={10}
      >
        <TextInput
          placeholder="Add new todo..."
          value={todoText}
          onChangeText={(text) => setTodoText(text)}
          style={styles.newTodoInput}
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Ionicons name="add" size={34} color={"#fff"} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Child component to render each todo item
const ToDoItem = ({
  todo,
  deleteTodo,
  handleDone,
}: {
  todo: ToDoType;
  deleteTodo: (id: number) => void;
  handleDone: (id: number) => void;
}) => (
  <View style={styles.todoContainer}>
    <View style={styles.todoInfoContainer}>
      <Checkbox
        value={todo.isDone}
        onValueChange={() => handleDone(todo.id)}
        color={todo.isDone ? "#4630EB" : "#ccc"} // Add default color when not done
      />
      <Text
        style={[
          styles.todoText,
          todo.isDone && { textDecorationLine: "line-through" },
        ]}
      >
        {todo.title}
      </Text>
    </View>
    <TouchableOpacity onPress={() => deleteTodo(todo.id)}>
      <Ionicons name="trash" size={24} color={"red"} />
    </TouchableOpacity>
  </View>
);

// Styles for the interface
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 16 : 8,
    borderRadius: 10,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  todoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  todoInfoContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  todoText: {
    fontSize: 16,
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    bottom: 20,
  },
  newTodoInput: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    fontSize: 16,
    color: "#333",
  },
  addButton: {
    backgroundColor: "#4630EB",
    padding: 8,
    borderRadius: 10,
    marginLeft: 20,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 20,
  },
});