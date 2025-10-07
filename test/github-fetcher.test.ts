import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchAvailableComponentNames,
  fetchComponent,
  fetchAllComponents,
  clearResourceCache,
} from "../src/fetchers/github-fetcher";
import { FALLBACK_COMPONENT_NAMES } from "../src/constants/fallback-components";

// Store original fetch
const originalFetch = global.fetch;

describe("fetchAvailableComponentNames", () => {
  beforeEach(() => {
    // Clear any mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = originalFetch;
  });

  it("should fetch component names from GitHub API successfully", async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { type: "file", name: "accordion-root.json" },
        { type: "file", name: "avatar-root.json" },
        { type: "file", name: "dialog-root.json" },
        { type: "dir", name: "some-directory" }, // Should be filtered out
        { type: "file", name: "README.md" }, // Should be filtered out
      ],
    });

    const names = await fetchAvailableComponentNames({ useCache: false });

    expect(names).toEqual(["accordion-root", "avatar-root", "dialog-root"]);
    expect(names).not.toContain("some-directory");
    expect(names).not.toContain("README");
  });

  it("should return fallback list when GitHub API fails", async () => {
    // Mock API failure
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const names = await fetchAvailableComponentNames({ useCache: false });

    // Should return fallback list
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain("avatar-root");
    expect(names).toContain("dialog-root");

    // Verify it matches the fallback constant
    expect(names).toEqual([...FALLBACK_COMPONENT_NAMES]);
  });

  it("should return fallback list when GitHub API returns 404", async () => {
    // Mock 404 response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const names = await fetchAvailableComponentNames({ useCache: false });

    // Should return fallback list
    expect(names).toEqual([...FALLBACK_COMPONENT_NAMES]);
  });

  it("should return fallback list when GitHub API returns invalid data", async () => {
    // Mock invalid response (not an array)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: "Invalid response" }),
    });

    const names = await fetchAvailableComponentNames({ useCache: false });

    // Should return fallback list
    expect(names).toEqual([...FALLBACK_COMPONENT_NAMES]);
  });

  it("should log appropriate messages for success and failure", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Test success case
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { type: "file", name: "test1.json" },
        { type: "file", name: "test2.json" },
      ],
    });

    await fetchAvailableComponentNames({ useCache: false });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Found 2 components")
    );

    consoleErrorSpy.mockClear();

    // Test failure case
    global.fetch = vi.fn().mockRejectedValue(new Error("API Error"));

    await fetchAvailableComponentNames({ useCache: false });
    expect(consoleErrorSpy).toHaveBeenCalled();
    const firstCall =
      consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1];
    expect(firstCall[0]).toContain("Failed to fetch component list");

    consoleErrorSpy.mockRestore();
  });
});

describe("fetchComponent", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should fetch a single component successfully", async () => {
    const mockComponentData = {
      name: "AvatarRoot",
      description: "Test component",
      props: {},
      dataAttributes: {},
      cssVariables: {},
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockComponentData,
    });

    const component = await fetchComponent("avatar-root", { useCache: false });

    expect(component).not.toBeNull();
    expect(component?.name).toBe("AvatarRoot");
    expect(component?.description).toBe("Test component");
  });

  it("should return null for 404 responses", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const component = await fetchComponent("non-existent-component", {
      useCache: false,
    });

    expect(component).toBeNull();
  });

  it("should throw FetchError for non-404 HTTP errors", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(
      fetchComponent("avatar-root", { useCache: false })
    ).rejects.toThrow();
  });

  it("should throw ValidationError for invalid component data", async () => {
    // Mock response with invalid data (missing required fields)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        name: "Invalid",
        // Missing required fields: props, dataAttributes, cssVariables
      }),
    });

    await expect(
      fetchComponent("avatar-root", { useCache: false })
    ).rejects.toThrow();
  });
});

