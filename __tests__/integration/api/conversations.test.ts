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
import { GET, POST } from "@/app/api/conversations/route";

const mockAuth = vi.mocked(auth);

describe("Conversations API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("GET /api/conversations", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return conversations when authenticated", async () => {
      const mockConversations = [
        { session_id: "1", title: "Test", created_at: "2024-01-01" },
      ];

      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockConversations),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockConversations);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/conversations"),
        expect.objectContaining({
          headers: { "X-User-Id": "test-user-id" },
        })
      );
    });

    it("should return empty array when backend returns 405", async () => {
      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 405,
        json: () => Promise.resolve({ error: "Method not allowed" }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("should return 500 when auth throws", async () => {
      mockAuth.mockRejectedValue(new Error("Auth failed"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Auth failed");
    });

    it("should return 500 when backend fetch fails", async () => {
      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      mockFetch.mockRejectedValue(new Error("Network error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch conversations");
    });
  });

  describe("POST /api/conversations", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should create conversation when authenticated", async () => {
      const newConversation = {
        session_id: "new-id",
        title: null,
        created_at: "2024-01-01",
      };

      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(newConversation),
      });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(newConversation);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/conversations"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": "test-user-id",
          },
        })
      );
    });

    it("should forward backend errors", async () => {
      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Bad request" }),
      });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Bad request");
    });
  });
});


