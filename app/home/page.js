"use client";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LoginLogoutContext } from "@/context/LoginLogoutContext";

export default function Home() {
  const [todo, setTodo] = useState("");
  const { setEmail, setPassword } = useContext(LoginLogoutContext);

  // Helper: get token + session_marker
  const getAuthHeaders = () => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("access_token");
    const sessionMarker = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session_marker="))
      ?.split("=")[1];

    return {
      Authorization: `Bearer ${token}`,
      "X-Session-Marker": sessionMarker,
    };
  };

  const [todos, setTodos] = useState([]);

  const [editTodoId, setEditTodoId] = useState(null);
  const [editTodo, setEditTodo] = useState("");

  const [loading, setLoading] = useState(true);

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

  // Generate temporary ID for optimistic updates
  const generateTempId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Fetch todos on mount and sync with server
  useEffect(() => {
    const fetchTodos = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}`, {
          headers: getAuthHeaders(),
        });
        const fetchedTodos = res.data;
        setTodos(fetchedTodos);
      } catch (error) {
        console.log("Error getting todos", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTodos();
  }, [API_URL]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!todo.trim()) return;

    // Create optimistic todo with temp ID
    const tempId = generateTempId();
    const optimisticTodo = {
      _id: tempId,
      todo: todo,
      completed: false,
    };

    // Update UI immediately
    setTodos((prev) => [...prev, optimisticTodo]);
    setTodo("");

    try {
      const res = await axios.post(
        `${API_URL}`,
        { todo: optimisticTodo.todo },
        { headers: getAuthHeaders() }
      );

      // Sync with server response - replace optimistic data with real data
      setTodos(res.data.todos);
    } catch (error) {
      // Rollback: remove the optimistic todo
      setTodos((prev) => prev.filter((t) => t._id !== tempId));
      alert("❌ Failed to add todo. Please try again.");
      console.log("Error adding todo", error);
    }
  };

  const editHandler = (todo) => {
    setEditTodoId(todo._id);
    setEditTodo(todo.todo);
  };

  const deleteHandler = async (id) => {
    // Save current state for rollback
    const previousTodos = [...todos];

    // Update UI immediately - remove the todo
    setTodos((prev) => prev.filter((t) => t._id !== id));

    try {
      const res = await axios.delete(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });

      // Sync with server response
      setTodos(res.data.todos);
    } catch (error) {
      // Rollback: restore the deleted todo
      setTodos(previousTodos);
      alert("❌ Failed to delete todo. Please try again.");
      console.log("Error deleting todo", error);
    }
  };

  const updateHandler = async () => {
    if (!editTodo.trim() || !editTodoId) return;

    // Save current state for rollback
    const previousTodos = [...todos];
    const todoText = editTodo;
    const id = editTodoId;

    // Update UI immediately
    setTodos((prev) =>
      prev.map((t) => (t._id === id ? { ...t, todo: todoText } : t))
    );
    setEditTodo("");
    setEditTodoId(null);

    try {
      const res = await axios.put(
        `${API_URL}/${id}`,
        { todo: todoText },
        { headers: getAuthHeaders() }
      );

      // Sync with server response
      setTodos(res.data.todos);
    } catch (error) {
      // Rollback: restore original todos
      setTodos(previousTodos);
      setEditTodoId(id);
      setEditTodo(todoText);
      alert("❌ Failed to update todo. Please try again.");
      console.log("Error updating todo", error);
    }
  };

  const completedHandler = async (todo) => {
    const id = todo._id;
    const newStatus = !todo.completed;

    // Save current state for rollback
    const previousTodos = [...todos];

    // Update UI immediately
    setTodos((prev) =>
      prev.map((t) => (t._id === id ? { ...t, completed: newStatus } : t))
    );

    try {
      const res = await axios.patch(
        `${API_URL}/${id}`,
        { completed: newStatus },
        { headers: getAuthHeaders() }
      );

      // Sync with server response
      setTodos(res.data.todos);
    } catch (error) {
      // Rollback: restore original completed status
      setTodos(previousTodos);
      alert("❌ Failed to update todo status. Please try again.");
      console.log("Error patching todo", error);
    }
  };

  async function handleSignOut() {
    const session = document.cookie
      .split("; ")
      .find((r) => r.startsWith("session_marker="))
      ?.split("=")[1];

    try {
      await signOut(auth);
      const loggedOutUser = await axios.post(`${API_URL}/logout`, {
        session_marker: session,
      });
      console.log("✅ Logged out successfully", loggedOutUser);

      // removed jwt access_token and cookie with session marker from localstorage
      localStorage.removeItem("access_token");

      document.cookie =
        "session_marker=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

      window.location.href = "/login";
    } catch (error) {
      console.log(error.message);
    }
    setEmail("");
    setPassword("");
    localStorage.removeItem("todos-cache");
  }

  return (
    <main className="container">
      <h1>Todo</h1>
      <button id="logout-btn" onClick={handleSignOut}>
        Log Out
      </button>

      <form onSubmit={(e) => handleAddTodo(e)}>
        <label htmlFor="todo">Enter Todo : </label>
        <input
          value={todo}
          onChange={(e) => setTodo(e.target.value)}
          id="todo"
          type="text"
          placeholder="Enter Todo"
        />
        <button className="add-todo" type="submit">
          Add Todo
        </button>
      </form>
      <div className="todos">
        <ul>
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div className="todo-skeleton" key={i}>
              <div className="skeleton checkbox" />
              <div className="skeleton text" />
              <div className="skeleton btn" />
              <div className="skeleton btn delete" />
            </div>
          ))}
          {!loading && todos.length === 0 && (
            <li className="empty-state">No todos yet. Add your first task above!</li>
          )}
          {!loading && todos.map((todo) => {
            return (
              <li key={todo._id} className="todo-item">
                {editTodoId !== todo._id ? (
                  <>
                    <input
                      onChange={() => completedHandler(todo)}
                      type="checkbox"
                      checked={todo.completed}
                    />
                    <span
                      style={{
                        textDecorationLine: todo.completed
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {todo.todo}
                    </span>
                    <button onClick={() => editHandler(todo)}>Edit</button>
                    <button onClick={() => deleteHandler(todo._id)}>
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <label htmlFor="edit-todo">Edit Todo : </label>
                    <input
                      value={editTodo}
                      onChange={(e) => setEditTodo(e.target.value)}
                      type="text"
                    />
                    <button onClick={updateHandler}>Update</button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
