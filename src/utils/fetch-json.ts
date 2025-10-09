import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { z } from "zod";
import {
  FetchError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@/errors/registry-error";

/**
 * Unified HTTP client for fetching JSON resources
 * Inspired by shadcn's registry fetcher pattern
 *
 * Features:
 * - Uses node-fetch for proxy support (native fetch doesn't support agents)
 * - Proxy support via https_proxy env var
 * - Custom headers per request
 * - RFC 7807-compatible error messages with zod validation
 * - Status code mapping to specific error classes (401, 403, 404)
 */

// Create proxy agent if https_proxy is set
const httpsAgent = process.env.https_proxy
  ? new HttpsProxyAgent(process.env.https_proxy)
  : undefined;

export interface FetchJsonOptions {
  /**
   * Additional headers to include in the request
   */
  headers?: Record<string, string>;

  /**
   * Custom error handler for non-OK responses
   * @param status - HTTP status code
   * @param messageFromServer - Parsed error message from server (RFC 7807 or standard format)
   * @returns Error to throw (can return any of our custom error types)
   */
  onError?: (status: number, messageFromServer: string) => Error;
}

/**
 * Fetch and parse JSON from a URL
 *
 * @param url - The URL to fetch
 * @param options - Optional headers and error handler
 * @returns Parsed JSON response
 * @throws FetchError for HTTP errors or network issues
 */
export async function fetchJson<T = any>(
  url: string,
  options?: FetchJsonOptions
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
      // @ts-ignore - node-fetch types don't match perfectly
      agent: httpsAgent,
    });

    if (!response.ok) {
      // Try to parse error body for better error messages (RFC 7807)
      // Using zod for safe parsing, inspired by shadcn
      let messageFromServer: string | undefined = undefined;

      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const json = await response.json();

          // Validate error response structure using zod (RFC 7807 + standard errors)
          const errorSchema = z.object({
            // RFC 7807 Problem Details for HTTP APIs
            detail: z.string().optional(),
            title: z.string().optional(),
            // Standard error response fields
            message: z.string().optional(),
            error: z.string().optional(),
          });

          const parsed = errorSchema.safeParse(json);

          if (parsed.success) {
            // Prefer RFC 7807 detail field, then message field
            messageFromServer = parsed.data.detail || parsed.data.message;

            // If there's an error field, prepend it
            if (parsed.data.error) {
              messageFromServer = `[${parsed.data.error}] ${
                messageFromServer || ""
              }`;
            }
          }
        }
      } catch {
        // Ignore JSON parse errors, continue with undefined messageFromServer
      }

      // Allow custom error handler to override default behavior
      if (options?.onError) {
        throw options.onError(
          response.status,
          messageFromServer || response.statusText
        );
      }

      // Map status codes to specific error classes (like shadcn)
      if (response.status === 401) {
        throw new UnauthorizedError(url, messageFromServer);
      }

      if (response.status === 404) {
        throw new NotFoundError(url, messageFromServer);
      }

      if (response.status === 403) {
        throw new ForbiddenError(url, messageFromServer);
      }

      // Generic fetch error for other status codes
      throw new FetchError(url, response.status, messageFromServer);
    }

    return (await response.json()) as T;
  } catch (error) {
    // Re-throw our custom errors as-is
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError ||
      error instanceof FetchError
    ) {
      throw error;
    }

    // Wrap network errors and other failures in generic FetchError
    throw new FetchError(
      url,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Helper to get default GitHub API headers
 */
export function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  // Add GitHub token if available for higher rate limits
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}
