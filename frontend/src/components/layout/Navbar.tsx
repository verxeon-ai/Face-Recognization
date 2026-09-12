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
} from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS = {
  Radar,
  Video,
  Smartphone,
  Image: ImageIcon,
  Film,
  ShieldAlert,
  Users,
} as const;

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
              Demo Mode
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
      </div>
    </header>
  );
}
