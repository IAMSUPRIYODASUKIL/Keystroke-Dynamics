import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@/types";
import { profileApi } from "@/services/api";
import { clearToken, getToken, setToken } from "@/services/tokenStorage";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const profile = await profileApi.get();
      setUser(profile.user);
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  const login = useCallback((token: string, nextUser: User) => {
    setToken(token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: user !== null, login, logout, refreshProfile }),
    [user, isLoading, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
