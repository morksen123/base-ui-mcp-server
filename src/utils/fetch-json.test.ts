import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchJson, getGitHubHeaders } from "./fetch-json";
import {
  FetchError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@/errors/registry-error";
import { resetConfig, updateConfig } from "@/config";

// Mock node-fetch
vi.mock("node-fetch", () => ({
  default: vi.fn(),
}));

import fetch from "node-fetch";
const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;

describe("fetch-json", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConfig();
  });

  describe("fetchJson", () => {
    it("should fetch and parse JSON successfully", async () => {
      const mockData = { name: "test", value: 123 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "application/json",
        },
        json: async () => mockData,
      } as any);

      const result = await fetchJson("https://api.example.com/test");

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/json",
          }),
        })
      );
    });

    it("should include custom headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "application/json",
        },
        json: async () => ({}),
      } as any);

      await fetchJson("https://api.example.com/test", {
        headers: {
          Authorization: "Bearer token123",
          "X-Custom": "value",
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/json",
            Authorization: "Bearer token123",
            "X-Custom": "value",
          }),
        })
      );
    });

    it("should throw UnauthorizedError on 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: {
          get: () => "application/json",
        },
        json: async () => ({ message: "Invalid credentials" }),
      } as any);

      try {
        await fetchJson("https://api.example.com/test");
        // Should not reach here
        expect.fail("Should have thrown UnauthorizedError");
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedError);
        if (error instanceof UnauthorizedError) {
          expect(error.message).toContain("Unauthorized");
        }
      }
    });

    it("should throw ForbiddenError on 403", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        headers: {
          get: () => "application/json",
        },
        json: async () => ({ message: "Access denied" }),
      } as any);

      await expect(
        fetchJson("https://api.example.com/test")
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw NotFoundError on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: {
          get: () => "application/json",
        },
        json: async () => ({ message: "Resource not found" }),
      } as any);

      await expect(
        fetchJson("https://api.example.com/test")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw FetchError on 500", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          get: () => "application/json",
        },
        json: async () => ({ message: "Server error" }),
      } as any);

      await expect(
        fetchJson("https://api.example.com/test")
      ).rejects.toThrow(FetchError);
    });

    it("should parse RFC 7807 error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: {
          get: () => "application/json",
        },
        json: async () => ({
          detail: "Validation failed",
          title: "Bad Request",
          error: "VALIDATION_ERROR",
        }),
      } as any);

      try {
        await fetchJson("https://api.example.com/test");
      } catch (error) {
        expect(error).toBeInstanceOf(FetchError);
        if (error instanceof FetchError) {
          // Should include RFC 7807 detail
          expect(error.message).toContain("[VALIDATION_ERROR]");
        }
      }
    });

    it("should handle non-JSON error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          get: () => "text/html",
        },
        json: async () => {
          throw new Error("Not JSON");
        },
      } as any);

      await expect(
        fetchJson("https://api.example.com/test")
      ).rejects.toThrow(FetchError);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

      try {
        await fetchJson("https://api.example.com/test");
        expect.fail("Should have thrown FetchError");
      } catch (error) {
        expect(error).toBeInstanceOf(FetchError);
        if (error instanceof FetchError) {
          expect(error.message).toContain("Network timeout");
        }
      }
    });

    it("should use custom error handler when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        headers: {
          get: () => "application/json",
        },
        json: async () => ({ message: "Rate limit exceeded" }),
      } as any);

      const customError = new Error("Custom rate limit error");
      const onError = vi.fn(() => customError);

      await expect(
        fetchJson("https://api.example.com/test", { onError })
      ).rejects.toThrow(customError);

      expect(onError).toHaveBeenCalledWith(429, "Rate limit exceeded");
    });

    it("should handle proxy agent from config", async () => {
      // Set proxy in config
      updateConfig({
        fetcher: {
          proxy: "http://proxy.example.com:8080",
        } as any,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "application/json",
        },
        json: async () => ({}),
      } as any);

      await fetchJson("https://api.example.com/test");

      // Verify fetch was called (proxy agent is internal)
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe("getGitHubHeaders", () => {
    it("should return default GitHub headers", () => {
      const headers = getGitHubHeaders();

      expect(headers).toEqual({
        Accept: "application/vnd.github.v3+json",
      });
    });

    it("should include GitHub token from config", () => {
      // Set token in config
      updateConfig({
        github: {
          token: "ghp_test_token_123",
        } as any,
      });

      const headers = getGitHubHeaders();

      expect(headers).toEqual({
        Accept: "application/vnd.github.v3+json",
        Authorization: "Bearer ghp_test_token_123",
      });
    });

    it("should not include Authorization header if no token", () => {
      // Ensure no token
      resetConfig();

      const headers = getGitHubHeaders();

      expect(headers.Authorization).toBeUndefined();
      expect(headers.Accept).toBe("application/vnd.github.v3+json");
    });
  });

  describe("Error Message Parsing", () => {
    it("should extract detail from RFC 7807 response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: () => "application/json",
        },
        json: async () => ({
          detail: "The request body is invalid",
          title: "Bad Request",
        }),
      } as any);

      try {
        await fetchJson("https://api.example.com/test");
      } catch (error) {
        if (error instanceof FetchError) {
          expect(error.message).toContain("The request body is invalid");
        }
      }
    });

    it("should extract message field as fallback", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: () => "application/json",
        },
        json: async () => ({
          message: "Invalid input",
        }),
      } as any);

      try {
        await fetchJson("https://api.example.com/test");
      } catch (error) {
        if (error instanceof FetchError) {
          expect(error.message).toContain("Invalid input");
        }
      }
    });

    it("should prefix with error field if present", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: () => "application/json",
        },
        json: async () => ({
          error: "VALIDATION_ERROR",
          message: "Field is required",
        }),
      } as any);

      try {
        await fetchJson("https://api.example.com/test");
      } catch (error) {
        if (error instanceof FetchError) {
          expect(error.message).toContain("[VALIDATION_ERROR]");
          expect(error.message).toContain("Field is required");
        }
      }
    });
  });
});

