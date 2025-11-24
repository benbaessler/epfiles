import { Button } from "@/components/ui/button";
import { CirclePlus, SquareChevronLeft } from "lucide-react";

interface SidebarProps {
  onNewChat: () => void;
  onClose: () => void;
}

export function Sidebar({ onNewChat, onClose }: SidebarProps) {
  const recentChats = [
    "Flight logs",
    "Epstein connections",
    "Ghislane Maxwell emails",
    "Legal transcripts",
  ];

  return (
    <div className="w-72 h-full bg-[#202026] border-r border-zinc-800 flex flex-col p-4 shrink-0 transition-all duration-300">
      <div className="flex justify-end mb-6">
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <SquareChevronLeft className="h-6 w-6" />
        </button>
      </div>

      <Button
        onClick={onNewChat}
        variant="outline"
        className="w-full justify-center bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border-zinc-700 mb-8 h-12 text-base font-sans cursor-pointer"
      >
        <CirclePlus className="h-5 w-5 mr-3" />
        New chat
      </Button>

      <div className="flex-1 overflow-y-auto">
        <div className="mb-8">
          <h3 className="font-serif text-sm text-zinc-400 mb-4 px-2 italic">
            Top discoveries
          </h3>
          <div className="space-y-1">
            {recentChats.map((chat, index) => (
              <button
                key={index}
                className="w-full text-left px-2 py-3 text-sm text-zinc-300 hover:bg-zinc-800/50 rounded-md transition-colors font-sans truncate cursor-pointer"
              >
                {chat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-serif text-sm text-zinc-400 mb-4 px-2 italic">
            Recent
          </h3>
          <div className="space-y-1">
            {recentChats.map((chat, index) => (
              <button
                key={index}
                className="w-full text-left px-2 py-3 text-sm text-zinc-300 hover:bg-zinc-800/50 rounded-md transition-colors font-sans truncate cursor-pointer"
              >
                {chat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
