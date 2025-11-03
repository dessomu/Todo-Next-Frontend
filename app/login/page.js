"use client";

import { useContext } from "react";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { LoginLogoutContext } from "@/context/LoginLogoutContext";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Login() {
  const router = useRouter();
  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

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

      // 2️⃣ Send token to backend to create cookie
      await axios.post(
        `${API_URL}/login`,
        { token },
        { withCredentials: true }
      );

      // 3️⃣ Redirect after login
      router.push("/home");
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

      // 1️⃣ Get Firebase ID token
      const token = await user.getIdToken();
      console.log(token);

      // 2️⃣ Send token to backend to create cookie
      await axios.post(
        `${API_URL}/login`,
        { token },
        { withCredentials: true }
      );

      // 3️⃣ Redirect after login
      router.push("/home");
    } catch (error) {
      setError(error.message.substring(10, error.message.length));
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
