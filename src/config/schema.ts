import { z } from "zod";

/**
 * Configuration schema for Base UI MCP Server
 * Uses Zod for runtime validation, inspired by shadcn
 */

export const ConfigSchema = z.object({
  github: z.object({
    apiBase: z.string().url(),
    rawBase: z.string().url(),
    referencePath: z.string(),
    token: z.string().optional(),
  }),

  cache: z.object({
    enabled: z.boolean(),
    ttl: z.number().positive().optional(),
  }),

  fetcher: z.object({
    proxy: z.string().optional(),
    timeout: z.number().positive(),
    retries: z.number().min(0).max(5),
  }),

  server: z.object({
    name: z.string(),
    version: z.string(),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

