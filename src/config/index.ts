import { ConfigSchema, type Config } from "./schema";
import {
  GITHUB_CONFIG,
  SERVER_CONFIG,
  FETCHER_CONFIG,
  CACHE_CONFIG,
} from "@/constants";

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config = {
    github: {
      ...GITHUB_CONFIG,
      token: process.env.GITHUB_TOKEN || undefined,
    },
    cache: CACHE_CONFIG,
    fetcher: {
      ...FETCHER_CONFIG,
      proxy: process.env.https_proxy || undefined,
    },
    server: SERVER_CONFIG,
  };

  const result = ConfigSchema.safeParse(config);

  if (!result.success) {
    console.error("Invalid configuration:", result.error.flatten());
    throw new Error(`Configuration validation failed: ${result.error.message}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function resetConfig() {
  cachedConfig = null;
}

export function updateConfig(partial: Partial<Config>) {
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
