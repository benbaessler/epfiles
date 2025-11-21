"use client";

import * as React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Menu, PanelRightClose, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  evidence: React.ReactNode;
}

export function AppShell({ sidebar, children, evidence }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = React.useState(true); // Only for mobile toggle state now

  // Close mobile sidebar on resize if screen becomes large
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* Mobile Implementation (Standard Flex/Fixed) - Resizable Panels are awkward on mobile touch usually */}
      <div className="lg:hidden flex flex-col h-full w-full">
         {/* Mobile Header */}
        <header className="flex-none flex h-14 items-center justify-between border-b border-border bg-zinc-925 px-4">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Case File #001</span>
          <Button variant="ghost" size="icon" onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}>
            <PanelRight className="h-5 w-5" />
          </Button>
        </header>

         {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
            <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
            />
        )}
        
        {/* Mobile Left Sidebar */}
        <aside
            className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-zinc-925 transition-transform duration-300 ease-in-out flex flex-col",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
             <div className="flex-1 overflow-auto pt-4">
                {sidebar}
            </div>
        </aside>

         {/* Mobile Main Content */}
         <main className="flex-1 overflow-hidden relative bg-background">
            {children}
         </main>

         {/* Mobile Right Sidebar (Drawer) */}
        <aside
            className={cn(
            "fixed inset-y-0 right-0 z-50 w-80 border-l border-border bg-zinc-925 transition-transform duration-300 ease-in-out flex flex-col",
            isEvidenceOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <span className="font-semibold">Evidence</span>
                <Button variant="ghost" size="icon" onClick={() => setIsEvidenceOpen(false)}>
                    <PanelRightClose className="h-5 w-5" />
                </Button>
            </div>
            <div className="flex-1 overflow-auto h-full">
                {evidence}
            </div>
        </aside>
      </div>

      {/* Desktop Implementation (Resizable Panels) */}
      <div className="hidden lg:block w-full h-full">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar */}
          <Panel defaultSize={20} minSize={15} maxSize={30} className="bg-zinc-925 flex flex-col">
            <div className="flex-1 overflow-auto pt-4 h-full">
                {sidebar}
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-[1px] bg-zinc-800 focus:outline-none" />
          
          {/* Main Content */}
          <Panel minSize={30} className="bg-background flex flex-col">
             <div className="flex-1 overflow-hidden relative h-full">
                {children}
            </div>
          </Panel>

          <PanelResizeHandle className="w-[1px] bg-zinc-800 focus:outline-none" />

          {/* Right Sidebar */}
          <Panel defaultSize={25} minSize={20} maxSize={40} className="bg-zinc-925 flex flex-col">
             <div className="flex-1 overflow-auto h-full">
                {evidence}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
