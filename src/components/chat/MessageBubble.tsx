import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { id: string; label: string }[];
  timestamp: string;
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full gap-4 px-6 py-6", isUser ? "bg-zinc-900/30" : "bg-transparent")}>
      {/* Minimal Avatar for User only, or remove entirely. Keeping user avatar for distinction but removing assistant's. */}
      {isUser && (
        <div className="shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400">
                <User size={16} />
            </div>
        </div>
      )}
      
      <div className={cn("flex-1 space-y-1", !isUser && "pl-0")}>
        {isUser && (
             <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-zinc-300">Investigator</span>
                <span className="text-xs text-zinc-500">{message.timestamp}</span>
            </div>
        )}

        <div className={cn("prose prose-invert max-w-none text-sm leading-relaxed text-zinc-200")}>
            {message.content.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0">{line}</p>
            ))}
        </div>
        
        {message.citations && message.citations.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 mt-2">
                {message.citations.map((citation) => (
                    <Badge key={citation.id} variant="citation">
                        {citation.label}
                    </Badge>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
