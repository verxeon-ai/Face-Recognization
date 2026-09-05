"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Film,
  Image as ImageIcon,
  Radar,
  ShieldAlert,
  Smartphone,
  Users,
  Video,
  ChevronDown,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Role } from "@/types";

const ICONS = {
  Radar,
  Video,
  Smartphone,
  Image: ImageIcon,
  Film,
  ShieldAlert,
  Users,
} as const;

type UnlockTarget = "Admin" | "Operator" | null;

export function Navbar() {
  const pathname = usePathname();
  const { role, isAdmin, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<UnlockTarget>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) =>
    (item.roles as readonly Role[]).includes(role)
  );

  const requestUnlock = (target: "Admin" | "Operator") => {
    setRoleOpen(false);
    const alreadyActive =
      (target === "Admin" && role === "Admin") ||
      (target === "Operator" && role === "Security Operator");
    if (alreadyActive) return;
    setPassword("");
    setError(null);
    setUnlockTarget(target);
  };

  const confirmUnlock = async () => {
    if (!unlockTarget) return;
    if (!password.trim()) {
      setError("Enter the role password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await setRole(unlockTarget, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
      setSubmitting(false);
    }
  };

  const unlockLabel =
    unlockTarget === "Admin" ? "Admin" : "Security Operator";

  return (
    <header className="sticky top-0 z-50 border-b border-aegis-border bg-aegis-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 lg:px-6">
        <Link href="/soc" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/aegis-mark.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-aegis-text">
              AegisAI
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-aegis-muted">
              {isAdmin ? "Admin Control Plane" : "Operator Triage Console"}
            </div>
          </div>
        </Link>

        <button
          className="ml-auto rounded-md border border-aegis-border px-2 py-1 text-aegis-secondary lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          Menu
        </button>

        <nav
          className={cn(
            "absolute left-0 right-0 top-full border-b border-aegis-border bg-aegis-bg p-3 lg:static lg:flex lg:flex-1 lg:border-0 lg:bg-transparent lg:p-0",
            open ? "block" : "hidden lg:flex"
          )}
        >
          <ul className="flex flex-col gap-1 lg:ml-6 lg:flex-row lg:flex-wrap lg:items-center lg:gap-0.5">
            {visibleNav.map((item) => {
              const Icon = ICONS[item.icon as keyof typeof ICONS];
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                      active
                        ? "border border-aegis-border-strong bg-aegis-panel text-aegis-text"
                        : "border border-transparent text-aegis-secondary hover:text-aegis-text"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 opacity-80" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="relative ml-auto lg:ml-0">
          <button
            onClick={() => setRoleOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
              isAdmin
                ? "border-aegis-amber/40 bg-aegis-amber/10 text-aegis-amber"
                : "border-aegis-cyan/40 bg-aegis-cyan/10 text-aegis-cyan"
            )}
          >
            <Lock className="h-3 w-3" />
            Role: <span className="font-semibold">{role}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {roleOpen ? (
            <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-md border border-aegis-border bg-aegis-surface shadow-xl">
              <button
                className="block w-full px-3 py-2.5 text-left hover:bg-white/[0.04]"
                onClick={() => requestUnlock("Admin")}
              >
                <div className="text-xs font-semibold text-aegis-text">
                  Admin (Full Control)
                </div>
                <div className="mt-0.5 text-[11px] text-aegis-muted">
                  Password required · rules, enrollment, alerts
                </div>
              </button>
              <button
                className="block w-full border-t border-aegis-border px-3 py-2.5 text-left hover:bg-white/[0.04]"
                onClick={() => requestUnlock("Operator")}
              >
                <div className="text-xs font-semibold text-aegis-text">
                  Security Operator (Triage)
                </div>
                <div className="mt-0.5 text-[11px] text-aegis-muted">
                  Password required · monitor & verify incidents
                </div>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={!!unlockTarget}
        onClose={() => {
          if (submitting) return;
          setUnlockTarget(null);
          setPassword("");
          setError(null);
        }}
        title={`Unlock ${unlockLabel}`}
        footer={
          <>
            <Button
              disabled={submitting}
              onClick={() => {
                setUnlockTarget(null);
                setPassword("");
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={submitting}
              onClick={() => void confirmUnlock()}
            >
              {submitting ? "Checking…" : "Unlock Role"}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-aegis-secondary">
          Enter the {unlockLabel} password to switch into that workspace.
        </p>
        <label className="block text-xs text-aegis-secondary">
          Password
          <input
            className="mt-1"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void confirmUnlock();
            }}
            placeholder={`${unlockLabel} password`}
          />
        </label>
        {error ? (
          <p className="mt-3 text-sm text-aegis-red">{error}</p>
        ) : null}
      </Modal>
    </header>
  );
}
