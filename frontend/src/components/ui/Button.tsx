import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "warning" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-aegis-text text-aegis-bg border border-aegis-text hover:bg-white",
  secondary:
    "bg-transparent text-aegis-text border border-aegis-border hover:border-aegis-border-strong hover:bg-white/[0.03]",
  danger:
    "bg-aegis-red text-white border border-aegis-red hover:bg-red-600",
  warning:
    "bg-transparent text-aegis-amber border border-aegis-amber/50 hover:bg-aegis-amber/10",
  ghost:
    "bg-transparent text-aegis-secondary border border-transparent hover:text-aegis-text hover:bg-white/[0.03]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-aegis-cyan/50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
