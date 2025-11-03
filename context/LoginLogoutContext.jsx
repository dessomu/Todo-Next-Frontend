"use client";
import { createContext, useState } from "react";

export const LoginLogoutContext = createContext();

// eslint-disable-next-line react/prop-types
function LoginLogoutContextProvider({ children }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");


  return (
    <LoginLogoutContext.Provider
      value={{
        email,
        setEmail,
        password,
        setPassword,
        error,
        setError,
      }}
    >
      {children}
    </LoginLogoutContext.Provider>
  );
}
export default LoginLogoutContextProvider;
