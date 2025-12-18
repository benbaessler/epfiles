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
import { usePostHog } from "posthog-js/react";
import { ArrowUp, Loader, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";
import { Message, MessageBubble } from "./MessageBubble";
import { Sidebar } from "./Sidebar";
import {
  fetchConversations,
  fetchMessages,
  sendQuery,
  sendTrialQuery,
  deleteConversation,
  fetchUsage,
  UsageLimitExceededError,
  TrialExhaustedError,
  RateLimitedError,
  type Conversation,
  type ApiMessage,
  type UsageStats,
} from "@/lib/api";
import { useFingerprint } from "@/lib/fingerprint";

const TRIAL_USED_KEY = "epfiles_trial_count";
const TRIAL_QUERY_LIMIT = 5;
const LIMITS_DISABLED = process.env.NEXT_PUBLIC_DISABLE_LIMITS === "true";

export function ChatInterface() {
  const { isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const posthog = usePostHog();
  const fingerprint = useFingerprint();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Start with sidebar closed on mobile, open on desktop
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trialExhausted, setTrialExhausted] = useState(() => {
    if (LIMITS_DISABLED) return false;
    if (typeof window !== "undefined") {
      const count = parseInt(localStorage.getItem(TRIAL_USED_KEY) || "0", 10);
      return count >= TRIAL_QUERY_LIMIT;
    }
    return false;
  });
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [loadingText, setLoadingText] = useState("Searching...");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isAtLimit = LIMITS_DISABLED
    ? false
    : usage
      ? usage.current >= usage.limit
      : false;

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Show suggested questions after 3s delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSuggestions(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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

  // Fetch usage when user signs in
  const loadUsage = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const data = await fetchUsage();
      setUsage(data);
    } catch (err) {
      console.error("Failed to load usage:", err);
    }
  }, [isSignedIn]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

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
      posthog.capture("conversation_deleted", {
        session_id: pendingDeleteId,
      });
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
    const nextValue = e.target.value;
    setInput(nextValue);

    // Keep the composer single-line unless the user explicitly inserts a newline.
    // We also disable wrapping (wrap="off") so long text scrolls horizontally
    // instead of growing vertically.
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      if (nextValue.includes("\n")) {
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
        setIsMultiLine(scrollHeight > 40);
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
    // Treat Clerk loading state as neither anonymous nor authenticated.
    // Avoid routing signed-in users (who haven't finished loading) through trial endpoints.
    if (!isLoaded) return;

    const isNewConversation = !sessionId;
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

    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }

    const isTrial = !isSignedIn;

    posthog.capture("query_sent", {
      session_id: sessionId,
      is_new_conversation: isNewConversation,
      is_trial: isTrial,
      query_length: messageContent.length,
    });

    try {
      // Use trial endpoint for anonymous users, regular endpoint for signed-in users
      const data = isTrial
        ? await sendTrialQuery(messageContent, fingerprint)
        : await sendQuery(messageContent, sessionId);

      // Store session ID from response (only for authenticated users)
      if (!isTrial && data.session_id && !sessionId) {
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

      posthog.capture("query_success", {
        session_id: data.session_id,
        is_trial: isTrial,
        sources_count: data.sources?.length ?? 0,
        tokens_used: data.usage?.total_tokens ?? 0,
      });

      // Update trial count after successful response
      if (isTrial && "remaining" in data) {
        const newCount = TRIAL_QUERY_LIMIT - data.remaining;
        localStorage.setItem(TRIAL_USED_KEY, newCount.toString());
        if (data.remaining === 0) {
          setTrialExhausted(true);
        }
        posthog.capture("trial_used", { remaining: data.remaining });
      } else if (!isTrial) {
        // Refresh conversations list to show the new/updated conversation
        loadConversations();
      }
    } catch (err) {
      console.error("Failed to send message:", err);

      if (err instanceof TrialExhaustedError) {
        posthog.capture("trial_exhausted");
        localStorage.setItem(TRIAL_USED_KEY, TRIAL_QUERY_LIMIT.toString());
        setTrialExhausted(true);
        // Remove the user message we optimistically added
        setMessages((prev) => prev.slice(0, -1));
      } else if (err instanceof RateLimitedError) {
        posthog.capture("rate_limited", { is_trial: isTrial });
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Too many requests. Please wait a moment and try again.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        // Rate limiting happens before backend processing; remove optimistic user message.
        setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
      } else if (err instanceof UsageLimitExceededError) {
        posthog.capture("usage_limit_hit", {
          tier: err.tier,
          current: err.current,
          limit: err.limit,
        });
        // Refresh usage to show the limit message
        setUsage({
          current: err.current,
          limit: err.limit,
          tier: err.tier,
          resets_at: "",
        });
        // Remove the user message we optimistically added
        setMessages((prev) => prev.slice(0, -1));
      } else {
        posthog.capture("query_error", {
          error_type: err instanceof Error ? err.name : "unknown",
          session_id: sessionId,
          is_trial: isTrial,
        });
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
    if (!isLoaded) return;

    // If not signed in and trial is exhausted, prompt sign-in
    if (!isSignedIn && trialExhausted) {
      setPendingMessage(input.trim());
      openSignIn();
      return;
    }

    await sendMessage(input.trim());
  };

  // Send pending message after user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn && pendingMessage) {
      sendMessage(pendingMessage);
      setPendingMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, pendingMessage]);

  // Clear trial exhausted state when user signs in
  useEffect(() => {
    if (isSignedIn) {
      setTrialExhausted(false);
    }
  }, [isSignedIn]);

  const suggestedQuestions = [
    "Did Donald Trump know about Epstein's conduct?",
    "What properties did Epstein own and who visited them?",
    "What does the evidence show about Ghislaine Maxwell's role?",
  ];

  const handleSuggestedQuestion = async (question: string, index: number) => {
    if (isLoading || isAtLimit) return;
    if (!isLoaded) return;

    posthog.capture("suggested_question_clicked", {
      question_index: index,
    });

    // If not signed in and trial is exhausted, prompt sign-in
    if (!isSignedIn && trialExhausted) {
      setPendingMessage(question);
      openSignIn();
      return;
    }

    await sendMessage(question);
  };

  const renderInput = () => {
    if (isAtLimit) {
      return (
        <div className="relative flex items-center justify-center p-4 border border-zinc-700 rounded-lg bg-[#1a1a1e]">
          <p className="text-sm text-zinc-400">
            You have hit your message limit,{" "}
            <Link
              href="/billing"
              className="text-white underline hover:text-zinc-200"
              onClick={() =>
                posthog.capture("upgrade_link_clicked", { tier: usage?.tier })
              }
            >
              upgrade here
            </Link>
          </p>
        </div>
      );
    }

    return (
      <div
        className={`relative flex w-full gap-2 p-2 border border-zinc-700 rounded-xl bg-[#1a1a1e] shadow-xl hover:shadow-xl transition-all focus-within:border-zinc-600 ${
          isMultiLine ? "flex-col sm:flex-row sm:items-end" : "items-end"
        }`}
      >
        <textarea
          ref={textareaRef}
          className="min-w-0 flex-1 bg-transparent border-0 focus:ring-0 p-2 pl-3 text-base resize-none max-h-[200px] text-zinc-200 placeholder:text-zinc-500 outline-none overflow-x-auto overflow-y-auto leading-normal"
          placeholder={"Ask me anything..."}
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          style={{ height: "40px" }}
          disabled={isLoading}
          wrap="off"
        />

        <Button
          size="icon"
          className={`h-10 w-10 shrink-0 rounded-lg bg-white text-black hover:bg-zinc-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isMultiLine ? "self-end sm:self-auto" : ""
          }`}
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowUp className="h-5 w-5" />
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-zinc-950/50 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isSignedIn && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
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
        {/* Mobile menu toggle */}
        {isSignedIn && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden absolute top-4 left-4 z-20 text-zinc-300 hover:text-zinc-200 hover:bg-zinc-700/50 rounded-lg cursor-pointer w-10 h-10 flex items-center justify-center"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        {messages.length === 0 ? (
          <div className="h-full w-full">
            {/* Mobile: title centered, composer bottom */}
            <div className="sm:hidden flex flex-col h-full min-h-[100dvh] overflow-hidden">
              <div className="flex-1 flex items-center justify-center px-6 pt-20 pb-8">
                <div className="w-full max-w-3xl flex flex-col items-center">
                  <h1 className="font-serif text-3xl text-zinc-100 text-center leading-tight">
                    I&apos;m an AI model trained
                    <br />
                    on the{" "}
                    <span className="bg-[#8C5716] text-white px-2 py-1">
                      Epstein files.
                    </span>
                  </h1>
                </div>
              </div>

              <div className="w-full px-6 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <div className="mx-auto max-w-3xl w-full">
                  <div className="w-full flex flex-col items-center gap-3">
                    <div className="flex flex-col items-center gap-2">
                      {suggestedQuestions.map((question, index) => (
                        <button
                          key={question}
                          onClick={() =>
                            handleSuggestedQuestion(question, index)
                          }
                          disabled={isLoading || !showSuggestions || isAtLimit}
                          className={`text-sm text-zinc-300 cursor-pointer disabled:cursor-not-allowed px-3 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 bg-zinc-800/50 hover:bg-zinc-700 text-center ${
                            showSuggestions
                              ? "opacity-70 hover:opacity-100 translate-y-0"
                              : "opacity-0 -translate-y-2"
                          }`}
                          style={{
                            transition: "opacity 500ms, transform 500ms",
                            transitionDelay: showSuggestions
                              ? `${
                                  (suggestedQuestions.length - 1 - index) * 500
                                }ms`
                              : "0ms",
                          }}
                        >
                          {question}
                        </button>
                      ))}
                    </div>

                    {renderInput()}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop/tablet: centered stack (original layout) */}
            <div className="hidden sm:flex flex-col items-center justify-start h-full overflow-y-auto p-4 pt-[30vh]">
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

                <div className="w-full flex flex-col items-center gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={question}
                      onClick={() => handleSuggestedQuestion(question, index)}
                      disabled={isLoading || !showSuggestions || isAtLimit}
                      className={`text-sm text-zinc-300 cursor-pointer disabled:cursor-not-allowed px-3 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 bg-zinc-800/50 hover:bg-zinc-700 text-center ${
                        showSuggestions
                          ? "opacity-70 hover:opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2"
                      }`}
                      style={{
                        transition: "opacity 500ms, transform 500ms",
                        transitionDelay: showSuggestions
                          ? `${index * 500}ms`
                          : "0ms",
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
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
                    <div className="bg-transparent text-zinc-200 px-0 rounded-2xl py-3 text-sm leading-relaxed flex items-center gap-2 shimmer">
                      <Loader className="h-4 w-4 text-zinc-400 animate-spin" />
                      <span className="text-zinc-400">{loadingText}</span>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} className="h-4" />
              </div>
            </div>

            {/* Input Area */}
            <div className="px-6 py-3 sm:p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6">
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
