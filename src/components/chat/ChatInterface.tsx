"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Message, MessageBubble } from "./MessageBubble";
import { Sidebar } from "./Sidebar";
import {
  fetchConversations,
  fetchMessages,
  sendQuery,
  deleteConversation,
  type Conversation,
  type ApiMessage,
} from "@/lib/api";

export function ChatInterface() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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

  // Fetch conversations when user signs in
  const loadConversations = useCallback(async () => {
    if (!isSignedIn) return;

    setIsLoadingConversations(true);
    try {
      const convos = await fetchConversations();
      setConversations(convos);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Convert API message to UI message
  const apiMessageToMessage = (msg: ApiMessage): Message => ({
    id: msg.id.toString(),
    role: msg.role,
    content: msg.content,
    sources: msg.sources,
    timestamp: new Date(msg.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  // Load a specific conversation
  const loadConversation = async (conversationSessionId: string) => {
    try {
      const apiMessages = await fetchMessages(conversationSessionId);
      const uiMessages = apiMessages.map(apiMessageToMessage);
      setMessages(uiMessages);
      setSessionId(conversationSessionId);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const handleNewConversation = () => {
    setSessionId(null);
    setMessages([]);
    setInput("");
  };

  const handleDeleteConversation = (conversationSessionId: string) => {
    setPendingDeleteId(conversationSessionId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteConversation(pendingDeleteId);
      // Remove from local state
      setConversations((prev) =>
        prev.filter((c) => c.session_id !== pendingDeleteId)
      );
      // If we deleted the current conversation, clear it
      if (sessionId === pendingDeleteId) {
        handleNewConversation();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
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
      const data = await sendQuery(messageContent, sessionId);

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

      // Refresh conversations list to show the new/updated conversation
      loadConversations();
    } catch (err) {
      console.error("Failed to send message:", err);

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
          placeholder="Ask me anything..."
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
          conversations={conversations}
          isLoading={isLoadingConversations}
          currentSessionId={sessionId}
          onSelectConversation={loadConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      )}

      <div className="flex-1 flex flex-col h-full relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-start h-full overflow-y-auto p-4 pt-[20vh] sm:pt-[30vh]">
            <div className="w-full max-w-3xl flex flex-col items-center pb-8">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-zinc-100 text-center mb-6 sm:mb-8 leading-tight">
                I&apos;m an AI model trained
                <br />
                on the{" "}
                <span className="bg-[#8C5716] text-white px-2 py-1">
                  Epstein files.
                </span>
              </h1>

              <div className="w-full mb-4">{renderInput()}</div>
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

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteConversation}
        variant="destructive"
      />
    </div>
  );
}
