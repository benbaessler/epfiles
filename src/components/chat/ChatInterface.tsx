"use client";

import * as React from "react";
import { Send, Paperclip } from "lucide-react";
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
      <div className="p-4 pb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-3xl">
            <div className="relative flex items-end gap-2 p-2 border border-zinc-700 rounded-xl bg-zinc-900/50 shadow-lg focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100 h-10 w-10 shrink-0 rounded-lg">
                    <Paperclip className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-h-[2.5rem]">
                     <textarea 
                        className="w-full bg-transparent border-0 focus:ring-0 p-2 text-sm resize-none max-h-32 min-h-[40px] text-zinc-200 placeholder:text-zinc-500 outline-none"
                        placeholder="Interrogate the evidence..."
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                     />
                </div>
                 <Button 
                    size="icon" 
                    className="h-10 w-10 shrink-0 rounded-lg mb-0.5 bg-primary text-primary-foreground hover:bg-primary/90"
                 >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            {/* Footer removed as requested */}
        </div>
      </div>
    </div>
  );
}
