import { BaseUIComponent, BaseUIComponentSchema } from "@/types";
import { FetchError, ValidationError } from "@/errors/registry-error";
import { FALLBACK_COMPONENT_NAMES } from "@/constants/fallback-components";

const GITHUB_API_BASE = "https://api.github.com/repos/mui/base-ui";
const GITHUB_RAW_BASE_URL =
  "https://raw.githubusercontent.com/mui/base-ui/master/docs/reference/generated";
const REFERENCE_DOCS_PATH = "docs/reference/generated";

// ============================================================================
// In-memory fetch cache (no TTL, persists for process lifetime)
// ============================================================================
const resourceCache = new Map<string, Promise<any>>();

/**
 * Clear the entire resource cache
 * Useful for forcing fresh data or freeing memory
 */
export function clearResourceCache(): void {
  resourceCache.clear();
  console.error("Resource cache cleared");
}

/**
 * Fetch the list of all component JSON files from GitHub
 */
export async function fetchAvailableComponentNames(options?: {
  useCache?: boolean;
}): Promise<string[]> {
  const useCache = options?.useCache ?? true;
  const url = `${GITHUB_API_BASE}/contents/${REFERENCE_DOCS_PATH}`;

  // Check cache if enabled
  if (useCache && resourceCache.has(url)) {
    return resourceCache.get(url)!;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new FetchError(
          url,
          new Error(`HTTP ${response.status}: ${response.statusText}`)
        );
      }

      const data = await response.json();

      // Filter for JSON files and extract names without extension
      const componentNames = data
        .filter(
          (item: any) => item.type === "file" && item.name.endsWith(".json")
        )
        .map((item: any) => item.name.replace(".json", ""));

      console.error(`Found ${componentNames.length} components in repository`);
      return componentNames;
    } catch (error) {
      console.error("Failed to fetch component list from GitHub:", error);
      // Fallback to a basic list if GitHub API fails
      return getFallbackComponentNames();
    }
  })();

  // Store in cache if enabled
  if (useCache) {
    resourceCache.set(url, fetchPromise);
  }

  return fetchPromise;
}

/**
 * Fallback component list in case GitHub API is unavailable
 */
function getFallbackComponentNames(): string[] {
  return [...FALLBACK_COMPONENT_NAMES];
}

/**
 * Fetch a single component JSON file from GitHub
 */
export async function fetchComponent(
  componentName: string,
  options?: { useCache?: boolean }
): Promise<BaseUIComponent | null> {
  const useCache = options?.useCache ?? true;
  const url = `${GITHUB_RAW_BASE_URL}/${componentName}.json`;

  // Check cache if enabled
  if (useCache && resourceCache.has(url)) {
    return resourceCache.get(url)!;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          // Component not found - return null (not an error)
          console.error(
            `Component ${componentName} not found in GitHub repository`
          );
          return null;
        }

        throw new FetchError(
          url,
          new Error(`HTTP ${response.status}: ${response.statusText}`)
        );
      }

      const data = await response.json();

      // Validate the data matches our schema
      const result = BaseUIComponentSchema.safeParse(data);

      if (!result.success) {
        throw new ValidationError(
          `Invalid component data for ${componentName}`,
          {
            componentName,
            errors: result.error.errors,
          }
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof FetchError || error instanceof ValidationError) {
        throw error;
      }

      // Network or other errors
      throw new FetchError(
        url,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  })();

  // Store in cache if enabled
  if (useCache) {
    resourceCache.set(url, fetchPromise);
  }

  return fetchPromise;
}

/**
 * Fetch multiple components in parallel
 */
export async function fetchComponents(
  componentNames: string[],
  options?: { useCache?: boolean }
): Promise<Map<string, BaseUIComponent>> {
  const results = new Map<string, BaseUIComponent>();

  const promises = componentNames.map(async (name) => {
    try {
      const component = await fetchComponent(name, options);
      if (component) {
        results.set(name, component);
      }
    } catch (error) {
      // Log error but don't fail the entire fetch
      console.error(`Failed to fetch component ${name}:`, error);
    }
  });

  await Promise.all(promises);

  return results;
}

/**
 * Fetch all available components dynamically from GitHub
 */
export async function fetchAllComponents(options?: {
  useCache?: boolean;
}): Promise<Map<string, BaseUIComponent>> {
  // Dynamically fetch the list of available components
  const componentNames = await fetchAvailableComponentNames(options);

  console.error(`Fetching ${componentNames.length} components from GitHub...`);
  return fetchComponents(componentNames, options);
}

/**
 * Get the list of all available component names (cached or fetched)
 */
export async function getAvailableComponentNames(options?: {
  useCache?: boolean;
}): Promise<string[]> {
  return fetchAvailableComponentNames(options);
}
