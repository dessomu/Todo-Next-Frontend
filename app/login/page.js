"use client";

import { useContext } from "react";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { LoginLogoutContext } from "@/context/LoginLogoutContext";
import axios from "axios";

export default function Login() {
  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

  // ✅ Helper: get token + session_marker
  const getAuthHeaders = () => {
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

  const { email, setEmail, password, setPassword, error, setError } =
    useContext(LoginLogoutContext);

  async function handleSignUp() {
    if (email === "" || password === "") {
      setError("Please fill all the fields");
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User signed up", user);

      // 1️⃣ Get Firebase ID token
      const token = await user.getIdToken();

      //  Send token to backend to create JWT
      const res = await axios.post(
        `${API_URL}/login`,
        { token },
        { headers: getAuthHeaders() }
      );

      //  Backend responds with { jwt, session_marker }
      const { jwt, session_marker } = res.data;

      //  Store them client-side
      localStorage.setItem("access_token", jwt);
      document.cookie = `session_marker=${session_marker}; path=/; max-age=${
        60 * 60 * 2
      }; secure; samesite=strict`;

      setEmail("");
      setPassword("");

      //  Redirect after login
      window.location.href = "/home";
    } catch (error) {
      setError(error.message.substring(10, error.message.length));
      console.log(error);
    }
    setEmail("");
    setPassword("");
  }

  async function handleSignIn() {
    if (email === "" || password === "") {
      setError("Please fill all the fields");
    }
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User logged in successfully", user);

      //  Get Firebase ID token
      const token = await user.getIdToken();
      console.log(token);

      //  Send token to backend to create JWT
      const res = await axios.post(
        `${API_URL}/login`,
        { token },
        { headers: getAuthHeaders() }
      );

      //  Backend responds with { jwt, session_marker }
      const { jwt, session_marker } = res.data;

      //  Store them client-side
      localStorage.setItem("access_token", jwt);
      document.cookie = `session_marker=${session_marker}; path=/; max-age=${
        60 * 60 * 2
      }; secure; samesite=strict`;

      setEmail("");
      setPassword("");

      //  Redirect after login
      window.location.href = "/home";
    } catch (error) {
      setError(error.message.substring(0, error.message.length));
    }
  }

  return (
    <div className="form">
      <h3>Please Login/Signup</h3>
      <br />
      <label htmlFor="email">Email : </label>
      <input
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="text"
        placeholder="Enter Your Email"
      />
      <label htmlFor="password">Password : </label>

      <input
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="text"
        placeholder="Enter Password"
      />
      <button onClick={handleSignUp} className="signUp">
        Sign Up
      </button>
      <button onClick={handleSignIn} className="signIn">
        Log In
      </button>
      {error ? (
        <div className="error-modal">
          {error}
          <button
            onClick={() => setError("")}
            style={{ background: "green", width: "50px" }}
          >
            Ok!
          </button>
        </div>
      ) : null}
    </div>
  );
}
