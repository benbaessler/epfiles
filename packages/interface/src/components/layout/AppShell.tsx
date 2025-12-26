"use client";

import { type ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full bg-[#D9D9D9] text-[#060823] overflow-hidden font-sans">
      {/* Main Content */}
      <main className="flex-1 bg-[#D9D9D9] flex flex-col min-w-0 overflow-hidden relative h-full">
        {children}
      </main>
    </div>
  );
}
