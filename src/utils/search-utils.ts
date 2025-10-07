import { BaseUIComponent } from "../types.js";
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
 * Advanced search with fuzzysort for better fuzzy matching
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
    minScore = -10000,
    includeProps = true,
    includeDataAttributes = true,
  } = options;

  // Prepare search targets
  const searchTargets = Array.from(components.values()).map((component) => {
    const propNames = includeProps ? Object.keys(component.props).join(" ") : "";
    const attrNames = includeDataAttributes
      ? Object.keys(component.dataAttributes).join(" ")
      : "";

    return {
      component,
      name: component.name,
      description: component.description || "",
      searchableText: `${component.name} ${component.description || ""} ${propNames} ${attrNames}`.trim(),
    };
  });

  // Perform fuzzy search with fuzzysort
  const results = fuzzysort.go(query, searchTargets, {
    keys: ["name", "description", "searchableText"],
    threshold: minScore,
    limit: searchTargets.length, // Get all results for pagination
  });

  // Transform results
  const searchResults: SearchResult[] = results.map((result) => {
    return {
      component: result.obj.component,
      score: result.score,
    };
  });

  // Apply pagination
  return searchResults.slice(offset, offset + limit);
}

/**
 * Search components with pagination metadata
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
    minScore = -10000,
    includeProps = true,
    includeDataAttributes = true,
  } = options;

  // Prepare search targets
  const searchTargets = Array.from(components.values()).map((component) => {
    const propNames = includeProps ? Object.keys(component.props).join(" ") : "";
    const attrNames = includeDataAttributes
      ? Object.keys(component.dataAttributes).join(" ")
      : "";

    return {
      component,
      name: component.name,
      description: component.description || "",
      searchableText: `${component.name} ${component.description || ""} ${propNames} ${attrNames}`.trim(),
    };
  });

  // Perform fuzzy search with fuzzysort
  const results = fuzzysort.go(query, searchTargets, {
    keys: ["name", "description", "searchableText"],
    threshold: minScore,
    limit: searchTargets.length,
  });

  const allComponents = results.map((result) => result.obj.component);
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
      const propNames = Object.keys(component.props).map((p) => p.toLowerCase());
      matches =
        matches &&
        filters.hasProps.every((prop) => propNames.includes(prop.toLowerCase()));
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
  const componentNames = Array.from(components.values()).map(
    (c) => c.name
  );

  const results = fuzzysort.go(partialInput, componentNames, {
    limit,
    threshold: -10000,
  });

  return results.map((result) => result.target);
}
