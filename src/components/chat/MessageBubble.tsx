import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
    <div className={cn("flex w-full px-4 py-2", isUser ? "justify-end" : "justify-start")}>
      <div 
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser 
            ? "bg-zinc-800 text-zinc-100" 
            : "bg-transparent text-zinc-200 px-0"
        )}
      >
        <div className="prose prose-invert max-w-none">
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
