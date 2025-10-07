import { z } from 'zod';

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
    }),
  ),
  dataAttributes: z.record(
    z.object({
      description: z.string().optional(),
      type: z.string().optional(),
    }),
  ),
  cssVariables: z.record(
    z.object({
      description: z.string().optional(),
      type: z.string().optional(),
    }),
  ),
});

export type BaseUIComponent = z.infer<typeof BaseUIComponentSchema>;

// MCP Tool Schemas with validation
export const SearchComponentsSchema = z.object({
  query: z
    .string()
    .min(1, 'Query must not be empty')
    .describe('Search query for component name or description'),
  limit: z
    .number()
    .int()
    .positive()
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(10)
    .describe('Maximum number of results to return'),
  minScore: z.number().min(0).max(1).optional().describe('Minimum relevance score (0-1)'),
  includeProps: z.boolean().optional().describe('Include props in search'),
  includeDataAttributes: z.boolean().optional().describe('Include data attributes in search'),
});

export const GetComponentSchema = z.object({
  name: z
    .string()
    .min(1, 'Component name must not be empty')
    .describe('Exact component name to retrieve'),
});

export const ListComponentsSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50)
    .describe('Maximum number of results to return'),
});

export const FilterComponentsSchema = z.object({
  hasProps: z.array(z.string()).optional().describe('Must have these prop names'),
  hasDataAttributes: z.array(z.string()).optional().describe('Must have these data attributes'),
  hasCssVariables: z.boolean().optional().describe('Must have CSS variables'),
  minPropsCount: z.number().int().positive().optional().describe('Minimum number of props'),
});

export type SearchComponentsParams = z.infer<typeof SearchComponentsSchema>;
export type GetComponentParams = z.infer<typeof GetComponentSchema>;
export type ListComponentsParams = z.infer<typeof ListComponentsSchema>;
export type FilterComponentsParams = z.infer<typeof FilterComponentsSchema>;
