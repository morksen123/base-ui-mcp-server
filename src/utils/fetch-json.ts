import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { z } from "zod";
import {
  FetchError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@/errors/registry-error";
import { getConfig } from "@/config";

function getProxyAgent() {
  const config = getConfig();
  return config.fetcher.proxy
    ? new HttpsProxyAgent(config.fetcher.proxy)
    : undefined;
}

export interface FetchJsonOptions {
  headers?: Record<string, string>;
  onError?: (status: number, messageFromServer: string) => Error;
}

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
      agent: getProxyAgent(),
    });

    if (!response.ok) {
      let messageFromServer: string | undefined = undefined;

      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const json = await response.json();

          const errorSchema = z.object({
            detail: z.string().optional(),
            title: z.string().optional(),
            message: z.string().optional(),
            error: z.string().optional(),
          });

          const parsed = errorSchema.safeParse(json);

          if (parsed.success) {
            messageFromServer = parsed.data.detail || parsed.data.message;

            if (parsed.data.error) {
              messageFromServer = `[${parsed.data.error}] ${
                messageFromServer || ""
              }`;
            }
          }
        }
      } catch {
        // Ignore parse errors
      }

      if (options?.onError) {
        throw options.onError(
          response.status,
          messageFromServer || response.statusText
        );
      }

      if (response.status === 401) {
        throw new UnauthorizedError(url, messageFromServer);
      }

      if (response.status === 404) {
        throw new NotFoundError(url, messageFromServer);
      }

      if (response.status === 403) {
        throw new ForbiddenError(url, messageFromServer);
      }

      throw new FetchError(url, response.status, messageFromServer);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError ||
      error instanceof FetchError
    ) {
      throw error;
    }

    if (options?.onError && error instanceof Error) {
      throw error;
    }

    throw new FetchError(
      url,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function fetchText(
  url: string,
  options?: { headers?: Record<string, string> }
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        ...options?.headers,
      },
      agent: getProxyAgent(),
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch text from ${url}:`, error);
    return null;
  }
}

export function getGitHubHeaders(): Record<string, string> {
  const config = getConfig();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  if (config.github.token) {
    headers.Authorization = `Bearer ${config.github.token}`;
  }

  return headers;
}
