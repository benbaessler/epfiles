import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "../../setup";
import { http, HttpResponse } from "msw";

const BACKEND_URL = "http://localhost:8000";

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
    server.resetHandlers();
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
      server.use(
        http.get(`${BACKEND_URL}/api/conversations`, () => {
          return HttpResponse.json(mockConversations);
        })
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockConversations);
    });

    it("should return empty array when backend returns 405", async () => {
      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      server.use(
        http.get(`${BACKEND_URL}/api/conversations`, () => {
          return HttpResponse.json({ error: "Method not allowed" }, { status: 405 });
        })
      );

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
      server.use(
        http.get(`${BACKEND_URL}/api/conversations`, () => {
          return HttpResponse.error();
        })
      );

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
      server.use(
        http.post(`${BACKEND_URL}/api/conversations`, () => {
          return HttpResponse.json(newConversation);
        })
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(newConversation);
    });

    it("should forward backend errors", async () => {
      mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      server.use(
        http.post(`${BACKEND_URL}/api/conversations`, () => {
          return HttpResponse.json({ error: "Bad request" }, { status: 400 });
        })
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Bad request");
    });
  });
});
