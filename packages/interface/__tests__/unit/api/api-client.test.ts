import { describe, it, expect } from "vitest";
import {
  fetchConversations,
  fetchMessages,
  sendQuery,
  deleteConversation,
  ApiKeyError,
} from "@/lib/api";
import { server } from "../../setup";
import { http, HttpResponse } from "msw";
import {
  mockConversations,
  mockMessages,
  mockQueryResponse,
} from "../../setup";

// Backend URL must match what api.ts uses
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

describe("API Client", () => {
  describe("fetchConversations", () => {
    it("should fetch conversations successfully", async () => {
      const conversations = await fetchConversations();

      expect(conversations).toEqual(mockConversations);
      expect(conversations).toHaveLength(2);
    });

    it("should throw error when fetch fails", async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/conversations`, () => {
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
        http.get(`${BACKEND_URL}/api/conversations/:sessionId/messages`, () => {
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
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
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
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
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
        http.post(`${BACKEND_URL}/api/query`, () => {
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
        http.post(`${BACKEND_URL}/api/query`, () => {
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
        http.delete(`${BACKEND_URL}/api/conversations/:sessionId`, () => {
          return HttpResponse.json({ error: "Not found" }, { status: 404 });
        })
      );

      await expect(deleteConversation("invalid-session")).rejects.toThrow(
        "Failed to delete conversation"
      );
    });
  });

  describe("ApiKeyError class", () => {
    it("should be an instance of Error", () => {
      const error = new ApiKeyError();
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiKeyError);
    });

    it("should have default message", () => {
      const error = new ApiKeyError();
      expect(error.message).toBe("Invalid API key or insufficient credit balance");
    });

    it("should accept custom message", () => {
      const error = new ApiKeyError("Custom API key error");
      expect(error.message).toBe("Custom API key error");
    });

    it("should have correct name property", () => {
      const error = new ApiKeyError();
      expect(error.name).toBe("ApiKeyError");
    });
  });

  describe("sendQuery API key error detection", () => {
    it("should throw ApiKeyError on 401 status", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow(ApiKeyError);
    });

    it("should throw ApiKeyError on 403 status", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "Forbidden" },
            { status: 403 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow(ApiKeyError);
    });

    it("should throw ApiKeyError when detail contains 'api key'", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "Invalid API key provided" },
            { status: 400 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow(ApiKeyError);
    });

    it("should throw ApiKeyError when detail contains 'api_key'", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "The api_key is invalid" },
            { status: 400 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow(ApiKeyError);
    });

    it("should throw ApiKeyError when detail contains 'authentication'", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "Authentication failed" },
            { status: 400 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow(ApiKeyError);
    });

    it("should throw ApiKeyError when detail contains 'unauthorized'", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "User is unauthorized" },
            { status: 400 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow(ApiKeyError);
    });

    it("should throw ApiKeyError when detail contains 'invalid key'", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "Invalid key format" },
            { status: 400 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow(ApiKeyError);
    });

    it("should throw ApiKeyError when detail contains 'incorrect api key'", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "Incorrect API key provided" },
            { status: 400 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow(ApiKeyError);
    });

    it("should include error detail in ApiKeyError message", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "Your API key has expired" },
            { status: 401 }
          );
        })
      );

      try {
        await sendQuery("Test");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiKeyError);
        expect((error as ApiKeyError).message).toBe("Your API key has expired");
      }
    });

    it("should NOT throw ApiKeyError for unrelated errors", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "Rate limit exceeded" },
            { status: 429 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow("Rate limit exceeded");
      await expect(sendQuery("Test")).rejects.not.toThrow(ApiKeyError);
    });

    it("should NOT throw ApiKeyError for server errors without API key keywords", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(
            { detail: "Internal server error" },
            { status: 500 }
          );
        })
      );

      await expect(sendQuery("Test")).rejects.toThrow("Internal server error");
      await expect(sendQuery("Test")).rejects.not.toThrow(ApiKeyError);
    });
  });

  describe("sendQuery with options object", () => {
    it("should accept options object format", async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      await sendQuery({
        query: "Options test",
        sessionId: "opt-session",
        topK: 8,
      });

      expect(capturedBody).toMatchObject({
        query: "Options test",
        session_id: "opt-session",
        top_k: 8,
      });
    });

    it("should use default topK when not specified in options", async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      await sendQuery({ query: "Default topK test" });

      expect(capturedBody).toMatchObject({
        query: "Default topK test",
        top_k: 5,
      });
    });

    it("should send API key header when provided", async () => {
      let capturedHeaders: Headers | null = null;

      server.use(
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      await sendQuery({
        query: "API key test",
        apiKey: "xai-test-key-12345",
      });

      expect(capturedHeaders?.get("X-XAI-API-Key")).toBe("xai-test-key-12345");
    });

    it("should NOT send API key header when not provided", async () => {
      let capturedHeaders: Headers | null = null;

      server.use(
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      await sendQuery({ query: "No API key" });

      expect(capturedHeaders?.get("X-XAI-API-Key")).toBeNull();
    });

    it("should send message count header when provided", async () => {
      let capturedHeaders: Headers | null = null;

      server.use(
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      await sendQuery({
        query: "Message count test",
        messageCount: 7,
      });

      expect(capturedHeaders?.get("X-Message-Count")).toBe("7");
    });

    it("should NOT send message count header when undefined", async () => {
      let capturedHeaders: Headers | null = null;

      server.use(
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      await sendQuery({ query: "No message count" });

      expect(capturedHeaders?.get("X-Message-Count")).toBeNull();
    });

    it("should handle all options together", async () => {
      let capturedBody: Record<string, unknown> | null = null;
      let capturedHeaders: Headers | null = null;

      server.use(
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          capturedHeaders = request.headers;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      await sendQuery({
        query: "Full options test",
        sessionId: "full-session",
        topK: 10,
        apiKey: "xai-full-key",
        messageCount: 15,
      });

      expect(capturedBody).toMatchObject({
        query: "Full options test",
        session_id: "full-session",
        top_k: 10,
      });
      expect(capturedHeaders?.get("X-XAI-API-Key")).toBe("xai-full-key");
      expect(capturedHeaders?.get("X-Message-Count")).toBe("15");
    });
  });
});

