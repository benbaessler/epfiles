import { useMemo } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayout } from "@/lib/layout-context";

export interface Source {
  chunk_id: string;
  score: number;
  doc_id: string;
  page_start: number;
  page_end: number;
  text: string;
  source_filename: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: string;
}

import { MessageContent } from "./MessageContent";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const { setIsEvidenceOpen } = useLayout();

  // Group sources by filename to avoid duplicates and strip file extensions
  const uniqueSources = useMemo(() => {
    if (!message.sources || message.sources.length === 0) return [];
    
    const uniqueFilenames = new Set<string>();
    
    message.sources.forEach((source) => {
      // Remove file extension (everything after the last dot)
      const filenameWithoutExt = source.source_filename.replace(/\.[^/.]+$/, '');
      uniqueFilenames.add(filenameWithoutExt);
    });
    
    return Array.from(uniqueFilenames).sort();
  }, [message.sources]);

  return (
    <div className={cn("flex w-full px-4 py-2", isUser ? "justify-end" : "justify-start")}>
      <div 
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 leading-relaxed",
          isUser 
            ? "bg-zinc-800 text-zinc-100" 
            : "bg-transparent text-zinc-200 px-0"
        )}
      >
        <div className="max-w-none">
            <MessageContent content={message.content} isUser={isUser} />
        </div>
        
        {!isUser && uniqueSources.length > 0 && (
            <div className="mt-6">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                    Sources
                </h4>
                <div className="flex flex-wrap gap-2">
                    {uniqueSources.map((filename, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-800/50 rounded-lg text-sm text-zinc-300 cursor-pointer"
                        >
                            <FileText className="w-4 h-4 text-zinc-400" />
                            <span>{filename}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
