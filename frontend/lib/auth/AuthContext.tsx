"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string;
  language: string;
  cashBalance: number;
  lockedBalance: number;
  showWelcome: boolean;
  version: number;
  admin: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// Async functions defined OUTSIDE component
async function loginCall(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error al iniciar sesión");
  }
  return res.json();
}

async function logoutCall(userId: string) {
  await fetch(`${API_BASE_URL}/api/auth/logout`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  }).catch(() => {});
}

async function fetchUserMe(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function refreshTokenCall(refreshToken: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error("Token refresh failed");
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy initializers to avoid setState in effect for initial load
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  });

  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refresh_token");
    }
    return null;
  });

  const [loading] = useState(() => {
    return typeof window === "undefined";
  });
  const [refreshing, setRefreshing] = useState(false);

  const userRef = useRef<User | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshingRef = useRef(false);
  const logoutRef = useRef<() => void>(() => {});

  // Sync refs with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    refreshTokenRef.current = refreshToken;
  }, [refreshToken]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  // Logout - sync, no async in useCallback
  const logout = useCallback(() => {
    if (userRef.current?.id) {
      logoutCall(userRef.current.id);
    }
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  }, []);

  // Sync logout ref
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // Refresh access token - sync trigger, async in useEffect
  const refreshAccessToken = useCallback(() => {
    if (!refreshTokenRef.current || refreshingRef.current) return;
    setRefreshing(true);
  }, []);

  // Handle async refresh in useEffect
  useEffect(() => {
    if (!refreshing) return;

    let isCancelled = false;

    const doRefresh = async () => {
      try {
        const rt = refreshTokenRef.current;
        if (!rt) throw new Error("No refresh token");

        const data = await refreshTokenCall(rt);
        if (!isCancelled) {
          setAccessToken(data.token);
          setRefreshToken(data.refreshToken);
          setUser(data.user);
          localStorage.setItem("access_token", data.token);
          localStorage.setItem("refresh_token", data.refreshToken);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (e) {
        if (!isCancelled) {
          console.error("Token refresh failed:", e);
          logoutRef.current?.();
        }
      } finally {
        if (!isCancelled) {
          setRefreshing(false);
        }
      }
    };

    doRefresh();

    return () => {
      isCancelled = true;
    };
  }, [refreshing]);

  // Login - plain function via useCallback that returns promise (no async keyword)
  const login = useCallback((email: string, password: string) => {
    return loginCall(email, password).then((data) => {
      setAccessToken(data.token);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      localStorage.setItem("access_token", data.token);
      localStorage.setItem("refresh_token", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      return fetchUserMe(data.token).then((freshUser) => {
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem("user", JSON.stringify(freshUser));
        }
      });
    });
  }, []);

  // Auto-refresh token 5 min before expiry
  useEffect(() => {
    if (!accessToken) return;
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    const exp = payload.exp * 1000;
    const now = Date.now();
    const timeUntilExpiry = exp - now;
    const refreshIn = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000);
    const timer = setTimeout(refreshAccessToken, refreshIn);
    return () => clearTimeout(timer);
  }, [accessToken, refreshAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        loading,
        login,
        logout,
        refreshAccessToken,
        isAuthenticated: !!accessToken && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}