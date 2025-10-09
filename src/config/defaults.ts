/**
 * Default configuration values for Base UI MCP Server
 * Inspired by shadcn's configuration pattern
 */

export const DEFAULT_CONFIG = {
  /**
   * GitHub API configuration
   */
  github: {
    apiBase: "https://api.github.com/repos/mui/base-ui",
    rawBase:
      "https://raw.githubusercontent.com/mui/base-ui/master/docs/reference/generated",
    referencePath: "docs/reference/generated",
    // GitHub token for higher rate limits (optional)
    token: process.env.GITHUB_TOKEN,
  },

  /**
   * Cache configuration
   */
  cache: {
    enabled: true,
    // No TTL by default - cache persists for process lifetime
    ttl: undefined,
  },

  /**
   * Fetcher configuration
   */
  fetcher: {
    // Proxy configuration (falls back to https_proxy env var)
    proxy: process.env.https_proxy || process.env.HTTPS_PROXY,
    // Request timeout in milliseconds
    timeout: 30000,
    // Number of retries for failed requests
    retries: 0, // No retries by default
  },

  /**
   * MCP Server configuration
   */
  server: {
    name: "base-ui",
    version: "1.0.0",
  },
} as const;

export type Config = typeof DEFAULT_CONFIG;
