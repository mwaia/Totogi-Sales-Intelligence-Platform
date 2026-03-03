import { useState, useEffect, useCallback } from "react";
import { auth, setToken, clearToken, isAuthenticated } from "../api";
import type { User } from "../types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    try {
      const me = await auth.me();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const res = await auth.login(username, password);
    setToken(res.access_token);
    await fetchUser();
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
}
