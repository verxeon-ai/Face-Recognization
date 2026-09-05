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
import { api } from "@/lib/api/client";
import type { Role } from "@/types";

interface RoleContextValue {
  role: Role;
  isAdmin: boolean;
  isOperator: boolean;
  ready: boolean;
  setRole: (role: "Admin" | "Operator", password: string) => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("Security Operator");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getRole()
      .then((res) => {
        if (cancelled) return;
        setRoleState((res.current_role as Role) || "Security Operator");
      })
      .catch(() => {
        if (!cancelled) setRoleState("Security Operator");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setRole = useCallback(async (next: "Admin" | "Operator", password: string) => {
    const res = await api.switchRole(next, password);
    const resolved =
      (res.current_role as Role) ||
      (next === "Admin" ? "Admin" : "Security Operator");
    setRoleState(resolved);
    window.location.href = "/soc";
  }, []);

  const value = useMemo(
    () => ({
      role,
      isAdmin: role === "Admin",
      isOperator: role === "Security Operator",
      ready,
      setRole,
    }),
    [role, ready, setRole]
  );
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
