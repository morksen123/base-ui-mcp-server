import { BaseUIComponent } from "@/types";
import fuzzysort from "fuzzysort";

export interface SearchResult {
  component: BaseUIComponent;
  score: number;
}

export interface PaginatedSearchResults {
  items: BaseUIComponent[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

/**
 * Fuzzysort already returns scores in 0-1 range where 1 is best match
 * This function just ensures the score is clamped to valid range
 *
 * @param fuzzysortScore - The score from fuzzysort (0 to 1, where 1 is perfect)
 * @returns Score clamped to 0-1 range
 */
function normalizeScore(fuzzysortScore: number): number {
  // Fuzzysort already returns 0-1 scores where 1 is perfect match
  // Just clamp to ensure valid range
  return Math.max(0, Math.min(1, fuzzysortScore));
}

/**
 * Advanced search with fuzzysort for better fuzzy matching
 * Now uses normalized scores (0-1) where higher = better match
 */
export function searchWithScoring(
  components: Map<string, BaseUIComponent>,
  query: string,
  options: {
    limit?: number;
    offset?: number;
    minScore?: number;
    includeProps?: boolean;
    includeDataAttributes?: boolean;
  } = {}
): SearchResult[] {
  const {
    limit = 10,
    offset = 0,
    minScore = 0.7, // Now using normalized 0-1 scale (0.7 = 70% match)
    includeProps = true,
    includeDataAttributes = true,
  } = options;

  // Prepare search targets
  const searchTargets = Array.from(components.values()).map((component) => {
    const propNames = includeProps
      ? Object.keys(component.props).join(" ")
      : "";
    const attrNames = includeDataAttributes
      ? Object.keys(component.dataAttributes).join(" ")
      : "";

    return {
      component,
      name: component.name,
      description: component.description || "",
      searchableText: `${component.name} ${
        component.description || ""
      } ${propNames} ${attrNames}`.trim(),
    };
  });

  // Perform fuzzy search with fuzzysort (use very permissive threshold)
  const results = fuzzysort.go(query, searchTargets, {
    keys: ["name", "description", "searchableText"],
    threshold: 0, // Accept all matches - we'll filter with minScore
    limit: searchTargets.length, // Get all results for pagination
  });

  // Transform, normalize, and filter results
  const searchResults: SearchResult[] = results
    .map((result) => ({
      component: result.obj.component,
      score: normalizeScore(result.score),
    }))
    .filter((result) => result.score >= minScore) // Filter by normalized score
    .sort((a, b) => b.score - a.score); // Sort by score descending

  // Apply pagination
  return searchResults.slice(offset, offset + limit);
}

/**
 * Search components with pagination metadata
 * Now uses normalized scores (0-1) where higher = better match
 */
export function searchWithPagination(
  components: Map<string, BaseUIComponent>,
  query: string,
  options: {
    limit?: number;
    offset?: number;
    minScore?: number;
    includeProps?: boolean;
    includeDataAttributes?: boolean;
  } = {}
): PaginatedSearchResults {
  const {
    limit = 10,
    offset = 0,
    minScore = 0.7, // Now using normalized 0-1 scale (0.7 = 70% match)
    includeProps = true,
    includeDataAttributes = true,
  } = options;

  // Prepare search targets
  const searchTargets = Array.from(components.values()).map((component) => {
    const propNames = includeProps
      ? Object.keys(component.props).join(" ")
      : "";
    const attrNames = includeDataAttributes
      ? Object.keys(component.dataAttributes).join(" ")
      : "";

    return {
      component,
      name: component.name,
      description: component.description || "",
      searchableText: `${component.name} ${
        component.description || ""
      } ${propNames} ${attrNames}`.trim(),
    };
  });

  // Perform fuzzy search with fuzzysort (use very permissive threshold)
  const results = fuzzysort.go(query, searchTargets, {
    keys: ["name", "description", "searchableText"],
    threshold: 0, // Accept all matches - we'll filter with minScore
    limit: searchTargets.length,
  });

  // Transform, normalize, and filter results
  const allComponents = results
    .map((result) => ({
      component: result.obj.component,
      score: normalizeScore(result.score),
    }))
    .filter((result) => result.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.component);

  const total = allComponents.length;
  const paginatedItems = allComponents.slice(offset, offset + limit);

  return {
    items: paginatedItems,
    pagination: {
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
    },
  };
}

/**
 * Filter components by various criteria
 */
export function filterComponents(
  components: Map<string, BaseUIComponent>,
  filters: {
    hasProps?: string[];
    hasDataAttributes?: string[];
    hasCssVariables?: boolean;
    minPropsCount?: number;
  }
): BaseUIComponent[] {
  const results: BaseUIComponent[] = [];

  for (const component of components.values()) {
    let matches = true;

    // Check required props
    if (filters.hasProps) {
      const propNames = Object.keys(component.props).map((p) =>
        p.toLowerCase()
      );
      matches =
        matches &&
        filters.hasProps.every((prop) =>
          propNames.includes(prop.toLowerCase())
        );
    }

    // Check required data attributes
    if (filters.hasDataAttributes) {
      const attrNames = Object.keys(component.dataAttributes).map((a) =>
        a.toLowerCase()
      );
      matches =
        matches &&
        filters.hasDataAttributes.every((attr) =>
          attrNames.includes(attr.toLowerCase())
        );
    }

    // Check for CSS variables
    if (filters.hasCssVariables !== undefined) {
      const hasCss = Object.keys(component.cssVariables).length > 0;
      matches = matches && hasCss === filters.hasCssVariables;
    }

    // Check minimum props count
    if (filters.minPropsCount !== undefined) {
      matches =
        matches && Object.keys(component.props).length >= filters.minPropsCount;
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
  components: Map<string, BaseUIComponent>
): Map<string, BaseUIComponent[]> {
  const families = new Map<string, BaseUIComponent[]>();

  for (const component of components.values()) {
    // Extract family name (e.g., "Dialog" from "DialogRoot")
    const match = component.name.match(/^([A-Z][a-z]+)/);
    const familyName = match ? match[1] : "Other";

    if (!families.has(familyName)) {
      families.set(familyName, []);
    }

    families.get(familyName)!.push(component);
  }

  return families;
}

/**
 * Get component suggestions based on partial input using fuzzysort
 */
export function getSuggestions(
  components: Map<string, BaseUIComponent>,
  partialInput: string,
  limit: number = 5
): string[] {
  const componentNames = Array.from(components.values()).map((c) => c.name);

  const results = fuzzysort.go(partialInput, componentNames, {
    limit,
    threshold: -10000,
  });

  return results.map((result) => result.target);
}
