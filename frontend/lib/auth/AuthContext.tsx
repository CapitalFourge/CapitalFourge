"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  cashBalance?: number;
  lockedBalance?: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_URL = process.env.NEXT_PUBLIC_API_URL || "https://capital-fourge-production.up.railway.app";

async function refreshTokenCall(refreshToken: string): Promise<{ token: string; refreshToken: string; user: User }> {
  const res = await fetch(`${TOKEN_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error("Token refresh failed");
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTokens = useCallback(() => {
    if (typeof window !== "undefined") {
      const access = localStorage.getItem("access_token");
      const refresh = localStorage.getItem("refresh_token");
      const userStr = localStorage.getItem("user");
      if (access) setAccessToken(access);
      if (refresh) setRefreshToken(refresh);
      if (userStr) setUser(JSON.parse(userStr));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken || refreshing) return;
    setRefreshing(true);
    try {
      const data = await refreshTokenCall(refreshToken);
      setAccessToken(data.token);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      localStorage.setItem("access_token", data.token);
      localStorage.setItem("refresh_token", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (e) {
      console.error("Token refresh failed:", e);
      await logout();
    } finally {
      setRefreshing(false);
    }
  }, [refreshToken, refreshing]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${TOKEN_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Error al iniciar sesión");
    }
    const data = await res.json();
    setAccessToken(data.token);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    localStorage.setItem("access_token", data.token);
    localStorage.setItem("refresh_token", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    
    // Fetch fresh user data including cash balance after login
    try {
      const userRes = await fetch(`${TOKEN_URL}/api/users/me`, {
        headers: { "Authorization": `Bearer ${data.token}` },
      });
      if (userRes.ok) {
        const freshUser = await userRes.json();
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      }
    } catch (e) {
      console.warn("Could not fetch fresh user data after login:", e);
    }
  };

  const logout = useCallback(async () => {
    if (user?.id) {
      try {
        await fetch(`${TOKEN_URL}/api/auth/logout/${user.id}`, { method: "POST" });
      } catch {}
    }
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  }, [user?.id]);

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
    <AuthContext.Provider value={{ user, accessToken, refreshToken, loading, login, logout, refreshAccessToken, isAuthenticated: !!accessToken && !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}