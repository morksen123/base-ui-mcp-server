import { z } from "zod";

export const BaseUIComponentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  renders: z.string().nullable().optional(),
  props: z.record(
    z.object({
      type: z.string().optional(),
      description: z.string().optional(),
      default: z.string().optional(),
      required: z.boolean().optional(),
      detailedType: z.string().optional(),
    })
  ),
  dataAttributes: z.record(
    z.object({
      description: z.string().optional(),
      type: z.string().optional(),
    })
  ),
  cssVariables: z.record(
    z.object({
      description: z.string().optional(),
      type: z.string().optional(),
    })
  ),
});

export type BaseUIComponent = z.infer<typeof BaseUIComponentSchema>;

export const SearchComponentsSchema = z.object({
  query: z
    .string()
    .min(1, "Query must not be empty")
    .describe("Search query for component name or description"),
  limit: z
    .number()
    .int()
    .positive()
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(10)
    .describe("Maximum number of results to return"),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe("Number of items to skip for pagination"),
  minScore: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.7)
    .describe(
      "Minimum relevance score (0-1 scale where 1=perfect match, 0.7=70% match, higher=more restrictive)"
    ),
  includeProps: z.boolean().optional().describe("Include props in search"),
  includeDataAttributes: z
    .boolean()
    .optional()
    .describe("Include data attributes in search"),
});

export const GetComponentExamplesSchema = z.object({
  name: z
    .string()
    .min(1, "Component name must not be empty")
    .describe("Component name to get examples for"),
  variant: z
    .enum(["css-modules", "tailwind"])
    .optional()
    .describe("Styling variant to filter examples (css-modules or tailwind)"),
});

export const GetInstallationGuideSchema = z.object({
  componentNames: z
    .array(z.string())
    .min(1, "At least one component name is required")
    .describe("Array of component names to get installation guide for"),
});

export const GetSetupChecklistSchema = z.object({});

export type SearchComponentsParams = z.infer<typeof SearchComponentsSchema>;
export type GetComponentExamplesParams = z.infer<
  typeof GetComponentExamplesSchema
>;
export type GetInstallationGuideParams = z.infer<
  typeof GetInstallationGuideSchema
>;
export type GetSetupChecklistParams = z.infer<typeof GetSetupChecklistSchema>;
