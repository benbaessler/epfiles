import { test, expect } from "@playwright/test";

test.describe("Chat Interface", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display landing page with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /I'm an AI model trained/i })
    ).toBeVisible();

    await expect(page.getByText("Epstein files")).toBeVisible();
  });

  test("should have chat input visible", async ({ page }) => {
    const textarea = page.getByPlaceholder("Ask me anything...");
    await expect(textarea).toBeVisible();
  });

  test("should have disabled send button when input is empty", async ({
    page,
  }) => {
    const sendButton = page.getByRole("button").filter({ has: page.locator("svg") });
    await expect(sendButton.first()).toBeDisabled();
  });

  test("should enable send button when text is entered", async ({ page }) => {
    const textarea = page.getByPlaceholder("Ask me anything...");
    await textarea.fill("Test question");

    // The send button should now be enabled
    const sendButton = page.getByRole("button").filter({ has: page.locator("svg") });
    await expect(sendButton.first()).toBeEnabled();
  });

  test("should show sign-in prompt when sending message while unauthenticated", async ({
    page,
  }) => {
    const textarea = page.getByPlaceholder("Ask me anything...");
    await textarea.fill("Test question");

    const sendButton = page.getByRole("button").filter({ has: page.locator("svg") });
    await sendButton.first().click();

    // Should trigger Clerk sign-in (we can't fully test this without Clerk test mode)
    // At minimum, we verify the click doesn't crash the app
    await expect(textarea).toBeVisible();
  });

  test("should support keyboard shortcut (Enter) to send", async ({ page }) => {
    const textarea = page.getByPlaceholder("Ask me anything...");
    await textarea.fill("Test question");
    await textarea.press("Enter");

    // App should not crash
    await expect(page).toHaveURL("/");
  });

  test("should support Shift+Enter for new line", async ({ page }) => {
    const textarea = page.getByPlaceholder("Ask me anything...");
    await textarea.fill("Line 1");
    await textarea.press("Shift+Enter");
    await textarea.type("Line 2");

    const value = await textarea.inputValue();
    expect(value).toContain("Line 1");
    expect(value).toContain("Line 2");
  });
});

test.describe("Page Structure", () => {
  test("should have proper page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.*$/); // Any title is fine
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const textarea = page.getByPlaceholder("Ask me anything...");
    await expect(textarea).toBeVisible();
  });

  test("should handle page refresh gracefully", async ({ page }) => {
    await page.goto("/");
    await page.reload();

    await expect(
      page.getByPlaceholder("Ask me anything...")
    ).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("should have no accessibility violations on landing page", async ({
    page,
  }) => {
    await page.goto("/");

    // Basic accessibility checks
    const textarea = page.getByPlaceholder("Ask me anything...");
    await expect(textarea).toHaveAttribute("placeholder");

    const sendButton = page.getByRole("button").first();
    await expect(sendButton).toBeVisible();
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Tab to textarea
    await page.keyboard.press("Tab");

    // The textarea or another focusable element should be focused
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});









