import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchAvailableComponentNames,
  fetchComponent,
  fetchAllComponents,
  clearResourceCache,
} from "@/fetchers/github-fetcher";
import { FALLBACK_COMPONENT_NAMES } from "@/constants/fallback-components";
import { NotFoundError, FetchError, ValidationError } from "@/errors/registry-error";

// Mock node-fetch module
vi.mock("node-fetch", () => ({
  default: vi.fn(),
}));

// Import the mocked fetch
import fetch from "node-fetch";
const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;

describe("fetchAvailableComponentNames", () => {
  beforeEach(() => {
    // Clear any mocks and cache before each test
    vi.clearAllMocks();
    clearResourceCache();
  });

  it("should fetch component names from GitHub API successfully", async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => [
        { type: "file", name: "accordion-root.json" },
        { type: "file", name: "avatar-root.json" },
        { type: "file", name: "dialog-root.json" },
        { type: "dir", name: "some-directory" }, // Should be filtered out
        { type: "file", name: "README.md" }, // Should be filtered out
        { type: "file", name: "use-render.json" }, // Should be filtered out (hook)
      ],
    } as any);

    const names = await fetchAvailableComponentNames({ useCache: false });

    expect(names).toEqual(["accordion-root", "avatar-root", "dialog-root"]);
    expect(names).not.toContain("some-directory");
    expect(names).not.toContain("README");
    expect(names).not.toContain("use-render"); // Hooks should be excluded
  });

  it("should return fallback list when GitHub API fails", async () => {
    // Mock API failure (network error)
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      headers: {
        get: () => "application/json",
      },
      json: async () => ({}),
    } as any);

    const names = await fetchAvailableComponentNames({ useCache: false });

    // Should return fallback list
    expect(names).toEqual([...FALLBACK_COMPONENT_NAMES]);
  });

  it("should return fallback list when GitHub API returns invalid data", async () => {
    // Mock invalid response (not an array)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ error: "Invalid response" }),
    } as any);

    const names = await fetchAvailableComponentNames({ useCache: false });

    // Should return fallback list
    expect(names).toEqual([...FALLBACK_COMPONENT_NAMES]);
  });

  it("should log appropriate messages for success and failure", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Test success case
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => [
        { type: "file", name: "test1.json" },
        { type: "file", name: "test2.json" },
      ],
    } as any);

    await fetchAvailableComponentNames({ useCache: false });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Found 2 components")
    );

    consoleErrorSpy.mockClear();

    // Test failure case
    mockFetch.mockRejectedValueOnce(new Error("API Error"));

    await fetchAvailableComponentNames({ useCache: false });
    expect(consoleErrorSpy).toHaveBeenCalled();
    const firstCall =
      consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1];
    expect(firstCall[0]).toContain("Failed to fetch component list");

    consoleErrorSpy.mockRestore();
  });

  it("should ensure fallback list contains common components", async () => {
    // Mock API failure to trigger fallback
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const names = await fetchAvailableComponentNames({ useCache: false });

    // Verify important components are in the fallback
    expect(names).toContain("avatar-root");
    expect(names).toContain("dialog-root");
    expect(names).toContain("accordion-root");
    expect(names.length).toBeGreaterThan(50); // Should have many components
  });
});

describe("fetchComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearResourceCache();
  });

  it("should fetch a single component successfully", async () => {
    const mockComponentData = {
      name: "AvatarRoot",
      description: "Test component",
      props: {},
      dataAttributes: {},
      cssVariables: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => mockComponentData,
    } as any);

    const component = await fetchComponent("avatar-root", { useCache: false });

    expect(component).not.toBeNull();
    expect(component?.name).toBe("AvatarRoot");
    expect(component?.description).toBe("Test component");
  });

  it("should return null for 404 responses", async () => {
    // Mock 404 response - will be caught by NotFoundError and return null
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      headers: {
        get: () => "application/json",
      },
      json: async () => ({}),
    } as any);

    const component = await fetchComponent("non-existent-component", {
      useCache: false,
    });

    expect(component).toBeNull();
  });

  it("should throw FetchError for non-404 HTTP errors", async () => {
    // Mock 500 response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      headers: {
        get: () => "application/json",
      },
      json: async () => ({}),
    } as any);

    await expect(
      fetchComponent("avatar-root", { useCache: false })
    ).rejects.toThrow(FetchError);
  });

  it("should throw ValidationError for invalid component data", async () => {
    // Mock response with invalid data (missing required fields)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({
        name: "Invalid",
        // Missing required fields: props, dataAttributes, cssVariables
      }),
    } as any);

    await expect(
      fetchComponent("avatar-root", { useCache: false })
    ).rejects.toThrow(ValidationError);
  });
});

