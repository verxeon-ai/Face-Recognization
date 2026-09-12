"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface RoleContextValue {
  role: "Admin";
  isAdmin: boolean;
  isOperator: boolean;
  ready: boolean;
  setRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const setRole = useCallback(async () => {
    /* no-op in demo mode */
  }, []);

  const value = useMemo(
    () => ({
      role: "Admin" as const,
      isAdmin: true,
      isOperator: false,
      ready,
      setRole,
    }),
    [ready, setRole]
  );
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