describe("fetchAllComponents", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should fetch all components using dynamic component list", async () => {
    let callCount = 0;

    // Mock GitHub API to return component list
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/contents/")) {
        // Mock component list API
        return Promise.resolve({
          ok: true,
          json: async () => [
            { type: "file", name: "test-component-1.json" },
            { type: "file", name: "test-component-2.json" },
          ],
        });
      } else {
        // Mock component data API
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            name: `TestComponent${callCount}`,
            description: "Test",
            props: {},
            dataAttributes: {},
            cssVariables: {},
          }),
        });
      }
    });

    const components = await fetchAllComponents({ useCache: false });

    expect(components.size).toBeGreaterThan(0);
    // Should have fetched components dynamically
    expect(callCount).toBeGreaterThan(0);
  });

  it("should use fallback list when API fails", async () => {
    let componentFetchCount = 0;

    // Mock GitHub API failure for component list, but success for individual components
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/contents/")) {
        // Fail the component list API
        return Promise.reject(new Error("API Error"));
      } else {
        // Success for individual component fetches
        componentFetchCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            name: `Component${componentFetchCount}`,
            description: "Test",
            props: {},
            dataAttributes: {},
            cssVariables: {},
          }),
        });
      }
    });

    const components = await fetchAllComponents({ useCache: false });

    // Should have used fallback list
    expect(components.size).toBeGreaterThan(0);

    // Should have attempted to fetch from fallback list
    expect(componentFetchCount).toBeGreaterThan(0);
  });

  it("should handle partial failures gracefully", async () => {
    let callCount = 0;

    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/contents/")) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { type: "file", name: "component-1.json" },
            { type: "file", name: "component-2.json" },
            { type: "file", name: "component-3.json" },
          ],
        });
      } else {
        callCount++;
        // Fail every other component
        if (callCount % 2 === 0) {
          return Promise.resolve({
            ok: false,
            status: 404,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            name: `Component${callCount}`,
            description: "Test",
            props: {},
            dataAttributes: {},
            cssVariables: {},
          }),
        });
      }
    });

    const components = await fetchAllComponents({ useCache: false });

    // Should have some components (not all failed)
    expect(components.size).toBeGreaterThan(0);
    // Should have fewer than total (some failed)
    expect(components.size).toBeLessThan(3);
  });
});

describe("Fallback integration", () => {
  it("should ensure fallback list contains common components", () => {
    const fallbackList = [...FALLBACK_COMPONENT_NAMES];

    // Check for essential components
    expect(fallbackList).toContain("avatar-root");
    expect(fallbackList).toContain("dialog-root");
    expect(fallbackList).toContain("input");
    // Note: Not all components are in the fallback list

    // Should have a reasonable number of components
    expect(fallbackList.length).toBeGreaterThan(50);
  });

  it("should have unique component names in fallback list", () => {
    const fallbackList = [...FALLBACK_COMPONENT_NAMES];
    const uniqueList = [...new Set(fallbackList)];

    expect(fallbackList.length).toBe(uniqueList.length);
  });
});

describe("Caching behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearResourceCache(); // Clear cache before each test
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearResourceCache(); // Clean up after test
  });

  it("should cache component fetches by default", async () => {
    const mockComponent = {
      name: "TestComponent",
      description: "Test",
      props: {},
      dataAttributes: {},
      cssVariables: {},
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockComponent,
    });

    // First call - should hit network
    await fetchComponent("test", { useCache: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    await fetchComponent("test", { useCache: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should bypass cache when useCache is false", async () => {
    const mockComponent = {
      name: "TestComponent",
      description: "Test",
      props: {},
      dataAttributes: {},
      cssVariables: {},
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockComponent,
    });

    // First call with cache
    await fetchComponent("test", { useCache: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second call bypassing cache
    await fetchComponent("test", { useCache: false });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should dedupe concurrent requests", async () => {
    const mockComponent = {
      name: "TestComponent",
      description: "Test",
      props: {},
      dataAttributes: {},
      cssVariables: {},
    };

    // Simulate slow network
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockComponent,
              }),
            50
          );
        })
    );

    // Make 3 concurrent requests
    await Promise.all([
      fetchComponent("test"),
      fetchComponent("test"),
      fetchComponent("test"),
    ]);

    // Should only fetch once (deduped by cache)
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
