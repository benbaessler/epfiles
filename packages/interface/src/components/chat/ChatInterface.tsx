"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUp, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Message, MessageBubble } from "./MessageBubble";
import { Sidebar } from "./Sidebar";
import { UsageIndicator } from "./UsageIndicator";
import { ApiKeyModal } from "./ApiKeyModal";
import { ApiKeyError } from "./ApiKeyError";
import { TopBar } from "@/components/layout/TopBar";
import {
  fetchConversations,
  fetchMessages,
  sendQuery,
  deleteConversation,
  ApiKeyError as ApiKeyErrorType,
  type Conversation,
  type ApiMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { useUsage } from "@/lib/hooks/useUsage";

export function ChatInterface() {
  const { isSignedIn, userId } = useAuth();
  const {
    messageCount,
    remainingMessages,
    apiKey,
    hasApiKey,
    hasReachedLimit,
    incrementUsage,
    setApiKey,
    clearApiKey,
    rememberKey,
    setRememberKey,
  } = useUsage();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [loadingText, setLoadingText] = useState("Searching...");
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
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

  // Show suggested questions after 3s delay (currently disabled)
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowSuggestions(true);
  //   }, 3000);
  //   return () => clearTimeout(timer);
  // }, []);

  // Cycle loading text every 4 seconds
  useEffect(() => {
    if (!isLoading) {
      setLoadingText("Searching...");
      return;
    }

    const interval = setInterval(() => {
      setLoadingText((prev) => {
        if (prev === "Investigating...") return "Searching...";
        if (prev === "Searching...") return "Thinking...";
        return "Investigating...";
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Fetch conversations when user signs in
  const loadConversations = useCallback(async () => {
    if (!isSignedIn || !userId) return;

    setIsLoadingConversations(true);
    try {
      const convos = await fetchConversations(userId);
      setConversations(convos);
    } catch {
      // Error already logged by API client
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isSignedIn, userId]);

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
      const apiMessages = await fetchMessages(conversationSessionId, userId);
      const uiMessages = apiMessages.map(apiMessageToMessage);
      setMessages(uiMessages);
      setSessionId(conversationSessionId);
    } catch {
      // Error already logged by API client
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
      await deleteConversation(pendingDeleteId, userId);
      // Remove from local state
      setConversations((prev) =>
        prev.filter((c) => c.session_id !== pendingDeleteId)
      );
      // If we deleted the current conversation, clear it
      if (sessionId === pendingDeleteId) {
        handleNewConversation();
      }
    } catch {
      // Error already logged by API client
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    setInput(nextValue);

    // Keep the composer single-line unless the user explicitly inserts a newline.
    // We also disable wrapping (wrap="off") so long text scrolls horizontally
    // instead of growing vertically.
    if (textareaRef.current) {
      textareaRef.current.style.height = "36px";
      if (nextValue.includes("\n")) {
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
        setIsMultiLine(scrollHeight > 36);
      } else {
        setIsMultiLine(false);
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
    // Check if user has reached limit and needs to sign in / provide API key
    if (hasReachedLimit && !hasApiKey) {
      // Only allow opening API key modal if signed in
      if (isSignedIn) {
        setApiKeyModalOpen(true);
      }
      // If not signed in, do nothing (UsageIndicator guides them to sign in)
      return;
    }

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
    setIsMultiLine(false);
    setApiKeyError(false);
    setLastUserMessage(messageContent);

    if (textareaRef.current) {
      textareaRef.current.style.height = "36px";
    }

    try {
      const data = await sendQuery({
        query: messageContent,
        sessionId,
        apiKey,
        messageCount,
        userId,
      });

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

      // Increment usage counter after successful message
      incrementUsage();

      // Refresh conversations list to show the new/updated conversation
      loadConversations();
    } catch (err) {
      if (err instanceof ApiKeyErrorType) {
        setApiKeyError(true);
      } else {
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
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input.trim());
  };

  // Suggested questions (currently disabled)
  // const suggestedQuestions = [
  //   "Did Donald Trump know about Epstein's conduct?",
  //   "What properties did Epstein own and who visited them?",
  //   "What does the evidence show about Ghislaine Maxwell's role?",
  // ];

  // const handleSuggestedQuestion = async (question: string) => {
  //   if (isLoading) return;
  //   await sendMessage(question);
  // };

  const handleRetryApiKeyError = async () => {
    if (!lastUserMessage || isLoading) return;
    setApiKeyError(false);
    // Remove the last user message since sendMessage will re-add it
    setMessages((prev) => prev.slice(0, -1));
    await sendMessage(lastUserMessage);
  };

  const renderInput = () => {
    return (
      <div className="w-full">
        <div
          className={`relative flex w-full gap-1.5 sm:gap-2 p-1.5 sm:p-2 border border-[#c4c4c4] rounded bg-white shadow-sm hover:shadow transition-all focus-within:border-[#161F81] ${
            isMultiLine ? "flex-col sm:flex-row sm:items-end" : "items-center"
          }`}
        >
          <textarea
            ref={textareaRef}
            className="min-w-0 flex-1 bg-transparent border-0 focus:ring-0 py-2 px-2 sm:px-3 text-sm sm:text-base resize-none max-h-[200px] text-[#060823] placeholder:text-[#71717a] outline-none overflow-x-auto overflow-y-auto leading-normal"
            placeholder={messages.length > 0 ? "Follow up" : "Start typing..."}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            style={{ height: "36px" }}
            disabled={isLoading}
            wrap="off"
          />

          <Button
            size="icon"
            className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded bg-[#161F81] text-white hover:bg-[#1a2599] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isMultiLine ? "self-end sm:self-auto" : ""
            }`}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>
        <UsageIndicator
          remainingMessages={remainingMessages}
          hasApiKey={hasApiKey}
          isSignedIn={isSignedIn ?? false}
          onAddApiKeyClick={() => setApiKeyModalOpen(true)}
        />
      </div>
    );
  };

  return (
    <div className="flex h-full bg-[#D9D9D9] overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isSignedIn && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

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
        {/* Top Bar */}
        <TopBar
          hasApiKey={hasApiKey}
          isSignedIn={isSignedIn ?? false}
          onSettingsClick={() => setApiKeyModalOpen(true)}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col px-4 sm:px-6">
            {/* Hero section - always centered */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-3xl flex flex-col items-center">
                <p className="font-code text-[10px] sm:text-xs text-[#52525b] mb-4 sm:mb-6 uppercase text-center leading-relaxed max-w-xs sm:max-w-none">
                  Trained on over 33,000 documents. May hallucinate, always cross-check with sources.
                </p>
                <h1 className="font-serif text-3xl tracking-tight sm:text-5xl md:text-6xl text-[#060823] text-center mb-6 sm:mb-8 leading-[1.1]">
                  Ask anything about the
                  <br />
                  Epstein files.
                </h1>
                {/* Input integrated with hero on desktop */}
                <div className="hidden sm:block w-full">
                  {renderInput()}
                </div>
              </div>
            </div>
            {/* Input fixed at bottom on mobile only */}
            <div className="sm:hidden w-full max-w-3xl mx-auto py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              {renderInput()}
            </div>
          </div>
        ) : (
          <>
            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col min-h-full pb-4 pt-6 max-w-3xl mx-auto w-full">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {isLoading && (
                  <div className="flex w-full px-2 sm:px-4 py-2 justify-start">
                    <div className="bg-transparent text-[#060823] px-0 rounded-2xl py-3 text-sm leading-relaxed flex items-center gap-2 shimmer">
                      <Loader className="h-4 w-4 text-[#52525b] animate-spin" />
                      <span className="text-[#52525b]">{loadingText}</span>
                    </div>
                  </div>
                )}

                {apiKeyError && (
                  <ApiKeyError onRetry={handleRetryApiKeyError} />
                )}

                <div ref={bottomRef} className="h-4" />
              </div>
            </div>

            {/* Input Area */}
            <div className="px-6 pb-3 pt-0 sm:p-4 sm:pt-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6">
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

      <ApiKeyModal
        open={apiKeyModalOpen}
        onOpenChange={setApiKeyModalOpen}
        existingKey={apiKey}
        onSave={setApiKey}
        onRemove={clearApiKey}
        rememberKey={rememberKey}
        onRememberKeyChange={setRememberKey}
      />
    </div>
  );
}
