"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api/client";
import type { Role } from "@/types";

interface RoleContextValue {
  role: Role;
  setRole: (role: "Admin" | "Operator") => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("Admin");

  const setRole = useCallback(async (next: "Admin" | "Operator") => {
    const res = await api.switchRole(next);
    setRoleState((res.current_role as Role) || (next === "Admin" ? "Admin" : "Security Operator"));
    window.location.reload();
  }, []);

  const value = useMemo(() => ({ role, setRole }), [role, setRole]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
