import { describe, it, expect } from "vitest";
import {
  fetchConversations,
  fetchMessages,
  sendQuery,
  sendTrialQuery,
  deleteConversation,
  TrialExhaustedError,
  RateLimitedError,
} from "@/lib/api";
import { server } from "../../setup";
import { http, HttpResponse } from "msw";
import {
  mockConversations,
  mockMessages,
  mockQueryResponse,
  mockTrialQueryResponse,
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

  describe("sendTrialQuery", () => {
    it("should send a trial query and receive response with is_trial flag", async () => {
      const response = await sendTrialQuery("Test trial question");

      expect(response).toEqual(mockTrialQueryResponse);
      expect(response.answer).toBe("Test answer from AI");
      expect(response.is_trial).toBe(true);
      expect(response.session_id).toBe("trial-session-id");
    });

    it("should send trial query with fingerprint", async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post("/api/query/trial", async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockTrialQueryResponse);
        })
      );

      await sendTrialQuery("Test question", "test-fingerprint-123");

      expect(capturedBody).toMatchObject({
        query: "Test question",
        fingerprint: "test-fingerprint-123",
        top_k: 5,
      });
    });

    it("should send trial query without fingerprint when null", async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post("/api/query/trial", async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockTrialQueryResponse);
        })
      );

      await sendTrialQuery("Test question", null);

      expect(capturedBody).toMatchObject({
        query: "Test question",
        top_k: 5,
      });
      expect(capturedBody).not.toHaveProperty("fingerprint");
    });

    it("should send trial query with custom topK", async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post("/api/query/trial", async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockTrialQueryResponse);
        })
      );

      await sendTrialQuery("Test question", "fp", 10);

      expect(capturedBody).toMatchObject({
        query: "Test question",
        fingerprint: "fp",
        top_k: 10,
      });
    });

    it("should throw TrialExhaustedError when trial is exhausted", async () => {
      server.use(
        http.post("/api/query/trial", () => {
          return HttpResponse.json(
            {
              error: "trial_exhausted",
              message: "Sign up to continue using the service.",
            },
            { status: 403 }
          );
        })
      );

      await expect(sendTrialQuery("Test")).rejects.toThrow(TrialExhaustedError);
      await expect(sendTrialQuery("Test")).rejects.toThrow(
        "Sign up to continue using the service."
      );
    });

    it("should throw RateLimitedError when rate limited", async () => {
      server.use(
        http.post("/api/query/trial", () => {
          return HttpResponse.json(
            {
              error: "rate_limited",
              message: "Too many requests. Please try again later.",
            },
            { status: 429 }
          );
        })
      );

      await expect(sendTrialQuery("Test")).rejects.toThrow(RateLimitedError);
      await expect(sendTrialQuery("Test")).rejects.toThrow(
        "Too many requests. Please try again later."
      );
    });

    it("should throw generic error for other failures", async () => {
      server.use(
        http.post("/api/query/trial", () => {
          return HttpResponse.json(
            { message: "Internal server error" },
            { status: 500 }
          );
        })
      );

      await expect(sendTrialQuery("Test")).rejects.toThrow(
        "Internal server error"
      );
    });

    it("should throw fallback error when no message available", async () => {
      server.use(
        http.post("/api/query/trial", () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      await expect(sendTrialQuery("Test")).rejects.toThrow(
        "Failed to send query"
      );
    });
  });
});





