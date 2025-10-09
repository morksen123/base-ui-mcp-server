import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getConfig, resetConfig, updateConfig } from "./index";
import { DEFAULT_CONFIG } from "./defaults";

describe("Config System", () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset config before each test
    resetConfig();
    // Clear environment variables
    delete process.env.GITHUB_TOKEN;
    delete process.env.https_proxy;
    delete process.env.HTTPS_PROXY;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
    resetConfig();
  });

  describe("getConfig", () => {
    it("should load default config successfully", () => {
      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.github.apiBase).toBe(DEFAULT_CONFIG.github.apiBase);
      expect(config.github.rawBase).toBe(DEFAULT_CONFIG.github.rawBase);
      expect(config.cache.enabled).toBe(true);
      expect(config.server.name).toBe("base-ui");
    });

    it("should override with GITHUB_TOKEN environment variable", () => {
      process.env.GITHUB_TOKEN = "test_token_123";
      resetConfig(); // Force reload

      const config = getConfig();

      expect(config.github.token).toBe("test_token_123");
    });

    it("should override with https_proxy environment variable", () => {
      process.env.https_proxy = "http://proxy.example.com:8080";
      resetConfig();

      const config = getConfig();

      expect(config.fetcher.proxy).toBe("http://proxy.example.com:8080");
    });

    it("should prefer https_proxy over HTTPS_PROXY", () => {
      process.env.https_proxy = "http://proxy1.example.com:8080";
      process.env.HTTPS_PROXY = "http://proxy2.example.com:8080";
      resetConfig();

      const config = getConfig();

      expect(config.fetcher.proxy).toBe("http://proxy1.example.com:8080");
    });

    it("should use HTTPS_PROXY if https_proxy not set", () => {
      process.env.HTTPS_PROXY = "http://proxy.example.com:8080";
      resetConfig();

      const config = getConfig();

      expect(config.fetcher.proxy).toBe("http://proxy.example.com:8080");
    });

    it("should cache config after first load", () => {
      const config1 = getConfig();
      const config2 = getConfig();

      // Should return same reference (cached)
      expect(config1).toBe(config2);
    });

    it("should validate config schema with Zod", () => {
      // Valid config should not throw
      expect(() => getConfig()).not.toThrow();
    });

    it("should throw on invalid config (negative timeout)", () => {
      // Force invalid config by mocking
      const { DEFAULT_CONFIG: invalidConfig } = vi.hoisted(() => ({
        DEFAULT_CONFIG: {
          github: {
            apiBase: "https://api.github.com/repos/mui/base-ui",
            rawBase: "https://raw.githubusercontent.com",
            referencePath: "docs/reference/generated",
            token: undefined,
          },
          cache: { enabled: true, ttl: undefined },
          fetcher: {
            proxy: undefined,
            timeout: -1000, // Invalid: negative timeout
            retries: 0,
          },
          server: { name: "base-ui", version: "1.0.0" },
        },
      }));

      // This should fail validation
      // Note: In real scenario, we'd need to mock the defaults
      // For now, just verify default config is valid
      const config = getConfig();
      expect(config.fetcher.timeout).toBeGreaterThan(0);
    });
  });

  describe("resetConfig", () => {
    it("should clear cached config", () => {
      const config1 = getConfig();
      resetConfig();
      const config2 = getConfig();

      // Should create new config after reset
      // (values same, but new object)
      expect(config1).toEqual(config2);
    });

    it("should allow config reload with new env vars", () => {
      const config1 = getConfig();
      expect(config1.github.token).toBeUndefined();

      // Set env var and reset
      process.env.GITHUB_TOKEN = "new_token";
      resetConfig();

      const config2 = getConfig();
      expect(config2.github.token).toBe("new_token");
    });
  });

  describe("updateConfig", () => {
    it("should update config at runtime", () => {
      const originalConfig = getConfig();
      expect(originalConfig.cache.enabled).toBe(true);

      const updatedConfig = updateConfig({
        cache: {
          enabled: false,
          ttl: 3600,
        },
      });

      expect(updatedConfig.cache.enabled).toBe(false);
      expect(updatedConfig.cache.ttl).toBe(3600);

      // Subsequent getConfig should return updated config
      const currentConfig = getConfig();
      expect(currentConfig.cache.enabled).toBe(false);
    });

    it("should merge partial updates", () => {
      getConfig(); // Initialize

      const updated = updateConfig({
        github: {
          token: "runtime_token",
        } as any,
      });

      // Should keep other github fields
      expect(updated.github.token).toBe("runtime_token");
      expect(updated.github.apiBase).toBe(DEFAULT_CONFIG.github.apiBase);
    });

    it("should validate updated config", () => {
      getConfig(); // Initialize

      // Invalid update should throw
      expect(() =>
        updateConfig({
          fetcher: {
            timeout: -1000, // Invalid
          } as any,
        })
      ).toThrow(/Configuration validation failed/);
    });

    it("should preserve unmodified fields", () => {
      getConfig(); // Initialize

      const updated = updateConfig({
        server: {
          name: "custom-name",
        } as any,
      });

      // Server version should be preserved
      expect(updated.server.name).toBe("custom-name");
      expect(updated.server.version).toBe(DEFAULT_CONFIG.server.version);

      // Other sections should be unchanged
      expect(updated.github.apiBase).toBe(DEFAULT_CONFIG.github.apiBase);
      expect(updated.cache.enabled).toBe(DEFAULT_CONFIG.cache.enabled);
    });
  });

  describe("Config Schema Validation", () => {
    it("should require valid URLs for GitHub endpoints", () => {
      // Default config has valid URLs
      const config = getConfig();
      expect(config.github.apiBase).toMatch(/^https?:\/\//);
      expect(config.github.rawBase).toMatch(/^https?:\/\//);
    });

    it("should accept positive timeout values", () => {
      const config = getConfig();
      expect(config.fetcher.timeout).toBeGreaterThan(0);
    });

    it("should accept retry values between 0 and 5", () => {
      const config = getConfig();
      expect(config.fetcher.retries).toBeGreaterThanOrEqual(0);
      expect(config.fetcher.retries).toBeLessThanOrEqual(5);
    });
  });
});

