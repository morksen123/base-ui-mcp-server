export const DEFAULT_CONFIG = {
  github: {
    apiBase: "https://api.github.com/repos/mui/base-ui",
    rawBase:
      "https://raw.githubusercontent.com/mui/base-ui/master/docs/reference/generated",
    referencePath: "docs/reference/generated",
    token: process.env.GITHUB_TOKEN,
  },

  cache: {
    enabled: true,
    ttl: undefined,
  },

  fetcher: {
    proxy: process.env.https_proxy || process.env.HTTPS_PROXY,
    timeout: 30000,
    retries: 0,
  },

  server: {
    name: "base-ui",
    version: "1.0.0",
  },
} as const;

export type Config = typeof DEFAULT_CONFIG;
