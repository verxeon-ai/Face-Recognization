import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "live" | "alert" | "warn" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-aegis-panel border-aegis-border text-aegis-secondary",
  live: "bg-aegis-green/10 border-aegis-green/30 text-aegis-green",
  alert: "bg-aegis-red border-aegis-red text-white",
  warn: "bg-aegis-amber/10 border-aegis-amber/35 text-aegis-amber",
  info: "bg-aegis-cyan/10 border-aegis-cyan/30 text-aegis-cyan",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  pulse = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone],
        pulse && "animate-pulse-soft",
        className
      )}
    >
      {children}
    </span>
  );
}
