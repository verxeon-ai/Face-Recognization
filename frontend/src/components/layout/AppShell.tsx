"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { RoleProvider } from "@/hooks/useRole";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.startsWith("/mobile-cam");

  if (bare) {
    return <>{children}</>;
  }

  return (
    <RoleProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 lg:px-6">
          {children}
        </main>
        <Footer />
      </div>
    </RoleProvider>
  );
}
