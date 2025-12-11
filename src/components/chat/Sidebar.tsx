"use client";

import { Button } from "@/components/ui/button";
import { CirclePlus, PanelLeft, Trash2, Loader2 } from "lucide-react";
import { UserProfileButton } from "@/components/auth/UserProfileButton";
import { UsageIndicator } from "@/components/ui/UsageIndicator";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/api";

interface SidebarProps {
  isOpen: boolean;
  onNewChat: () => void;
  onToggle: () => void;
  conversations: Conversation[];
  isLoading: boolean;
  currentSessionId: string | null;
  onSelectConversation: (sessionId: string) => void;
  onDeleteConversation: (sessionId: string) => void;
}

export function Sidebar({
  isOpen,
  onNewChat,
  onToggle,
  conversations,
  isLoading,
  currentSessionId,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  return (
    <div
      className={cn(
        "h-full bg-[#202026] border-r border-zinc-800 flex flex-col transition-all duration-300 ease-in-out shrink-0 py-4 px-3 overflow-hidden",
        isOpen ? "w-64 sm:w-72" : "w-14 sm:w-16"
      )}
    >
      <div className="flex mb-2 justify-start items-center">
        <button
          onClick={onToggle}
          className="text-zinc-300 hover:text-zinc-200 hover:bg-zinc-700/50 rounded-lg cursor-pointer w-10 h-10 flex items-center justify-center shrink-0"
        >
          <PanelLeft className="h-6 w-6" />
        </button>
      </div>

      <Button
        onClick={onNewChat}
        variant="ghost"
        className={cn(
          "text-zinc-300 mb-4 text-sm font-sans cursor-pointer transition-[width] duration-300 hover:bg-zinc-700/50 px-0 justify-start h-10 overflow-hidden rounded-lg",
          isOpen ? "w-full" : "w-10"
        )}
      >
        <div className="w-10 shrink-0 flex items-center justify-center">
          <CirclePlus className="h-5 w-5" />
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

      <div
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden w-full transition-all duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="min-w-[200px]">
          <div>
            <h3 className="text-sm text-zinc-400 mb-2 px-2">Recent</h3>
            <div className="space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-zinc-500 px-2 py-2">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.session_id}
                    className={cn(
                      "group flex items-center gap-1 rounded-lg transition-colors",
                      currentSessionId === conversation.session_id
                        ? "bg-zinc-700/50"
                        : "hover:bg-zinc-700/30"
                    )}
                  >
                    <button
                      onClick={() =>
                        onSelectConversation(conversation.session_id)
                      }
                      className="flex-1 text-left px-2 py-2 text-sm text-zinc-300 font-sans truncate cursor-pointer min-w-0"
                      title={conversation.title || "Untitled"}
                    >
                      {conversation.title || "Untitled"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.session_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 transition-opacity cursor-pointer shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Profile at bottom */}
      <div className="mt-auto pt-4">
        <UsageIndicator collapsed={!isOpen} />
        <UserProfileButton collapsed={!isOpen} />
      </div>
    </div>
  );
}
