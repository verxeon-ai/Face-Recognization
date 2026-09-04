import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aegis: {
          bg: "#050607",
          surface: "#0A0B0D",
          panel: "#0D0F12",
          elevated: "#111317",
          border: "rgba(255,255,255,0.08)",
          "border-strong": "rgba(255,255,255,0.16)",
          text: "#F5F3EF",
          secondary: "#8A8F98",
          muted: "#5F646D",
          cyan: "#5B9FB8",
          red: "#EF4444",
          amber: "#FBBF24",
          green: "#22C55E",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
