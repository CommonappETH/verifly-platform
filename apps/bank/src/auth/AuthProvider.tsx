import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { ApiError } from "@verifly/api-client";
import type { PublicUser } from "@verifly/api-client";

import { apiClient } from "@/lib/api-client";

// Phase 10.3: shared auth context for every portal. Calls `GET /auth/me` on
// mount to hydrate the session; exposes `login`, `logout`, `refresh`. Also
// installs the api-client's 401 interceptor so a non-auth route returning
// 401 (e.g. a session expired mid-tab) clears local state and redirects to
// the login route instead of bubbling an ApiError into the route handler.
//
// The interceptor is installed in a ref-stable callback that only depends on
// the *current* setUser, so `setOnUnauthorized` is called once on mount and
// never re-installed during the app's lifetime.

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<PublicUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LOGIN_PATH = "/login";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stable handler for the 401 interceptor — captures setUser via closure
  // but never changes identity, so the api-client only sees one registration.
  const handlerRef = useRef<() => void>(() => {});
  handlerRef.current = () => {
    setUser(null);
    if (typeof window !== "undefined" && window.location.pathname !== LOGIN_PATH) {
      window.location.assign(LOGIN_PATH);
    }
  };

  useEffect(() => {
    apiClient.setOnUnauthorized(() => handlerRef.current());
    return () => apiClient.setOnUnauthorized(undefined);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient.auth.me();
      setUser(res.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.auth.login({ email, password });
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.auth.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
