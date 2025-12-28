import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server, mockQueryResponse } from "../../setup";
import { http, HttpResponse } from "msw";

// Backend URL must match what api.ts uses
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Mock Clerk - must be before any component imports
vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(() => ({
    isSignedIn: false,
    isLoaded: true,
    user: null,
  })),
  useAuth: vi.fn(() => ({
    isSignedIn: false,
    isLoaded: true,
  })),
  useClerk: vi.fn(() => ({
    openSignIn: vi.fn(),
  })),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: () => null,
  SignedOut: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock gdrive-links module
vi.mock("@/lib/gdrive-links", () => ({
  getGDriveLink: vi.fn(() => null),
  getGDriveUrl: vi.fn(() => null),
  hasGDriveLink: vi.fn(() => false),
}));

// Mock layout context
vi.mock("@/lib/layout-context", () => ({
  useLayout: () => ({
    selectedDocument: null,
    setSelectedDocument: vi.fn(),
  }),
  LayoutProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock auth hook
vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({
    isSignedIn: false,
    isLoaded: true,
  }),
}));

// Mock usage hook
vi.mock("@/lib/hooks/useUsage", () => ({
  useUsage: () => ({
    messageCount: 0,
    remainingMessages: 10,
    apiKey: null,
    hasApiKey: false,
    hasReachedLimit: false,
    isLoaded: true,
    rememberKey: true,
    incrementUsage: vi.fn(),
    setApiKey: vi.fn(),
    clearApiKey: vi.fn(),
    setRememberKey: vi.fn(),
  }),
  FREE_MESSAGE_LIMIT: 10,
}));

// Mock scrollIntoView which doesn't exist in jsdom
Element.prototype.scrollIntoView = vi.fn();

describe("ChatInterface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  describe("basic rendering", () => {
    it("should render the chat interface with placeholder text", async () => {
      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      // Component renders two textareas (mobile/desktop), check that at least one has correct placeholder
      const textareas = screen.getAllByRole("textbox");
      expect(textareas.length).toBeGreaterThan(0);
      // When no messages exist, placeholder is "Start typing..."
      expect(textareas[0]).toHaveAttribute("placeholder", "Start typing...");
    });

    it("should render the title text", async () => {
      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      // Check for the hero text about Epstein files
      const epsteinElements = screen.getAllByText(/Epstein files/);
      expect(epsteinElements.length).toBeGreaterThan(0);
    });

    it("should have a send button", async () => {
      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      // Find the send button (button with ArrowUp icon)
      const buttons = screen.getAllByRole("button");
      const sendButton = buttons.find(
        (btn) => btn.querySelector("svg.lucide-arrow-up") !== null
      );

      expect(sendButton).toBeDefined();
    });

    it("should disable send button when input is empty", async () => {
      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      // Find the send button
      const buttons = screen.getAllByRole("button");
      const sendButton = buttons.find(
        (btn) => btn.querySelector("svg.lucide-arrow-up") !== null
      );

      expect(sendButton).toBeDisabled();
    });

    it("should enable send button when input has text", async () => {
      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      const textareas = screen.getAllByRole("textbox");
      await userEvent.type(textareas[0], "Test question");

      const buttons = screen.getAllByRole("button");
      const sendButton = buttons.find(
        (btn) => btn.querySelector("svg.lucide-arrow-up") !== null
      );

      expect(sendButton).not.toBeDisabled();
    });
  });

  describe("API integration", () => {
    it("should call query API when submitting a message", async () => {
      let apiCalled = false;
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post(`${BACKEND_URL}/api/query`, async ({ request }) => {
          apiCalled = true;
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      const textareas = screen.getAllByRole("textbox");
      await userEvent.type(textareas[0], "What happened in 2019?");

      const buttons = screen.getAllByRole("button");
      const sendButton = buttons.find(
        (btn) => btn.querySelector("svg.lucide-arrow-up") !== null
      );

      await userEvent.click(sendButton!);

      await waitFor(
        () => {
          expect(apiCalled).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(capturedBody).toMatchObject({
        query: "What happened in 2019?",
        top_k: 5,
      });
    });
  });
});
