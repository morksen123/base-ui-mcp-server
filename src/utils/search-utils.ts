import { BaseUIComponent } from '../types.js';

/**
 * Calculate similarity score between two strings (0-1)
 * Uses a simple case-insensitive substring matching algorithm
 */
function calculateSimilarity(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match
  if (lowerText === lowerQuery) {
    return 1.0;
  }

  // Starts with query
  if (lowerText.startsWith(lowerQuery)) {
    return 0.9;
  }

  // Contains query as whole word
  const words = lowerText.split(/\s+/);
  if (words.some((word) => word === lowerQuery)) {
    return 0.8;
  }

  // Contains query
  if (lowerText.includes(lowerQuery)) {
    return 0.7;
  }

  // Word starts with query
  if (words.some((word) => word.startsWith(lowerQuery))) {
    return 0.6;
  }

  // Fuzzy match: count matching characters in order
  let matchCount = 0;
  let textIndex = 0;
  for (const char of lowerQuery) {
    const foundIndex = lowerText.indexOf(char, textIndex);
    if (foundIndex !== -1) {
      matchCount += 1;
      textIndex = foundIndex + 1;
    }
  }

  const fuzzyScore = matchCount / lowerQuery.length;
  return fuzzyScore * 0.5; // Weight fuzzy matches lower
}

export interface SearchResult {
  component: BaseUIComponent;
  score: number;
  matches: {
    name: number;
    description: number;
    props: number;
    dataAttributes: number;
  };
}

/**
 * Advanced search with relevance scoring
 */
export function searchWithScoring(
  components: Map<string, BaseUIComponent>,
  query: string,
  options: {
    limit?: number;
    minScore?: number;
    includeProps?: boolean;
    includeDataAttributes?: boolean;
  } = {},
): SearchResult[] {
  const { limit = 10, minScore = 0.3, includeProps = true, includeDataAttributes = true } = options;

  const results: SearchResult[] = [];

  for (const component of components.values()) {
    const matches = {
      name: calculateSimilarity(component.name, query),
      description: component.description ? calculateSimilarity(component.description, query) : 0,
      props: 0,
      dataAttributes: 0,
    };

    // Search in props if enabled
    if (includeProps) {
      const propNames = Object.keys(component.props);
      const propDescriptions = Object.values(component.props)
        .map((p) => p.description || '')
        .join(' ');

      matches.props = Math.max(
        ...propNames.map((name) => calculateSimilarity(name, query)),
        calculateSimilarity(propDescriptions, query),
      );
    }

    // Search in data attributes if enabled
    if (includeDataAttributes) {
      const attrNames = Object.keys(component.dataAttributes);
      const attrDescriptions = Object.values(component.dataAttributes)
        .map((a) => a.description || '')
        .join(' ');

      matches.dataAttributes = Math.max(
        ...attrNames.map((name) => calculateSimilarity(name, query)),
        calculateSimilarity(attrDescriptions, query),
      );
    }

    // Calculate overall score (weighted)
    const score =
      matches.name * 0.5 + // Name is most important
      matches.description * 0.3 + // Description is second
      matches.props * 0.15 + // Props are helpful
      matches.dataAttributes * 0.05; // Data attributes are least important

    if (score >= minScore) {
      results.push({ component, score, matches });
    }
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Filter components by various criteria
 */
export function filterComponents(
  components: Map<string, BaseUIComponent>,
  filters: {
    hasProps?: string[]; // Must have these prop names
    hasDataAttributes?: string[]; // Must have these data attributes
    hasCssVariables?: boolean; // Must have CSS variables
    minPropsCount?: number; // Minimum number of props
  },
): BaseUIComponent[] {
  const results: BaseUIComponent[] = [];

  for (const component of components.values()) {
    let matches = true;

    // Check required props
    if (filters.hasProps) {
      const propNames = Object.keys(component.props).map((p) => p.toLowerCase());
      matches = matches && filters.hasProps.every((prop) => propNames.includes(prop.toLowerCase()));
    }

    // Check required data attributes
    if (filters.hasDataAttributes) {
      const attrNames = Object.keys(component.dataAttributes).map((a) => a.toLowerCase());
      matches =
        matches &&
        filters.hasDataAttributes.every((attr) => attrNames.includes(attr.toLowerCase()));
    }

    // Check for CSS variables
    if (filters.hasCssVariables !== undefined) {
      const hasCss = Object.keys(component.cssVariables).length > 0;
      matches = matches && hasCss === filters.hasCssVariables;
    }

    // Check minimum props count
    if (filters.minPropsCount !== undefined) {
      matches = matches && Object.keys(component.props).length >= filters.minPropsCount;
    }

    if (matches) {
      results.push(component);
    }
  }

  return results;
}

/**
 * Group components by pattern (e.g., "Dialog" groups DialogRoot, DialogTrigger, etc.)
 */
export function groupComponentsByFamily(
  components: Map<string, BaseUIComponent>,
): Map<string, BaseUIComponent[]> {
  const families = new Map<string, BaseUIComponent[]>();

  for (const component of components.values()) {
    // Extract family name (e.g., "Dialog" from "DialogRoot")
    const match = component.name.match(/^([A-Z][a-z]+)/);
    const familyName = match ? match[1] : 'Other';

    if (!families.has(familyName)) {
      families.set(familyName, []);
    }

    families.get(familyName)!.push(component);
  }

  return families;
}

/**
 * Get component suggestions based on partial input
 */
export function getSuggestions(
  components: Map<string, BaseUIComponent>,
  partialInput: string,
  limit: number = 5,
): string[] {
  const lowerInput = partialInput.toLowerCase();
  const suggestions: string[] = [];

  for (const component of components.values()) {
    if (component.name.toLowerCase().startsWith(lowerInput)) {
      suggestions.push(component.name);
    }

    if (suggestions.length >= limit) {
      break;
    }
  }

  return suggestions;
}
