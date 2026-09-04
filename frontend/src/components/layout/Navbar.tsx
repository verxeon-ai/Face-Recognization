"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  Film,
  Image as ImageIcon,
  LayoutGrid,
  Radar,
  Shield,
  ShieldAlert,
  Smartphone,
  Video,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";

const ICONS = {
  Radar,
  LayoutGrid,
  Cpu,
  Video,
  Smartphone,
  Image: ImageIcon,
  Film,
  ShieldAlert,
} as const;

export function Navbar() {
  const pathname = usePathname();
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-aegis-border bg-aegis-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-aegis-border bg-aegis-panel">
            <Shield className="h-4 w-4 text-aegis-text" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-aegis-text">
              AegisAI
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-aegis-muted">
              Video Threat Defense
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
            {NAV_ITEMS.map((item) => {
              const Icon = ICONS[item.icon as keyof typeof ICONS];
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
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

        <div className="relative hidden lg:block">
          <button
            onClick={() => setRoleOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md border border-aegis-border bg-aegis-panel px-2.5 py-1.5 text-xs text-aegis-secondary"
          >
            Role: <span className="font-semibold text-aegis-text">{role}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {roleOpen ? (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-aegis-border bg-aegis-surface shadow-xl">
              <button
                className="block w-full px-3 py-2 text-left text-xs text-aegis-secondary hover:bg-white/[0.04] hover:text-aegis-text"
                onClick={() => setRole("Admin")}
              >
                Admin (Full Control)
              </button>
              <button
                className="block w-full px-3 py-2 text-left text-xs text-aegis-secondary hover:bg-white/[0.04] hover:text-aegis-text"
                onClick={() => setRole("Operator")}
              >
                Security Operator (Triage)
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
