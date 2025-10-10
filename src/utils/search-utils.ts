import { BaseUIComponent } from "@/schema";
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

function normalizeScore(fuzzysortScore: number): number {
  return Math.max(0, Math.min(1, fuzzysortScore));
}

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
    minScore = 0.7,
    includeProps = true,
    includeDataAttributes = true,
  } = options;

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

  const results = fuzzysort.go(query, searchTargets, {
    keys: ["name", "description", "searchableText"],
    threshold: 0, // Accept all matches, filter by minScore after
    limit: searchTargets.length,
  });

  const searchResults: SearchResult[] = results
    .map((result) => ({
      component: result.obj.component,
      score: normalizeScore(result.score),
    }))
    .filter((result) => result.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return searchResults.slice(offset, offset + limit);
}

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
    minScore = 0.7,
    includeProps = true,
    includeDataAttributes = true,
  } = options;

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

  const results = fuzzysort.go(query, searchTargets, {
    keys: ["name", "description", "searchableText"],
    threshold: 0, // Accept all matches, filter by minScore after
    limit: searchTargets.length,
  });

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

    if (filters.hasCssVariables !== undefined) {
      const hasCss = Object.keys(component.cssVariables).length > 0;
      matches = matches && hasCss === filters.hasCssVariables;
    }

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

export function groupComponentsByFamily(
  components: Map<string, BaseUIComponent>
): Map<string, BaseUIComponent[]> {
  const families = new Map<string, BaseUIComponent[]>();

  for (const component of components.values()) {
    // Extract family name from component (e.g., "Dialog" from "DialogRoot")
    const match = component.name.match(/^([A-Z][a-z]+)/);
    const familyName = match ? match[1] : "Other";

    if (!families.has(familyName)) {
      families.set(familyName, []);
    }

    families.get(familyName)!.push(component);
  }

  return families;
}

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
