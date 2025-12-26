import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { server } from "../../setup";
import { http, HttpResponse } from "msw";

const BACKEND_URL = "http://localhost:8000";

// Import route handlers
import { GET, DELETE } from "@/app/api/conversations/[sessionId]/route";
import { GET as GET_MESSAGES } from "@/app/api/conversations/[sessionId]/messages/route";

// Helper to create params promise (Next.js 15 pattern)
function createParams(sessionId: string): Promise<{ sessionId: string }> {
  return Promise.resolve({ sessionId });
}

function createMockRequest(url: string): NextRequest {
  return new NextRequest(url);
}

describe("Conversations Session API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  describe("GET /api/conversations/[sessionId]", () => {
    it("should return a specific conversation", async () => {
      const mockConversation = {
        session_id: "test-session-123",
        title: "Test Conversation",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T12:00:00Z",
        message_count: 5,
      };

      server.use(
        http.get(`${BACKEND_URL}/api/conversations/test-session-123`, () => {
          return HttpResponse.json(mockConversation);
        })
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/test-session-123"
      );
      const response = await GET(request, {
        params: createParams("test-session-123"),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockConversation);
      expect(data.session_id).toBe("test-session-123");
    });

    it("should return 404 when conversation not found", async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/conversations/nonexistent`, () => {
          return HttpResponse.json(
            { error: "Conversation not found" },
            { status: 404 }
          );
        })
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/nonexistent"
      );
      const response = await GET(request, {
        params: createParams("nonexistent"),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Conversation not found");
    });

    it("should return 500 when backend fetch fails", async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/conversations/test-session`, () => {
          return HttpResponse.error();
        })
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/test-session"
      );
      const response = await GET(request, {
        params: createParams("test-session"),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch conversation");
    });

    it("should forward backend error status codes", async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/conversations/unauthorized`, () => {
          return HttpResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/unauthorized"
      );
      const response = await GET(request, {
        params: createParams("unauthorized"),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/conversations/[sessionId]", () => {
    it("should delete a conversation successfully", async () => {
      server.use(
        http.delete(`${BACKEND_URL}/api/conversations/delete-me`, () => {
          return HttpResponse.json({ success: true, deleted: "delete-me" });
        })
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/delete-me"
      );
      const response = await DELETE(request, {
        params: createParams("delete-me"),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return 404 when deleting non-existent conversation", async () => {
      server.use(
        http.delete(`${BACKEND_URL}/api/conversations/not-found`, () => {
          return HttpResponse.json(
            { error: "Conversation not found" },
            { status: 404 }
          );
        })
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/not-found"
      );
      const response = await DELETE(request, {
        params: createParams("not-found"),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Conversation not found");
    });

    it("should return 500 when backend delete fails", async () => {
      server.use(
        http.delete(`${BACKEND_URL}/api/conversations/error-session`, () => {
          return HttpResponse.error();
        })
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/error-session"
      );
      const response = await DELETE(request, {
        params: createParams("error-session"),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete conversation");
    });

    it("should forward backend error responses", async () => {
      server.use(
        http.delete(`${BACKEND_URL}/api/conversations/forbidden`, () => {
          return HttpResponse.json(
            { error: "You do not have permission to delete this conversation" },
            { status: 403 }
          );
        })
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/forbidden"
      );
      const response = await DELETE(request, {
        params: createParams("forbidden"),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe(
        "You do not have permission to delete this conversation"
      );
    });
  });

  describe("GET /api/conversations/[sessionId]/messages", () => {
    it("should return messages for a conversation", async () => {
      const mockMessages = [
        {
          id: 1,
          role: "user",
          content: "What is the Epstein case about?",
          sources: [],
          created_at: "2024-01-01T00:00:00Z",
          token_count: 10,
        },
        {
          id: 2,
          role: "assistant",
          content: "The Epstein case involves...",
          sources: [
            {
              chunk_id: "chunk-1",
              score: 0.95,
              doc_id: "doc-1",
              page_start: 1,
              page_end: 2,
              text: "Source text",
              source_filename: "document.pdf",
            },
          ],
          created_at: "2024-01-01T00:00:01Z",
          token_count: 150,
        },
      ];

      server.use(
        http.get(
          `${BACKEND_URL}/api/conversations/msg-session/messages`,
          () => {
            return HttpResponse.json(mockMessages);
          }
        )
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/msg-session/messages"
      );
      const response = await GET_MESSAGES(request, {
        params: createParams("msg-session"),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].role).toBe("user");
      expect(data[1].role).toBe("assistant");
      expect(data[1].sources).toHaveLength(1);
    });

    it("should return empty array for conversation with no messages", async () => {
      server.use(
        http.get(
          `${BACKEND_URL}/api/conversations/empty-session/messages`,
          () => {
            return HttpResponse.json([]);
          }
        )
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/empty-session/messages"
      );
      const response = await GET_MESSAGES(request, {
        params: createParams("empty-session"),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("should return 404 when conversation not found", async () => {
      server.use(
        http.get(
          `${BACKEND_URL}/api/conversations/invalid-session/messages`,
          () => {
            return HttpResponse.json(
              { error: "Conversation not found" },
              { status: 404 }
            );
          }
        )
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/invalid-session/messages"
      );
      const response = await GET_MESSAGES(request, {
        params: createParams("invalid-session"),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Conversation not found");
    });

    it("should return 500 when backend fetch fails", async () => {
      server.use(
        http.get(
          `${BACKEND_URL}/api/conversations/error-session/messages`,
          () => {
            return HttpResponse.error();
          }
        )
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/error-session/messages"
      );
      const response = await GET_MESSAGES(request, {
        params: createParams("error-session"),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch messages");
    });

    it("should handle large message arrays", async () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i + 1}`,
        sources: [],
        created_at: new Date(Date.now() + i * 1000).toISOString(),
        token_count: 10,
      }));

      server.use(
        http.get(
          `${BACKEND_URL}/api/conversations/large-session/messages`,
          () => {
            return HttpResponse.json(manyMessages);
          }
        )
      );

      const request = createMockRequest(
        "http://localhost:3000/api/conversations/large-session/messages"
      );
      const response = await GET_MESSAGES(request, {
        params: createParams("large-session"),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(100);
    });
  });
});

