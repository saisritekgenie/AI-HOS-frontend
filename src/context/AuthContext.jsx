import React, { createContext, useState, useEffect, useContext } from "react";
import { loginUser, fetchMe, patientLogin } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("hospital_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("hospital_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await fetchMe();
          setUser(res.data);
          localStorage.setItem("hospital_user", JSON.stringify(res.data));
        } catch (err) {
          console.error("Session verification failed", err);
          logout();
        }
      }
      setLoading(false);
    };
    verifySession();
  }, [token]);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("hospital_token", newToken);
    localStorage.setItem("hospital_user", JSON.stringify(newUser));
    return newUser;
  };

  const loginPatient = async (credentials) => {
    const res = await patientLogin(credentials);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("hospital_token", newToken);
    localStorage.setItem("hospital_user", JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("hospital_token");
    localStorage.removeItem("hospital_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        loginPatient,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
