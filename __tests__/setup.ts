import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import "@testing-library/jest-dom/vitest";

// Mock conversation data
export const mockConversations = [
  {
    session_id: "test-session-1",
    title: "Test Conversation 1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    message_count: 2,
  },
  {
    session_id: "test-session-2",
    title: "Test Conversation 2",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    message_count: 4,
  },
];

// Mock messages
export const mockMessages = [
  {
    id: 1,
    role: "user" as const,
    content: "Test question",
    sources: [],
    created_at: "2024-01-01T00:00:00Z",
    token_count: 10,
  },
  {
    id: 2,
    role: "assistant" as const,
    content: "Test answer",
    sources: [
      {
        chunk_id: "chunk-1",
        score: 0.95,
        doc_id: "doc-1",
        page_start: 1,
        page_end: 2,
        text: "Source text",
        source_filename: "test-document.pdf",
      },
    ],
    created_at: "2024-01-01T00:00:01Z",
    token_count: 50,
  },
];

// Mock query response
export const mockQueryResponse = {
  query: "Test query",
  answer: "Test answer from AI",
  sources: [
    {
      chunk_id: "chunk-1",
      score: 0.95,
      doc_id: "doc-1",
      page_start: 1,
      page_end: 2,
      text: "Source text",
      source_filename: "test-document.pdf",
    },
  ],
  model: "gpt-4",
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
  session_id: "new-session-id",
};

// MSW handlers for API mocking
export const handlers = [
  // GET /api/conversations
  http.get("/api/conversations", () => {
    return HttpResponse.json(mockConversations);
  }),

  // POST /api/conversations
  http.post("/api/conversations", () => {
    return HttpResponse.json({
      session_id: "new-session-id",
      title: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 0,
    });
  }),

  // GET /api/conversations/:sessionId/messages
  http.get("/api/conversations/:sessionId/messages", () => {
    return HttpResponse.json(mockMessages);
  }),

  // GET /api/conversations/:sessionId
  http.get("/api/conversations/:sessionId", ({ params }) => {
    const conversation = mockConversations.find(
      (c) => c.session_id === params.sessionId
    );
    if (conversation) {
      return HttpResponse.json(conversation);
    }
    return HttpResponse.json({ error: "Not found" }, { status: 404 });
  }),

  // DELETE /api/conversations/:sessionId
  http.delete("/api/conversations/:sessionId", () => {
    return HttpResponse.json({ success: true });
  }),

  // POST /api/query
  http.post("/api/query", () => {
    return HttpResponse.json(mockQueryResponse);
  }),
];

// Setup MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

// Mock Clerk auth
vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    user: {
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
    },
  })),
  useClerk: vi.fn(() => ({
    openSignIn: vi.fn(),
    signOut: vi.fn(),
  })),
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignOutButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => null,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      userId: "test-user-id",
    })
  ),
  currentUser: vi.fn(() =>
    Promise.resolve({
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
    })
  ),
  clerkMiddleware: vi.fn(() => vi.fn()),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));




