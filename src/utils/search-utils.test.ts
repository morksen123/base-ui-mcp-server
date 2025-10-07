import { describe, it, expect, beforeAll } from "vitest";
import { searchWithScoring, searchWithPagination } from "./search-utils";
import { BaseUIComponent } from "../types";

// Mock component data for testing
const createMockComponent = (
  name: string,
  description: string = ""
): BaseUIComponent => ({
  name,
  description,
  props: {},
  dataAttributes: {},
  cssVariables: {},
});

const mockComponents = new Map<string, BaseUIComponent>([
  [
    "avatar-root",
    createMockComponent(
      "AvatarRoot",
      "Displays a user's profile picture, initials, or fallback icon."
    ),
  ],
  [
    "avatar-image",
    createMockComponent(
      "AvatarImage",
      "The image to be displayed in the avatar."
    ),
  ],
  [
    "avatar-fallback",
    createMockComponent(
      "AvatarFallback",
      "Rendered when the image fails to load or when no image is provided."
    ),
  ],
  [
    "dialog-root",
    createMockComponent(
      "DialogRoot",
      "A popup that opens on top of the entire page."
    ),
  ],
  ["dialog-trigger", createMockComponent("DialogTrigger", "Opens the dialog.")],
  [
    "dialog-backdrop",
    createMockComponent("DialogBackdrop", "A backdrop for the dialog."),
  ],
  ["button", createMockComponent("Button", "A clickable button element.")],
  ["input", createMockComponent("Input", "A text input field.")],
  [
    "autocomplete-value",
    createMockComponent(
      "AutocompleteValue",
      "The current value of the autocomplete."
    ),
  ],
  [
    "navigation-menu-arrow",
    createMockComponent(
      "NavigationMenuArrow",
      "Displays an element pointing toward the navigation menu's current anchor."
    ),
  ],
]);

