import { DEFAULT_CONFIG } from "./defaults";
import { ConfigSchema, type Config } from "./schema";

/**
 * Get and validate configuration
 * Inspired by shadcn's get-config pattern
 *
 * Loads configuration from:
 * 1. Default values
 * 2. Environment variables
 *
 * Future: Could be extended to load from config file
 */

let cachedConfig: Config | null = null;

/**
 * Get the current configuration
 * Uses cached config after first load
 */
export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Start with defaults
  const config = {
    ...DEFAULT_CONFIG,
    github: {
      ...DEFAULT_CONFIG.github,
      // Override with environment variables if present
      token: process.env.GITHUB_TOKEN || DEFAULT_CONFIG.github.token,
    },
    fetcher: {
      ...DEFAULT_CONFIG.fetcher,
      proxy:
        process.env.https_proxy ||
        process.env.HTTPS_PROXY ||
        DEFAULT_CONFIG.fetcher.proxy,
    },
  };

  // Validate configuration
  const result = ConfigSchema.safeParse(config);

  if (!result.success) {
    console.error("Invalid configuration:", result.error.flatten());
    throw new Error(`Configuration validation failed: ${result.error.message}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

/**
 * Reset cached configuration
 * Useful for testing or dynamic config updates
 */
export function resetConfig(): void {
  cachedConfig = null;
}

/**
 * Update configuration at runtime
 * Note: This does not persist to disk
 */
export function updateConfig(partial: Partial<Config>): Config {
  const current = getConfig();
  const updated = {
    ...current,
    ...partial,
    github: {
      ...current.github,
      ...(partial.github || {}),
    },
    cache: {
      ...current.cache,
      ...(partial.cache || {}),
    },
    fetcher: {
      ...current.fetcher,
      ...(partial.fetcher || {}),
    },
    server: {
      ...current.server,
      ...(partial.server || {}),
    },
  };

  // Validate updated config
  const result = ConfigSchema.safeParse(updated);

  if (!result.success) {
    throw new Error(`Configuration validation failed: ${result.error.message}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

// Export types and schema
export type { Config } from "./schema";
export { ConfigSchema } from "./schema";
export { DEFAULT_CONFIG } from "./defaults";
