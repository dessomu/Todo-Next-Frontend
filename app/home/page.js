"use client";
import { useState, useEffect, useMemo, useContext } from "react";
import axios from "axios";
import useSWR from "swr";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LoginLogoutContext } from "@/context/LoginLogoutContext";

// ✅ fetcher function
const fetcher = (url) =>
  axios.get(url, { withCredentials: true }).then((r) => r.data);

export default function Home() {
  const [todo, setTodo] = useState("");
  const { setEmail, setPassword } = useContext(LoginLogoutContext);

  // 1️⃣ Prefill state from localStorage
  const [todos, setTodos] = useState(() => {
    try {
      const cache = JSON.parse(localStorage.getItem("todos-cache"));
      return Array.isArray(cache) ? cache : [];
    } catch {
      return [];
    }
  });

  const [editTodoId, setEditTodoId] = useState(null);
  const [editTodo, setEditTodo] = useState("");

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
  // 🧠 Read cached data synchronously from localStorage (no flicker)
  const cachedTodos = useMemo(() => {
    try {
      const swrCache = localStorage.getItem("swr-cache");
      if (!swrCache) return [];
      const map = new Map(JSON.parse(swrCache));
      const cached = map.get(API_URL);
      return Array.isArray(cached) ? cached : [];
    } catch {
      return [];
    }
  }, [API_URL]);

  // 2️⃣ SWR hook — background revalidation
  const { data, mutate } = useSWR(API_URL, fetcher, {
    fallbackData: todos,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 1000 * 60 * 10,
  });

  // 3️⃣ Whenever new data comes → update state + localStorage
  useEffect(() => {
    if (data) {
      setTodos(data);
      localStorage.setItem("todos-cache", JSON.stringify(data));
    }
  }, [data]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!todo) return;

    try {
      const res = await axios.post(
        `${API_URL}`,
        { todo },
        { withCredentials: true }
      );

      // Instead of setTodos(), SWR ka mutate() use kar
      mutate(res.data.todos, false); // update cache immediately, no re-fetch
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
        withCredentials: true,
      });

      // updated todos after deleting
      mutate(res.data.todos, false);
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
        {
          withCredentials: true,
        }
      );

      // updated todos after updating
      mutate(res.data.todos, false);
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
        {
          withCredentials: true,
        }
      );

      // updated todos after patching
      mutate(res.data.todos, false);
    } catch (error) {
      alert("❌ Axios Patch Error");
      console.log("Error patching todo", error);
    }
  };

  async function handleSignOut() {
    try {
      await signOut(auth);
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      console.log("✅ Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      console.log(error.message);
    }
    setEmail("");
    setPassword("");
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
