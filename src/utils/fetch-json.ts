import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { FetchError } from "@/errors/registry-error";

/**
 * Unified HTTP client for fetching JSON resources
 * Inspired by shadcn's registry fetcher pattern
 * 
 * Features:
 * - Proxy support via https_proxy env var
 * - Custom headers per request
 * - RFC 7807-compatible error messages
 * - Status code mapping to custom errors
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
   */
  onError?: (status: number, statusText: string, body?: any) => Error;
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
      let errorMessage = response.statusText;
      let errorBody: any;

      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          errorBody = await response.json();
          
          // RFC 7807 Problem Details for HTTP APIs
          // Common fields: detail, title, message, error
          errorMessage =
            errorBody?.detail ||
            errorBody?.title ||
            errorBody?.message ||
            (errorBody?.error
              ? `[${errorBody.error}] ${errorBody?.message ?? ""}`
              : errorMessage);
        }
      } catch {
        // Ignore JSON parse errors, use statusText
      }

      // Allow custom error handler
      if (options?.onError) {
        throw options.onError(response.status, errorMessage, errorBody);
      }

      // Default error mapping
      throw new FetchError(
        url,
        new Error(`HTTP ${response.status}: ${errorMessage}`)
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    // Re-throw FetchError as-is
    if (error instanceof FetchError) {
      throw error;
    }

    // Wrap network errors and other failures
    throw new FetchError(
      url,
      error instanceof Error ? error : new Error(String(error))
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

