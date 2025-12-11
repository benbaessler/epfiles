import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayout, type SelectedDocument } from "@/lib/layout-context";
import { MessageContent } from "./MessageContent";
import { SourceButton } from "./SourceButton";

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
    setSelectedDocument(source as SelectedDocument);
  };

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
          <MessageContent
            content={message.content}
            isUser={isUser}
            sources={message.sources}
            onSourceClick={handleSourceClick}
          />
        </div>
        
        {!isUser && uniqueSources.length > 0 && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
              className="flex items-center gap-1 text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 hover:text-zinc-400 cursor-pointer"
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