describe("fetchAllComponents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearResourceCache();
  });

  it("should fetch all components using dynamic component list", async () => {
    let callCount = 0;

    // Mock GitHub API to return component list and individual components
    mockFetch.mockImplementation(((url: string) => {
      if (url.includes("/contents/")) {
        // Mock component list API
        return Promise.resolve({
          ok: true,
          headers: {
            get: () => "application/json",
          },
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
          headers: {
            get: () => "application/json",
          },
          json: async () => ({
            name: `TestComponent${callCount}`,
            description: "Test",
            props: {},
            dataAttributes: {},
            cssVariables: {},
          }),
        });
      }
    }) as any);

    const components = await fetchAllComponents({ useCache: false });

    expect(components.size).toBeGreaterThan(0);
    // Should have fetched components dynamically
    expect(callCount).toBeGreaterThan(0);
  });

  it("should use fallback list when API fails", async () => {
    let componentFetchCount = 0;

    // Mock GitHub API failure for component list, but success for individual components
    mockFetch.mockImplementation(((url: string) => {
      if (url.includes("/contents/")) {
        // Fail the component list API
        return Promise.reject(new Error("API Error"));
      } else {
        // Success for individual component fetches
        componentFetchCount++;
        return Promise.resolve({
          ok: true,
          headers: {
            get: () => "application/json",
          },
          json: async () => ({
            name: `FallbackComponent${componentFetchCount}`,
            description: "Fallback test",
            props: {},
            dataAttributes: {},
            cssVariables: {},
          }),
        });
      }
    }) as any);

    const components = await fetchAllComponents({ useCache: false });

    // Should have used fallback list
    expect(components.size).toBeGreaterThan(0);

    // Should have attempted to fetch from fallback list
    expect(componentFetchCount).toBeGreaterThan(0);
  });

  it("should handle partial failures gracefully", async () => {
    let callCount = 0;

    // Mock some component fetches to fail
    mockFetch.mockImplementation(((url: string) => {
      if (url.includes("/contents/")) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: () => "application/json",
          },
          json: async () => [
            { type: "file", name: "component-1.json" },
            { type: "file", name: "component-2.json" },
            { type: "file", name: "component-3.json" },
          ],
        });
      } else {
        callCount++;
        // Fail component-2
        if (url.includes("component-2")) {
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
            headers: {
              get: () => "application/json",
            },
            json: async () => ({}),
          });
        }
        // Success for others
        return Promise.resolve({
          ok: true,
          headers: {
            get: () => "application/json",
          },
          json: async () => ({
            name: `Component${callCount}`,
            description: "Test",
            props: {},
            dataAttributes: {},
            cssVariables: {},
          }),
        });
      }
    }) as any);

    const components = await fetchAllComponents({ useCache: false });

    // Should have some components (not all)
    expect(components.size).toBeGreaterThan(0);
    // Should have fewer than total (some failed)
    expect(components.size).toBeLessThan(3);
  });
});

describe("Caching behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearResourceCache();
  });

  afterEach(() => {
    clearResourceCache();
  });

  it("should cache component fetches by default", async () => {
    const mockData = {
      name: "Test",
      props: {},
      dataAttributes: {},
      cssVariables: {},
    };

    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => mockData,
    } as any);

    // First call - should hit the API
    await fetchComponent("test");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    await fetchComponent("test");
    expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, no additional call
  });

  it("should bypass cache when useCache is false", async () => {
    const mockData = {
      name: "Test",
      props: {},
      dataAttributes: {},
      cssVariables: {},
    };

    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => mockData,
    } as any);

    // First call with useCache: false
    await fetchComponent("test", { useCache: false });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call with useCache: false - should hit API again
    await fetchComponent("test", { useCache: false });
    expect(mockFetch).toHaveBeenCalledTimes(2); // Called twice
  });

  it("should dedupe concurrent requests", async () => {
    const mockData = {
      name: "Test",
      props: {},
      dataAttributes: {},
      cssVariables: {},
    };

    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => mockData,
    } as any);

    // Make 3 concurrent requests for the same component
    const [result1, result2, result3] = await Promise.all([
      fetchComponent("test"),
      fetchComponent("test"),
      fetchComponent("test"),
    ]);

    // All should return the same data
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);

    // Should only have made 1 actual fetch call (deduped)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
