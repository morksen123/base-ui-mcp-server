import { z } from "zod";

// Base UI Component Definition Schema
export const BaseUIComponentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
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

// MCP Tool Schemas with validation
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
    .optional()
    .default(-10000)
    .describe("Minimum relevance score (fuzzysort threshold, lower = more permissive)"),
  includeProps: z.boolean().optional().describe("Include props in search"),
  includeDataAttributes: z
    .boolean()
    .optional()
    .describe("Include data attributes in search"),
});

export const GetComponentSchema = z.object({
  name: z
    .string()
    .min(1, "Component name must not be empty")
    .describe("Exact component name to retrieve"),
});

export const ListComponentsSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(50)
    .describe("Maximum number of results to return"),
});

export const FilterComponentsSchema = z.object({
  hasProps: z
    .array(z.string())
    .optional()
    .describe("Must have these prop names"),
  hasDataAttributes: z
    .array(z.string())
    .optional()
    .describe("Must have these data attributes"),
  hasCssVariables: z.boolean().optional().describe("Must have CSS variables"),
  minPropsCount: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Minimum number of props"),
});

// New schemas for examples tools
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

export const GetSpecificDemoSchema = z.object({
  componentName: z
    .string()
    .min(1, "Component name must not be empty")
    .describe("Component name"),
  demoName: z
    .string()
    .min(1, "Demo name must not be empty")
    .describe("Name of the specific demo to retrieve"),
  variant: z
    .enum(["css-modules", "tailwind"])
    .optional()
    .default("css-modules")
    .describe("Styling variant (css-modules or tailwind)"),
});

// New schemas for installation tools
export const GetInstallationGuideSchema = z.object({
  componentNames: z
    .array(z.string())
    .min(1, "At least one component name is required")
    .describe("Array of component names to get installation guide for"),
});

export const GetComponentDependenciesSchema = z.object({
  name: z
    .string()
    .min(1, "Component name must not be empty")
    .describe("Component name to get dependencies for"),
});

export const GetSetupChecklistSchema = z.object({
  // No parameters needed for this tool
});

export type SearchComponentsParams = z.infer<typeof SearchComponentsSchema>;
export type GetComponentParams = z.infer<typeof GetComponentSchema>;
export type ListComponentsParams = z.infer<typeof ListComponentsSchema>;
export type FilterComponentsParams = z.infer<typeof FilterComponentsSchema>;
export type GetComponentExamplesParams = z.infer<
  typeof GetComponentExamplesSchema
>;
export type GetSpecificDemoParams = z.infer<typeof GetSpecificDemoSchema>;
export type GetInstallationGuideParams = z.infer<
  typeof GetInstallationGuideSchema
>;
export type GetComponentDependenciesParams = z.infer<
  typeof GetComponentDependenciesSchema
>;
export type GetSetupChecklistParams = z.infer<typeof GetSetupChecklistSchema>;
