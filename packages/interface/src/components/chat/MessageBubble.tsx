import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayout } from "@/lib/layout-context";
import type { Source } from "@/lib/types";
import { MessageContent } from "./MessageContent";
import { SourceButton } from "./SourceButton";

export type { Source };

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: string;
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const { setSelectedDocument } = useLayout();
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);

  // Group sources by filename to avoid duplicates, keeping one source per unique filename
  const uniqueSources = useMemo(() => {
    if (!message.sources || message.sources.length === 0) return [];
    
    const seenFilenames = new Map<string, Source>();
    
    message.sources.forEach((source) => {
      // Remove file extension for display grouping
      const filenameWithoutExt = source.source_filename.replace(/\.[^/.]+$/, '');
      if (!seenFilenames.has(filenameWithoutExt)) {
        seenFilenames.set(filenameWithoutExt, source);
      }
    });
    
    return Array.from(seenFilenames.entries())
      .sort(([a], [b]) => a.localeCompare(b));
  }, [message.sources]);

  const handleSourceClick = (source: Source) => {
    setSelectedDocument(source);
  };

  return (
    <div
      className={cn(
        "flex w-full px-5 sm:px-4 py-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div 
        className={cn(
          "max-w-[90%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-3 leading-relaxed",
          isUser 
            ? "bg-[#BEC1F9] text-[#060823]" 
            : "bg-white text-[#060823] shadow-sm"
        )}
      >
        <div className="max-w-none">
          <MessageContent
            content={message.content}
            sources={message.sources}
            onSourceClick={handleSourceClick}
          />
        </div>
        
        {!isUser && uniqueSources.length > 0 && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
              className="flex items-center gap-1 text-xs font-semibold text-[#52525b] uppercase tracking-wide mb-2 hover:text-[#060823] cursor-pointer"
            >
              {isSourcesExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Sources
            </button>
            {isSourcesExpanded && (
              <div className="flex flex-wrap gap-2">
                {uniqueSources.map(([displayName, source]) => (
                  <SourceButton
                    key={source.chunk_id}
                    displayName={displayName}
                    docId={source.doc_id}
                    onClick={() => handleSourceClick(source)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
