import type { Source } from "@/components/chat/MessageBubble";

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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e95aa682-0643-44bf-9f42-f6e888887a5d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:fetchConversations:entry',message:'Calling /api/conversations',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const response = await fetch("/api/conversations");

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e95aa682-0643-44bf-9f42-f6e888887a5d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:fetchConversations:response',message:'Response received',data:{status:response.status,ok:response.ok,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

export async function createConversation(): Promise<Conversation> {
  const response = await fetch("/api/conversations", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to create conversation");
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


