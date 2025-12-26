import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "../../setup";
import { http, HttpResponse } from "msw";

const BACKEND_URL = "http://localhost:8000";

import { GET, POST } from "@/app/api/conversations/route";

describe("Conversations API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  describe("GET /api/conversations", () => {
    it("should return conversations", async () => {
      const mockConversations = [
        { session_id: "1", title: "Test", created_at: "2024-01-01" },
      ];

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

    it("should return 500 when backend fetch fails", async () => {
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
    it("should create conversation", async () => {
      const newConversation = {
        session_id: "new-id",
        title: null,
        created_at: "2024-01-01",
      };

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
