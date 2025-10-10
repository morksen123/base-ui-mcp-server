import { BaseUIComponent } from "@/schema";
import { fetchComponent, fetchAllComponents } from "@/fetchers/github-fetcher";
import {
  searchWithPagination,
  PaginatedSearchResults,
} from "@/utils/search-utils";

async function getAllComponents(): Promise<Map<string, BaseUIComponent>> {
  return fetchAllComponents();
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
