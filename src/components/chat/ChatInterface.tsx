"use client";

import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message, MessageBubble } from "./MessageBubble";
// import { TopStories } from "./TopStories";
import { Sidebar } from "./Sidebar";

interface ApiSource {
  chunk_id: string;
  score: number;
  doc_id: string;
  page_start: number;
  page_end: number;
  text: string;
  source_filename: string;
}

interface ApiResponse {
  query: string;
  answer: string;
  sources: ApiSource[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  session_id: string;
}

export function ChatInterface() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const createNewConversation = async (
    shouldClearMessages = true,
    retries = 2
  ): Promise<string | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch(
        "https://jeffgpt-backend-production.up.railway.app/api/conversations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();
      setSessionId(data.session_id);
      if (shouldClearMessages) {
        setMessages([]);
      }
      return data.session_id;
    } catch (err) {
      clearTimeout(timeoutId);

      // Retry on timeout or network error (cold start handling)
      if (retries > 0 && (err instanceof Error && (err.name === "AbortError" || err.message.includes("fetch")))) {
        console.warn(`Retrying conversation creation, ${retries} attempts left...`);
        return createNewConversation(shouldClearMessages, retries - 1);
      }

      console.error("Failed to create conversation:", err);
      return null;
    }
  };

  const handleNewConversation = () => {
    setSessionId(null);
    setMessages([]);
    setInput("");
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Reset height first to get correct scrollHeight
      const scrollHeight = textareaRef.current.scrollHeight;
      if (scrollHeight > 40) {
        textareaRef.current.style.height = `${scrollHeight}px`;
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendMessage = async (messageContent: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await createNewConversation(false);
        if (!currentSessionId) {
          throw new Error("Failed to create session");
        }
      }

      const queryController = new AbortController();
      const queryTimeoutId = setTimeout(() => queryController.abort(), 120000); // 120s for LLM

      const response = await fetch(
        "https://jeffgpt-backend-production.up.railway.app/api/query",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: userMessage.content,
            top_k: 5,
            session_id: currentSessionId,
          }),
          signal: queryController.signal,
        }
      );

      clearTimeout(queryTimeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      // Store session ID from response
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I encountered an error while processing your request. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!isSignedIn) {
      setPendingMessage(input.trim());
      openSignIn();
      return;
    }

    await sendMessage(input.trim());
  };

  // Send pending message after user signs in
  useEffect(() => {
    if (isSignedIn && pendingMessage) {
      sendMessage(pendingMessage);
      setPendingMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, pendingMessage]);

  const renderInput = () => (
    <div className="relative flex items-end gap-2 p-2 border border-zinc-700 rounded-lg bg-[#1a1a1e] shadow-xl hover:shadow-xl transition-all focus-within:border-zinc-600">
      <div className="flex-1 min-h-[40px] flex items-center ">
        <textarea
          ref={textareaRef}
          className="w-full bg-transparent border-0 focus:ring-0 p-2 pl-3 text-base resize-none max-h-[200px] text-zinc-200 placeholder:text-zinc-500 outline-none overflow-y-auto leading-normal"
          placeholder="Start investigating..."
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          style={{ height: "40px" }}
          disabled={isLoading}
        />
      </div>
      <Button
        size="icon"
        className="h-10 w-10 shrink-0 rounded bg-white text-black hover:bg-zinc-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSend}
        disabled={!input.trim() || isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowUp className="h-6 w-6" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="flex h-full bg-zinc-950/50 overflow-hidden">
      {isSignedIn && (
        <Sidebar
          isOpen={isSidebarOpen}
          onNewChat={handleNewConversation}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}

      <div className="flex-1 flex flex-col h-full relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-start h-full overflow-y-auto p-4 pt-[30vh]">
            <div className="w-full max-w-3xl flex flex-col items-center pb-8">
              <h1 className="font-serif text-3xl md:text-4xl text-zinc-100 text-center mb-8 leading-tight">
                I&apos;m an AI model trained
                <br />
                on the{" "}
                <span className="bg-[#8C5716] text-white px-2 py-1">
                  Epstein files.
                </span>
              </h1>

              <div className="w-full mb-4">{renderInput()}</div>

              {/* <TopStories /> */}
            </div>
          </div>
        ) : (
          <>
            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col min-h-full pb-4 pt-2 max-w-3xl mx-auto w-full">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {isLoading && (
                  <div className="flex w-full px-4 py-2 justify-start">
                    <div className="bg-transparent text-zinc-200 px-0 rounded-2xl py-3 text-sm leading-relaxed flex items-center">
                      <span className="text-zinc-400">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} className="h-4" />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 pb-6">
              <div className="mx-auto max-w-3xl">{renderInput()}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
