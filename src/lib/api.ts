import type { Source } from "./types";

export interface Conversation {
  session_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ApiMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources: Source[];
  created_at: string;
  token_count: number;
}

export interface QueryResponse {
  query: string;
  answer: string;
  sources: Source[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  session_id: string;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const response = await fetch("/api/conversations");

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

export async function fetchMessages(sessionId: string): Promise<ApiMessage[]> {
  const response = await fetch(`/api/conversations/${sessionId}/messages`);

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  return response.json();
}

export interface UsageLimitError {
  error: "usage_limit_exceeded";
  message: string;
  current: number;
  limit: number;
  tier: string;
}

export class UsageLimitExceededError extends Error {
  current: number;
  limit: number;
  tier: string;

  constructor(data: UsageLimitError) {
    super(data.message);
    this.name = "UsageLimitExceededError";
    this.current = data.current;
    this.limit = data.limit;
    this.tier = data.tier;
  }
}

export async function sendQuery(
  query: string,
  sessionId?: string | null,
  topK: number = 5
): Promise<QueryResponse> {
  const response = await fetch("/api/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      top_k: topK,
      ...(sessionId && { session_id: sessionId }),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    
    if (response.status === 429 && error.error === "usage_limit_exceeded") {
      throw new UsageLimitExceededError(error);
    }
    
    throw new Error(error.detail || "Failed to send query");
  }

  return response.json();
}

export async function deleteConversation(sessionId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${sessionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete conversation");
  }
}

export interface UsageStats {
  current: number;
  limit: number;
  tier: string;
  resets_at: string;
}

export async function fetchUsage(): Promise<UsageStats> {
  const response = await fetch("/api/usage");

  if (!response.ok) {
    throw new Error("Failed to fetch usage");
  }

  return response.json();
}






