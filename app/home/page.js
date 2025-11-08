"use client";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import useSWR from "swr";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LoginLogoutContext } from "@/context/LoginLogoutContext";

export default function Home() {
  const [todo, setTodo] = useState("");
  const { setEmail, setPassword } = useContext(LoginLogoutContext);

  // ✅ Helper: get token + session_marker
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

  // 1️⃣ Prefill state from localStorage (instant render)
  const [todos, setTodos] = useState([]);

  const [editTodoId, setEditTodoId] = useState(null);
  const [editTodo, setEditTodo] = useState("");

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

  // 3️⃣ Whenever new data comes → update state + localStorage
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await axios.get(`${API_URL}`, {
          headers: getAuthHeaders(),
        });
        const fetchedTodos = res.data;
        console.log(typeof fetchedTodos);

        setTodos(fetchedTodos);
      } catch (error) {
        console.log("Error getting todos", error);
      }
    };
    fetchTodos();
  }, [API_URL]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!todo) return;

    try {
      const res = await axios.post(
        `${API_URL}`,
        { todo },
        { headers: getAuthHeaders() }
      );

      setTodos(res.data.todos); // update cache immediately, no re-fetch
      setTodo("");
    } catch (error) {
      alert("❌ Axios Post Error");
      console.log("Error adding todo", error);
    }
  };

  const editHandler = (todo) => {
    setEditTodoId(todo._id);
    setEditTodo(todo.todo);
  };

  const deleteHandler = async (id) => {
    try {
      const res = await axios.delete(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });

      // updated todos after deleting
      setTodos(res.data.todos); // update cache immediately, no re-fetch
    } catch (error) {
      alert("❌ Axios Delete Error");
      console.log("Error deleting todo", error);
    }
  };

  const updateHandler = async () => {
    if (!editTodo || !editTodoId) return;

    const todo = editTodo;
    const id = editTodoId;
    try {
      const res = await axios.put(
        `${API_URL}/${id}`,
        { todo },
        { headers: getAuthHeaders() }
      );

      // updated todos after updating
      setTodos(res.data.todos); // update cache immediately, no re-fetch
      setEditTodo("");
      setEditTodoId(null);
    } catch (error) {
      alert("❌ Axios Put Error");
      console.log("Error updating todo", error);
    }
  };

  const completedHandler = async (todo) => {
    const id = todo._id;
    const newStatus = !todo.completed;

    try {
      const res = await axios.patch(
        `${API_URL}/${id}`,
        { completed: newStatus },
        { headers: getAuthHeaders() }
      );

      // updated todos after patching
      setTodos(res.data.todos); // update cache immediately, no re-fetch
    } catch (error) {
      alert("❌ Axios Patch Error");
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
    mutate([], false);
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
          {todos.map((todo) => {
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
