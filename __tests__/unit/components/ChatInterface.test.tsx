import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server, mockQueryResponse } from "../../setup";
import { http, HttpResponse } from "msw";

// Mock Clerk - configurable user state
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isSignedIn: true,
    isLoaded: true,
    user: {
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
    },
  }),
  useClerk: () => ({
    openSignIn: vi.fn(),
    signOut: vi.fn(),
  }),
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => null,
}));

// Mock layout context
vi.mock("@/lib/layout-context", () => ({
  useLayout: () => ({
    selectedDocument: null,
    setSelectedDocument: vi.fn(),
  }),
  LayoutProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Helper to get the first textarea (component renders two for mobile/desktop)
function getTextarea() {
  const textareas = screen.getAllByRole("textbox");
  return textareas[0];
}

// Helper to get the send button (the one with the ArrowUp SVG)
function getSendButton() {
  const buttons = screen.getAllByRole("button");
  // Find button that contains an SVG and no text content (the send button)
  return buttons.find(
    (btn) =>
      btn.querySelector("svg.lucide-arrow-up") !== null ||
      (btn.querySelector("svg") && btn.textContent?.trim() === "")
  );
}

// Mock scrollIntoView which doesn't exist in jsdom
Element.prototype.scrollIntoView = vi.fn();

describe("ChatInterface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should show default placeholder for signed in users", async () => {
      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      const textarea = getTextarea();
      expect(textarea).toBeInTheDocument();
      expect(textarea.getAttribute("placeholder")).toBe("Ask me anything...");
    });

    it("should send query when user submits a message", async () => {
      let queryEndpointCalled = false;

      server.use(
        http.post("/api/query", async () => {
          queryEndpointCalled = true;
          return HttpResponse.json(mockQueryResponse);
        })
      );

      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      const textarea = getTextarea();
      await userEvent.type(textarea, "Test question");

      const sendButton = getSendButton();
      expect(sendButton).toBeDefined();
      await userEvent.click(sendButton!);

      await waitFor(
        () => {
          expect(queryEndpointCalled).toBe(true);
        },
        { timeout: 3000 }
      );
    });

    it("should display user message after sending", async () => {
      server.use(
        http.post("/api/query", async () => {
          return HttpResponse.json(mockQueryResponse);
        })
      );

      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      const textarea = getTextarea();
      await userEvent.type(textarea, "Test question");

      const sendButton = getSendButton();
      await userEvent.click(sendButton!);

      await waitFor(() => {
        expect(screen.getByText("Test question")).toBeInTheDocument();
      });
    });

    it("should display assistant response after query", async () => {
      server.use(
        http.post("/api/query", async () => {
          return HttpResponse.json(mockQueryResponse);
        })
      );

      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      const textarea = getTextarea();
      await userEvent.type(textarea, "Test question");

      const sendButton = getSendButton();
      await userEvent.click(sendButton!);

      await waitFor(() => {
        expect(screen.getByText("Test answer from AI")).toBeInTheDocument();
      });
    });

    it("should show error message on query failure", async () => {
      server.use(
        http.post("/api/query", async () => {
          return HttpResponse.json(
            { error: "Internal server error" },
            { status: 500 }
          );
        })
      );

      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      const textarea = getTextarea();
      await userEvent.type(textarea, "Test question");

      const sendButton = getSendButton();
      await userEvent.click(sendButton!);

      await waitFor(() => {
        expect(
          screen.getByText(/encountered an error/i)
        ).toBeInTheDocument();
      });
    });
  });
});
