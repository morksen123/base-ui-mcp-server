import { BaseUIComponent } from "@/types";
import { fetchComponent, fetchAllComponents } from "@/fetchers/github-fetcher";
import {
  searchWithScoring,
  searchWithPagination,
  filterComponents,
  groupComponentsByFamily,
  getSuggestions,
  PaginatedSearchResults,
} from "@/utils/search-utils";

async function getAllComponents(): Promise<Map<string, BaseUIComponent>> {
  return fetchAllComponents();
}

export async function searchComponents(
  query: string,
  limit: number = 10,
  options?: {
    offset?: number;
    minScore?: number;
    includeProps?: boolean;
    includeDataAttributes?: boolean;
  }
): Promise<BaseUIComponent[]> {
  const components = await getAllComponents();

  const searchResults = searchWithScoring(components, query, {
    limit,
    offset: options?.offset || 0,
    minScore: options?.minScore ?? 0.7,
    includeProps: options?.includeProps !== false,
    includeDataAttributes: options?.includeDataAttributes !== false,
  });

  return searchResults.map((result) => result.component);
}

export async function searchComponentsWithPagination(
  query: string,
  limit: number = 10,
  options?: {
    offset?: number;
    minScore?: number;
    includeProps?: boolean;
    includeDataAttributes?: boolean;
  }
): Promise<PaginatedSearchResults> {
  const components = await getAllComponents();

  return searchWithPagination(components, query, {
    limit,
    offset: options?.offset || 0,
    minScore: options?.minScore ?? 0.7,
    includeProps: options?.includeProps !== false,
    includeDataAttributes: options?.includeDataAttributes !== false,
  });
}

export async function searchComponentsWithScores(
  query: string,
  limit: number = 10
) {
  const components = await getAllComponents();

  return searchWithScoring(components, query, { limit });
}

export async function getComponent(
  name: string
): Promise<BaseUIComponent | null> {
  const components = await getAllComponents();

  for (const [key, component] of components.entries()) {
    if (
      key.toLowerCase() === name.toLowerCase() ||
      component.name.toLowerCase() === name.toLowerCase()
    ) {
      return component;
    }
  }

  const component = await fetchComponent(name.toLowerCase());
  return component;
}

export async function listComponents(
  limit: number = 50
): Promise<BaseUIComponent[]> {
  const components = await getAllComponents();
  const allComponents = Array.from(components.values());

  return allComponents.slice(0, limit);
}

export async function filterComponentsByCriteria(filters: {
  hasProps?: string[];
  hasDataAttributes?: string[];
  hasCssVariables?: boolean;
  minPropsCount?: number;
}): Promise<BaseUIComponent[]> {
  const components = await getAllComponents();
  return filterComponents(components, filters);
}

export async function getComponentFamilies(): Promise<
  Map<string, BaseUIComponent[]>
> {
  const components = await getAllComponents();
  return groupComponentsByFamily(components);
}

export async function getComponentSuggestions(
  partialInput: string,
  limit: number = 5
): Promise<string[]> {
  const components = await getAllComponents();
  return getSuggestions(components, partialInput, limit);
}

export async function getComponentStats(): Promise<{
  total: number;
  families: number;
}> {
  const components = await getAllComponents();
  const families = groupComponentsByFamily(components);

  return {
    total: components.size,
    families: families.size,
  };
}