describe("searchWithScoring", () => {
  it("should return exact matches with high scores", () => {
    const results = searchWithScoring(mockComponents, "avatar", {
      limit: 10,
      minScore: 0,
    });

    expect(results.length).toBeGreaterThan(0);

    // Avatar components should be at the top
    const topResults = results.slice(0, 3);
    const hasAvatarInTop3 = topResults.every((r) =>
      r.component.name.toLowerCase().includes("avatar")
    );

    expect(hasAvatarInTop3).toBe(true);

    // Scores should be between 0 and 1
    results.forEach((result) => {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    // Log scores for debugging
    console.log("\nSearch 'avatar' - Top 5 results:");
    results.slice(0, 5).forEach((r) => {
      console.log(`  ${r.component.name}: ${r.score.toFixed(3)}`);
    });
  });

  it("should filter by minScore correctly", () => {
    const lowScoreResults = searchWithScoring(mockComponents, "avatar", {
      limit: 100,
      minScore: 0.3,
    });

    const highScoreResults = searchWithScoring(mockComponents, "avatar", {
      limit: 100,
      minScore: 0.7,
    });

    const perfectScoreResults = searchWithScoring(mockComponents, "avatar", {
      limit: 100,
      minScore: 0.95,
    });

    console.log(`\nScore filtering for 'avatar':`);
    console.log(`  minScore 0.3: ${lowScoreResults.length} results`);
    console.log(`  minScore 0.7: ${highScoreResults.length} results`);
    console.log(`  minScore 0.95: ${perfectScoreResults.length} results`);

    // Higher minScore should return fewer or equal results
    expect(highScoreResults.length).toBeLessThanOrEqual(lowScoreResults.length);
    expect(perfectScoreResults.length).toBeLessThanOrEqual(
      highScoreResults.length
    );

    // Only Avatar components should match with high score
    if (highScoreResults.length > 0) {
      highScoreResults.forEach((result) => {
        expect(result.component.name.toLowerCase()).toContain("avatar");
      });
    }

    // All results should meet minimum score
    lowScoreResults.forEach((result) => {
      expect(result.score).toBeGreaterThanOrEqual(0.3);
    });

    highScoreResults.forEach((result) => {
      expect(result.score).toBeGreaterThanOrEqual(0.7);
    });
  });

  it("should return results sorted by score descending", () => {
    const results = searchWithScoring(mockComponents, "dialog", {
      limit: 10,
      minScore: 0,
    });

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("should handle pagination correctly", () => {
    const page1 = searchWithScoring(mockComponents, "a", {
      limit: 3,
      offset: 0,
      minScore: 0,
    });

    const page2 = searchWithScoring(mockComponents, "a", {
      limit: 3,
      offset: 3,
      minScore: 0,
    });

    expect(page1.length).toBeLessThanOrEqual(3);
    expect(page2.length).toBeLessThanOrEqual(3);

    // Pages should have different results
    if (page1.length > 0 && page2.length > 0) {
      expect(page1[0].component.name).not.toBe(page2[0].component.name);
    }
  });

  it("should not return unrelated components with high minScore", () => {
    const results = searchWithScoring(mockComponents, "avatar", {
      limit: 100,
      minScore: 0.8,
    });

    // Should only return Avatar-related components
    results.forEach((result) => {
      const name = result.component.name.toLowerCase();
      expect(name).toContain("avatar");
    });
  });

  it("should handle empty query", () => {
    const results = searchWithScoring(mockComponents, "", {
      limit: 10,
      minScore: 0,
    });

    // Empty query might return all or no results depending on fuzzysort behavior
    expect(results).toBeDefined();
  });

  it("should handle non-matching query with high minScore", () => {
    const results = searchWithScoring(mockComponents, "xyz123notfound", {
      limit: 10,
      minScore: 0.5,
    });

    expect(results.length).toBe(0);
  });
});

describe("searchWithPagination", () => {
  it("should return correct pagination metadata", () => {
    const result = searchWithPagination(mockComponents, "a", {
      limit: 3,
      offset: 0,
      minScore: 0,
    });

    expect(result.pagination).toBeDefined();
    expect(result.pagination.limit).toBe(3);
    expect(result.pagination.offset).toBe(0);
    expect(result.pagination.total).toBeGreaterThan(0);
    expect(typeof result.pagination.hasMore).toBe("boolean");
  });

  it("should correctly indicate hasMore", () => {
    const result = searchWithPagination(mockComponents, "a", {
      limit: 2,
      offset: 0,
      minScore: 0,
    });

    if (result.pagination.total > 2) {
      expect(result.pagination.hasMore).toBe(true);
    } else {
      expect(result.pagination.hasMore).toBe(false);
    }
  });

  it("should handle pagination beyond available results", () => {
    const result = searchWithPagination(mockComponents, "avatar", {
      limit: 10,
      offset: 100,
      minScore: 0,
    });

    expect(result.items.length).toBe(0);
    expect(result.pagination.hasMore).toBe(false);
  });
});

describe("Score normalization", () => {
  it("should produce intuitive scores where exact matches score higher", () => {
    const exactMatch = searchWithScoring(mockComponents, "AvatarRoot", {
      limit: 1,
      minScore: 0,
    });

    const partialMatch = searchWithScoring(mockComponents, "Ava", {
      limit: 1,
      minScore: 0,
    });

    const fuzzyMatch = searchWithScoring(mockComponents, "avtr", {
      limit: 1,
      minScore: 0,
    });

    console.log(`\nScore comparison:`);
    console.log(`  Exact "AvatarRoot": ${exactMatch[0]?.score.toFixed(3)}`);
    console.log(`  Partial "Ava": ${partialMatch[0]?.score.toFixed(3)}`);
    console.log(`  Fuzzy "avtr": ${fuzzyMatch[0]?.score.toFixed(3)}`);

    // Exact match should score higher than partial
    if (exactMatch.length > 0 && partialMatch.length > 0) {
      expect(exactMatch[0].score).toBeGreaterThan(partialMatch[0].score);
    }

    // Partial should score higher than fuzzy
    if (partialMatch.length > 0 && fuzzyMatch.length > 0) {
      expect(partialMatch[0].score).toBeGreaterThan(fuzzyMatch[0].score);
    }
  });
});
