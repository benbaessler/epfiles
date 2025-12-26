import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server, mockQueryResponse } from "../../setup";
import { http, HttpResponse } from "msw";

// Mock gdrive-links module
vi.mock("@/lib/gdrive-links", () => ({
  getGDriveLink: vi.fn(() => null),
}));

// Mock layout context
vi.mock("@/lib/layout-context", () => ({
  useLayout: () => ({
    selectedDocument: null,
    setSelectedDocument: vi.fn(),
  }),
  LayoutProvider: ({ children }: { children: React.ReactNode }) => children,
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
      expect(textareas[0]).toHaveAttribute("placeholder", "Ask me anything...");
    });

    it("should render the title text", async () => {
      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      // Component renders mobile and desktop versions, so there can be multiple
      const titleElements = screen.getAllByText(/I'm an AI model trained/);
      expect(titleElements.length).toBeGreaterThan(0);

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
        http.post("/api/query", async ({ request }) => {
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
