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

// Định nghĩa kiểu dữ liệu cho một todo item
type ToDoType = {
  id: number;
  title: string;
  isDone: boolean;
};

export default function Index() {
  // Dữ liệu mẫu (không dùng trực tiếp, chỉ để tham khảo)
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

  // State để quản lý danh sách todos hiển thị
  const [todos, setTodos] = useState<ToDoType[]>([]);
  // State cho văn bản nhập vào khi thêm todo
  const [todoText, setTodoText] = useState<string>("");
  // State cho query tìm kiếm
  const [searchQuery, setSearchQuery] = useState<string>("");
  // State cho danh sách todos gốc (để khôi phục khi tìm kiếm)
  const [oldTodos, setOldTodos] = useState<ToDoType[]>([]);

  // useEffect để tải dữ liệu từ AsyncStorage khi component mount
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
        console.log("Lỗi khi tải todos:", error);
      }
    };
    getTodos();
  }, []);

  // Hàm thêm todo mới
  const addTodo = async () => {
    // Kiểm tra nếu văn bản rỗng, không thêm
    if (todoText.trim() === "") {
      alert("Vui lòng nhập nội dung todo!");
      return;
    }

    // Tạo todo mới với ID duy nhất (dùng Date.now() thay Math.random() để tránh trùng lặp)
    const newTodo: ToDoType = {
      id: Date.now(), // ID dựa trên timestamp, đảm bảo duy nhất
      title: todoText.trim(),
      isDone: false,
    };

    // Cập nhật danh sách
    const newTodos = [...oldTodos, newTodo];
    setOldTodos(newTodos);
    setTodos(newTodos);

    // Lưu vào AsyncStorage
    try {
      await AsyncStorage.setItem("my-todo", JSON.stringify(newTodos));
    } catch (error) {
      console.log("Lỗi khi lưu todo:", error);
    }

    // Reset input và ẩn bàn phím
    setTodoText("");
    Keyboard.dismiss();
  };

  // Hàm xóa todo theo ID
  const deleteTodo = async (id: number) => {
    try {
      const newTodos = oldTodos.filter((todo) => todo.id !== id);
      setOldTodos(newTodos);
      setTodos(newTodos); // Cập nhật danh sách hiển thị
      await AsyncStorage.setItem("my-todo", JSON.stringify(newTodos));
      alert("Đã xóa todo!");
    } catch (error) {
      console.log("Lỗi khi xóa todo:", error);
    }
  };

  // Hàm đánh dấu hoàn thành/chưa hoàn thành
  const handleDone = async (id: number) => {
    const newTodos = oldTodos.map((todo) =>
      todo.id === id ? { ...todo, isDone: !todo.isDone } : todo
    );
    setOldTodos(newTodos);
    setTodos(newTodos);
    try {
      await AsyncStorage.setItem("my-todo", JSON.stringify(newTodos));
    } catch (error) {
      console.log("Lỗi khi cập nhật trạng thái:", error);
    }
  };

  // Hàm tìm kiếm todos
  const onSearch = (query: string) => {
    if (query === "") {
      setTodos(oldTodos); // Hiển thị tất cả nếu không tìm kiếm
    } else {
      const filteredTodos = oldTodos.filter((todo) =>
        todo.title.toLowerCase().includes(query.toLowerCase())
      );
      setTodos(filteredTodos);
    }
  };

  // useEffect để gọi onSearch mỗi khi searchQuery thay đổi
  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header với menu và avatar */}
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

      {/* Ô tìm kiếm */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={24} color={"#333"} />
        <TextInput
          placeholder="Tìm kiếm todo..."
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
          style={styles.searchInput}
          clearButtonMode="always"
        />
      </View>

      {/* Danh sách todos */}
      <FlatList
        data={[...todos].reverse()} // Đảo ngược để hiển thị mới nhất lên trên
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ToDoItem
            todo={item}
            deleteTodo={deleteTodo}
            handleDone={handleDone}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có todo nào!</Text>} // Hiển thị khi danh sách rỗng
      />

      {/* Footer với ô nhập và nút thêm */}
      <KeyboardAvoidingView
        style={styles.footer}
        behavior="padding"
        keyboardVerticalOffset={10}
      >
        <TextInput
          placeholder="Thêm todo mới..."
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

// Component con để render từng todo item
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
        color={todo.isDone ? "#4630EB" : "#ccc"} // Thêm màu mặc định khi chưa done
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

// Styles cho giao diện
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