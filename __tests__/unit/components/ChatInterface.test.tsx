import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server, mockTrialQueryResponse } from "../../setup";
import { http, HttpResponse } from "msw";

const TRIAL_USED_KEY = "epfiles_trial_used";

// Track openSignIn calls
const mockOpenSignIn = vi.fn();

type MockUserState = {
  isSignedIn: boolean | undefined;
  isLoaded: boolean;
};

let mockUserState: MockUserState = {
  isSignedIn: false,
  isLoaded: true,
};

// Mock Clerk - configurable user state
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isSignedIn: mockUserState.isSignedIn,
    user: null,
    isLoaded: mockUserState.isLoaded,
  }),
  useClerk: () => ({
    openSignIn: mockOpenSignIn,
    signOut: vi.fn(),
  }),
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignOutButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => null,
}));

// Mock PostHog
vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({
    capture: vi.fn(),
  }),
}));

// Mock fingerprint hook
vi.mock("@/lib/fingerprint", () => ({
  useFingerprint: () => "test-fingerprint-123",
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

describe("ChatInterface - Trial Flow (Anonymous User)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockOpenSignIn.mockClear();
    mockUserState = { isSignedIn: false, isLoaded: true };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("with trial available", () => {
    it("should show default placeholder when trial is not exhausted", async () => {
      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      const textarea = getTextarea();
      expect(textarea).toBeInTheDocument();
      expect(textarea.getAttribute("placeholder")).toBe("Ask me anything...");
    });

    it("should not treat Clerk loading state as anonymous", async () => {
      mockUserState = { isSignedIn: undefined, isLoaded: false };

      let trialEndpointCalled = false;

      server.use(
        http.post("/api/query/trial", async () => {
          trialEndpointCalled = true;
          return HttpResponse.json(mockTrialQueryResponse);
        })
      );

      const { ChatInterface } = await import("@/components/chat/ChatInterface");

      render(<ChatInterface />);

      const textarea = getTextarea();
      await userEvent.type(textarea, "Test question");

      const sendButton = getSendButton();
      expect(sendButton).toBeDefined();
      await userEvent.click(sendButton!);

      // Give async handlers time; nothing should fire while Clerk is loading.
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(trialEndpointCalled).toBe(false);
      expect(mockOpenSignIn).not.toHaveBeenCalled();
    });

    it("should call trial endpoint when anonymous user sends first message", async () => {
      let trialEndpointCalled = false;

      server.use(
        http.post("/api/query/trial", async () => {
          trialEndpointCalled = true;
          return HttpResponse.json(mockTrialQueryResponse);
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
          expect(trialEndpointCalled).toBe(true);
        },
        { timeout: 3000 }
      );
    });

    it("should set localStorage after successful trial query", async () => {
      server.use(
        http.post("/api/query/trial", async () => {
          return HttpResponse.json(mockTrialQueryResponse);
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

      await waitFor(
        () => {
          expect(localStorage.getItem(TRIAL_USED_KEY)).toBe("true");
        },
        { timeout: 3000 }
      );
    });
  });

  describe("with trial exhausted", () => {
    beforeEach(() => {
      localStorage.setItem(TRIAL_USED_KEY, "true");
    });

    it("should show sign-in placeholder when trial is exhausted", async () => {
      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      const textarea = getTextarea();
      expect(textarea).toBeInTheDocument();
      expect(textarea.getAttribute("placeholder")?.toLowerCase()).toContain(
        "sign in"
      );
    });

    it("should open sign-in modal when trying to send with exhausted trial", async () => {
      const { ChatInterface } = await import(
        "@/components/chat/ChatInterface"
      );

      render(<ChatInterface />);

      const textarea = getTextarea();
      await userEvent.type(textarea, "Test question");

      const sendButton = getSendButton();
      await userEvent.click(sendButton!);

      expect(mockOpenSignIn).toHaveBeenCalled();
    });

    it("should not call trial endpoint when trial is exhausted", async () => {
      let trialEndpointCalled = false;

      server.use(
        http.post("/api/query/trial", async () => {
          trialEndpointCalled = true;
          return HttpResponse.json(mockTrialQueryResponse);
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

      // Wait a bit to ensure no async call was made
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(trialEndpointCalled).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should set localStorage when receiving trial_exhausted error from server", async () => {
      server.use(
        http.post("/api/query/trial", () => {
          return HttpResponse.json(
            {
              error: "trial_exhausted",
              message: "Sign up to continue using the service.",
            },
            { status: 403 }
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

      await waitFor(
        () => {
          expect(localStorage.getItem(TRIAL_USED_KEY)).toBe("true");
        },
        { timeout: 3000 }
      );
    });

    it("should remove optimistic user message on rate limited error", async () => {
      server.use(
        http.post("/api/query/trial", async () => {
          // Give React a moment to render optimistic user message before error response.
          await new Promise((resolve) => setTimeout(resolve, 10));
          return HttpResponse.json(
            {
              error: "rate_limited",
              message: "Too many requests. Please try again later.",
            },
            { status: 429 }
          );
        })
      );

      const { ChatInterface } = await import("@/components/chat/ChatInterface");

      render(<ChatInterface />);

      const textarea = getTextarea();
      await userEvent.type(textarea, "Test question");

      const sendButton = getSendButton();
      await userEvent.click(sendButton!);

      // Optimistic message should be added.
      await waitFor(() => {
        expect(screen.getByText("Test question")).toBeInTheDocument();
      });

      // After rate limit handling, user message should be removed and assistant error shown.
      await waitFor(() => {
        expect(
          screen.getByText("Too many requests. Please wait a moment and try again.")
        ).toBeInTheDocument();
        expect(screen.queryByText("Test question")).not.toBeInTheDocument();
      });
    });
  });
});
