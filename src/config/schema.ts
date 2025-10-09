import { z } from "zod";

export const ConfigSchema = z.object({
  github: z.object({
    apiBase: z.string().url(),
    rawBase: z.string().url(),
    referencePath: z.string(),
    examplesPath: z.string(),
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
