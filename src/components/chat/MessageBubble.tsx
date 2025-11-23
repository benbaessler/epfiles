import * as React from "react";
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

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const { setIsEvidenceOpen } = useLayout();

  // Group sources by filename to avoid duplicates
  const uniqueSources = React.useMemo(() => {
    if (!message.sources || message.sources.length === 0) return [];
    
    const sourceMap = new Map<string, { filename: string; pages: Set<number> }>();
    
    message.sources.forEach((source) => {
      if (!sourceMap.has(source.source_filename)) {
        sourceMap.set(source.source_filename, {
          filename: source.source_filename,
          pages: new Set()
        });
      }
      sourceMap.get(source.source_filename)!.pages.add(source.page_start);
    });
    
    return Array.from(sourceMap.values()).map(({ filename, pages }) => ({
      filename,
      pages: Array.from(pages).sort((a, b) => a - b)
    }));
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
        <div className="prose prose-invert max-w-none">
            {message.content.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0">{line}</p>
            ))}
        </div>
        
        {!isUser && uniqueSources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                    Sources
                </h4>
                <div className="space-y-1.5">
                    {uniqueSources.map((source, idx) => (
                        <div 
                            key={idx} 
                            className="text-sm text-zinc-400 flex items-start gap-2"
                        >
                            <span className="text-zinc-600 shrink-0">•</span>
                            <span>
                                <span className="text-zinc-300">{source.filename}</span>
                                <span className="text-zinc-600 mx-1">—</span>
                                <span className="text-zinc-500">
                                    p. {source.pages.join(', ')}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
