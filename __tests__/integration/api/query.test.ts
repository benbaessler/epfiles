import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock fetch globally for backend calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the auth function from Clerk
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { POST } from "@/app/api/query/route";

const mockAuth = vi.mocked(auth);

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
    mockFetch.mockReset();
  });

  describe("POST /api/query", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = createMockRequest({ query: "Test query" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should forward query to backend when authenticated", async () => {
      const queryResponse = {
        query: "Test query",
        answer: "Test answer",
        sources: [],
        model: "gpt-4",
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        session_id: "session-123",
      };

      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(queryResponse),
      });

      const request = createMockRequest({
        query: "Test query",
        top_k: 5,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(queryResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/query"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": "test-user-id",
          },
          body: JSON.stringify({ query: "Test query", top_k: 5 }),
        })
      );
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

      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(queryResponse),
      });

      const request = createMockRequest({
        query: "Follow-up query",
        session_id: "existing-session",
        top_k: 3,
      });
      const response = await POST(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/query"),
        expect.objectContaining({
          body: JSON.stringify({
            query: "Follow-up query",
            session_id: "existing-session",
            top_k: 3,
          }),
        })
      );
    });

    it("should forward backend errors", async () => {
      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ detail: "Rate limit exceeded" }),
      });

      const request = createMockRequest({ query: "Test" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.detail).toBe("Rate limit exceeded");
    });

    it("should return 500 when backend fetch fails", async () => {
      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      mockFetch.mockRejectedValue(new Error("Network error"));

      const request = createMockRequest({ query: "Test" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to query");
    });
  });
});









