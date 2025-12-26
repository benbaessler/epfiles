import type { Source } from "./types";

export class ApiKeyError extends Error {
  constructor(message: string = "Invalid API key or insufficient credit balance") {
    super(message);
    this.name = "ApiKeyError";
  }
}

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

export interface SendQueryOptions {
  query: string;
  sessionId?: string | null;
  topK?: number;
  apiKey?: string | null;
  messageCount?: number;
}

export async function sendQuery(
  queryOrOptions: string | SendQueryOptions,
  sessionId?: string | null,
  topK: number = 5,
  apiKey?: string | null,
  messageCount?: number
): Promise<QueryResponse> {
  // Support both old signature and new options object
  let opts: SendQueryOptions;
  if (typeof queryOrOptions === "string") {
    opts = { query: queryOrOptions, sessionId, topK, apiKey, messageCount };
  } else {
    opts = { topK: 5, ...queryOrOptions };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add API key header if provided
  if (opts.apiKey) {
    headers["X-XAI-API-Key"] = opts.apiKey;
  }

  // Add message count header for free tier validation
  if (opts.messageCount !== undefined) {
    headers["X-Message-Count"] = opts.messageCount.toString();
  }

  const response = await fetch("/api/query", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: opts.query,
      top_k: opts.topK,
      ...(opts.sessionId && { session_id: opts.sessionId }),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = (error.detail || "").toLowerCase();
    
    // Detect API key related errors
    if (
      response.status === 401 ||
      response.status === 403 ||
      errorMessage.includes("api key") ||
      errorMessage.includes("api_key") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("invalid key") ||
      errorMessage.includes("incorrect api key")
    ) {
      throw new ApiKeyError(error.detail || "Invalid API key");
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
