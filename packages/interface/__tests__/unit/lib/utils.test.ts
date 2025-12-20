import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  it("should filter out falsy values", () => {
    const result = cn("base", false, null, undefined, "valid");
    expect(result).toBe("base valid");
  });

  it("should merge conflicting Tailwind classes correctly", () => {
    // tailwind-merge should keep only the last conflicting class
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["class-1", "class-2"], "class-3");
    expect(result).toBe("class-1 class-2 class-3");
  });

  it("should handle object syntax", () => {
    const result = cn({
      "text-red-500": true,
      "text-blue-500": false,
      "font-bold": true,
    });
    expect(result).toBe("text-red-500 font-bold");
  });

  it("should return empty string for no arguments", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle complex Tailwind class merging", () => {
    // More complex merge scenarios
    const result = cn(
      "text-sm text-gray-500",
      "hover:text-gray-700",
      "text-lg" // should override text-sm
    );
    expect(result).toBe("text-gray-500 hover:text-gray-700 text-lg");
  });
});














