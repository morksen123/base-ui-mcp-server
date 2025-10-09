import { DEFAULT_CONFIG } from "./defaults";
import { ConfigSchema, type Config } from "./schema";

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config = {
    ...DEFAULT_CONFIG,
    github: {
      ...DEFAULT_CONFIG.github,
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

  const result = ConfigSchema.safeParse(config);

  if (!result.success) {
    console.error("Invalid configuration:", result.error.flatten());
    throw new Error(`Configuration validation failed: ${result.error.message}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}

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

  const result = ConfigSchema.safeParse(updated);

  if (!result.success) {
    throw new Error(`Configuration validation failed: ${result.error.message}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export type { Config } from "./schema";
export { ConfigSchema } from "./schema";
export { DEFAULT_CONFIG } from "./defaults";
