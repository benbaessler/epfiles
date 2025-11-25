import { Button } from "@/components/ui/button";
import { CirclePlus, PanelLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onNewChat: () => void;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onNewChat, onToggle }: SidebarProps) {
  const recentChats = [
    "Flight logs",
    "Epstein connections",
    "Ghislane Maxwell emails",
    "Legal transcripts",
  ];

  return (
    <div
      className={cn(
        "h-full bg-[#202026] border-r border-zinc-800 flex flex-col transition-all duration-300 ease-in-out shrink-0 py-4 px-3 overflow-hidden",
        isOpen ? "w-72" : "w-16"
      )}
    >
      <div className="flex mb-2 justify-start">
        <button
          onClick={onToggle}
          className="text-zinc-400 hover:text-zinc-200 cursor-pointer w-10 h-10 flex items-center justify-center"
        >
          <PanelLeft className="h-6 w-6" />
        </button>
      </div>

      <Separator className="bg-zinc-800 mb-4" />

      <Button
        onClick={onNewChat}
        variant="ghost"
        className={cn(
          "text-zinc-300 mb-4 text-base font-sans cursor-pointer transition-[width] duration-300 hover:bg-zinc-800/50 px-0 justify-start h-10 overflow-hidden",
          isOpen ? "w-full" : "w-10"
        )}
      >
        <div className="w-10 shrink-0 flex items-center justify-center">
          <CirclePlus className="h-6 w-6" />
        </div>
        <span
          className={cn(
            "whitespace-nowrap overflow-hidden transition-[opacity] duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )}
        >
          New chat
        </span>
      </Button>

      <Separator className="bg-zinc-800 mb-4" />

      <div
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden w-full transition-all duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="min-w-[200px]">
          <div className="mb-4">
            <h3 className="text-sm text-zinc-400 mb-4 px-2">
              Top discoveries
            </h3>
            <div className="space-y-1">
              {recentChats.map((chat, index) => (
                <button
                  key={index}
                  className="font-serif w-full text-left px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800/50 rounded-md font-sans truncate cursor-pointer"
                >
                  {chat}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-800 mb-4" />

          <div>
            <h3 className="text-sm text-zinc-400 mb-4 px-2">
              Recent
            </h3>
            <div className="space-y-1">
              {recentChats.map((chat, index) => (
                <button
                  key={index}
                  className="font-serif w-full text-left px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800/50 rounded-md font-sans truncate cursor-pointer"
                >
                  {chat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
