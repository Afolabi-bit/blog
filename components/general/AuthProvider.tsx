"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import type { AuthUser } from "@/lib/types";
import { authEndpoints } from "@/lib/endpoints";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  setStoredUser,
  isTokenExpired,
  refreshAuthTokens,
} from "@/lib/client";
import { toast } from "sonner";

interface AuthContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  logout: async () => {},
});

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: AuthUser | null;
}) {
  const [user, setUserState] = useState<AuthUser | null>(
    initialUser ?? getStoredUser(),
  );

  const setUser = useCallback((newUser: AuthUser | null) => {
    setUserState(newUser);
    if (newUser) {
      setStoredUser(newUser);
    }
  }, []);

  // Hydrate or refresh profile if tokens exist but user isn't in state
  useEffect(() => {
    if (initialUser) {
      setUserState(initialUser);
      setStoredUser(initialUser);
    } else {
      const stored = getStoredUser();
      if (stored) {
        setUserState(stored);
      }
    }
  }, [initialUser]);

  // Proactively check and refresh token when returning to the tab after idle
  useEffect(() => {
    const handleVisibilityOrFocus = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        const token = getStoredAccessToken();
        const refreshToken = getStoredRefreshToken();
        if (refreshToken && (!token || isTokenExpired(token, 120))) {
          try {
            await refreshAuthTokens();
          } catch {
            // Background refresh error - interceptor handles fatal failures
          }
        }
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = getStoredRefreshToken();
      await authEndpoints.logout(refreshToken || undefined);
      setUser(null);
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}