"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message, MessageBubble } from "./MessageBubble";

const mockMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "Show me all flight logs from 2002 linking N909JE to Teterboro Airport.",
    timestamp: "10:42 AM",
  },
  {
    id: "2",
    role: "assistant",
    content: "I have analyzed the flight manifests for N909JE (The 'Lolita Express') for the year 2002. There are 3 confirmed records matching your criteria for Teterboro Airport (TEB).\n\nOn June 14, 2002, the aircraft departed TEB for Palm Beach International (PBI). The passenger manifest lists Jeffrey Epstein and Ghislaine Maxwell.\n\nA subsequent entry on August 12, 2002, shows a return flight from PBI to TEB. Note that the passenger list for this flight is redacted in Exhibit B, but cross-referencing with the pilot's personal logbook suggests the presence of two additional undisclosed passengers.",
    citations: [
      { id: "c1", label: "[Doc 009: p.12]" },
      { id: "c2", label: "[Log 2002-06-14]" },
      { id: "c3", label: "[Deposition GM: p.442]" },
    ],
    timestamp: "10:42 AM",
  },
];

export function ChatInterface() {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/50">
        {/* Chat Stream */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full pb-4 pt-2 max-w-3xl mx-auto w-full">
            {mockMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
            ))}
            
            {/* Empty state or bottom spacer */}
            <div className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 pb-6">
        <div className="mx-auto max-w-3xl">
            <div className="relative flex items-end gap-2 p-2 border border-zinc-700 rounded-xl bg-[#35343b] shadow-lg hover:shadow-xl transition-all">
                <div className="flex-1 min-h-[40px] flex items-center">
                     <textarea 
                        ref={textareaRef}
                        className="w-full bg-transparent border-0 focus:ring-0 p-2 pl-3 text-sm resize-none max-h-[200px] text-zinc-200 placeholder:text-zinc-500 outline-none overflow-y-auto leading-relaxed"
                        placeholder="Interrogate the evidence..."
                        rows={1}
                        value={input}
                        onChange={handleInput}
                        style={{ height: "40px" }}
                     />
                </div>
                 <Button 
                    size="icon" 
                    className="h-10 w-10 shrink-0 rounded-lg bg-white text-black hover:bg-zinc-200"
                 >
                    <ArrowUp className="h-5 w-5" />
                </Button>
            </div>
            {/* Footer removed as requested */}
        </div>
      </div>
    </div>
  );
}
