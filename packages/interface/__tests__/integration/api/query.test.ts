import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { server } from "../../setup";
import { http, HttpResponse } from "msw";

const BACKEND_URL = "http://localhost:8000";

import { POST } from "@/app/api/query/route";

function createMockRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Query API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  describe("POST /api/query", () => {
    it("should forward query to backend", async () => {
      const queryResponse = {
        query: "Test query",
        answer: "Test answer",
        sources: [],
        model: "gpt-4",
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        session_id: "session-123",
      };

      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json(queryResponse);
        })
      );

      const request = createMockRequest({
        query: "Test query",
        top_k: 5,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(queryResponse);
    });

    it("should include session_id in request when provided", async () => {
      const queryResponse = {
        query: "Follow-up query",
        answer: "Follow-up answer",
        sources: [],
        model: "gpt-4",
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        session_id: "existing-session",
      };

      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(queryResponse);
        })
      );

      const request = createMockRequest({
        query: "Follow-up query",
        session_id: "existing-session",
        top_k: 3,
      });
      await POST(request);

      expect(capturedBody).toMatchObject({
        query: "Follow-up query",
        session_id: "existing-session",
        top_k: 3,
      });
    });

    it("should forward backend errors", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.json({ detail: "Rate limit exceeded" }, { status: 429 });
        })
      );

      const request = createMockRequest({ query: "Test" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.detail).toBe("Rate limit exceeded");
    });

    it("should return 500 when backend fetch fails", async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/query`, () => {
          return HttpResponse.error();
        })
      );

      const request = createMockRequest({ query: "Test" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to query");
    });
  });
});
