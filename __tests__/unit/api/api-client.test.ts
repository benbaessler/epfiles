import { describe, it, expect } from "vitest";
import {
  fetchConversations,
  fetchMessages,
  sendQuery,
  deleteConversation,
} from "@/lib/api";
import { server } from "../../setup";
import { http, HttpResponse } from "msw";
import {
  mockConversations,
  mockMessages,
  mockQueryResponse,
} from "../../setup";

describe("API Client", () => {
  describe("fetchConversations", () => {
    it("should fetch conversations successfully", async () => {
      const conversations = await fetchConversations();

      expect(conversations).toEqual(mockConversations);
      expect(conversations).toHaveLength(2);
    });

    it("should throw error when fetch fails", async () => {
      server.use(
        http.get("/api/conversations", () => {
          return HttpResponse.json(
            { error: "Internal server error" },
            { status: 500 }
          );
        })
      );

      await expect(fetchConversations()).rejects.toThrow(
        "Failed to fetch conversations"
      );
    });
  });

  describe("fetchMessages", () => {
    it("should fetch messages for a session", async () => {
      const messages = await fetchMessages("test-session-1");

      expect(messages).toEqual(mockMessages);
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("user");
      expect(messages[1].role).toBe("assistant");
    });

    it("should throw error when fetch fails", async () => {
      server.use(
        http.get("/api/conversations/:sessionId/messages", () => {
          return HttpResponse.json({ error: "Not found" }, { status: 404 });
        })
      );

      await expect(fetchMessages("invalid-session")).rejects.toThrow(
        "Failed to fetch messages"
      );
    });
  });

  describe("sendQuery", () => {
    it("should send a query and receive response", async () => {
      const response = await sendQuery("Test question");

      expect(response).toEqual(mockQueryResponse);
      expect(response.answer).toBe("Test answer from AI");
      expect(response.sources).toHaveLength(1);
      expect(response.session_id).toBe("new-session-id");
    });

    it("should send query with existing session ID", async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post("/api/query", async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      await sendQuery("Test question", "existing-session-id");

      expect(capturedBody).toMatchObject({
        query: "Test question",
        session_id: "existing-session-id",
        top_k: 5,
      });
    });

    it("should send query with custom topK", async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post("/api/query", async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      await sendQuery("Test question", null, 10);

      expect(capturedBody).toMatchObject({
        query: "Test question",
        top_k: 10,
      });
      expect(capturedBody).not.toHaveProperty("session_id");
    });

    it("should throw error with detail message when available", async () => {
      server.use(
        http.post("/api/query", () => {
          return HttpResponse.json(
            { detail: "Rate limit exceeded" },
            { status: 429 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow("Rate limit exceeded");
    });

    it("should throw generic error when no detail available", async () => {
      server.use(
        http.post("/api/query", () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow("Failed to send query");
    });
  });

  describe("deleteConversation", () => {
    it("should delete a conversation successfully", async () => {
      await expect(
        deleteConversation("test-session-1")
      ).resolves.toBeUndefined();
    });

    it("should throw error when delete fails", async () => {
      server.use(
        http.delete("/api/conversations/:sessionId", () => {
          return HttpResponse.json({ error: "Not found" }, { status: 404 });
        })
      );

      await expect(deleteConversation("invalid-session")).rejects.toThrow(
        "Failed to delete conversation"
      );
    });
  });
});

