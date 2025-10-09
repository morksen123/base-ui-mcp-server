import { BaseUIComponent, BaseUIComponentSchema } from "@/types";
import {
  FetchError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "@/errors/registry-error";
import { FALLBACK_COMPONENT_NAMES } from "@/constants/fallback-components";
import { fetchJson, getGitHubHeaders } from "@/utils/fetch-json";
import { getConfig } from "@/config";

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
  const config = getConfig();
  const url = `${config.github.apiBase}/contents/${config.github.referencePath}`;

  // Check cache if enabled
  if (useCache && resourceCache.has(url)) {
    return resourceCache.get(url)!;
  }

  const fetchPromise = (async () => {
    try {
      const data = await fetchJson<any[]>(url, {
        headers: getGitHubHeaders(),
      });

      // Filter for JSON files and extract names without extension
      // Exclude hooks (files starting with "use-") as they have a different structure
      const componentNames = data
        .filter(
          (item: any) =>
            item.type === "file" &&
            item.name.endsWith(".json") &&
            !item.name.startsWith("use-")
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
  const config = getConfig();
  const url = `${config.github.rawBase}/${componentName}.json`;

  // Check cache if enabled
  if (useCache && resourceCache.has(url)) {
    return resourceCache.get(url)!;
  }

  const fetchPromise = (async () => {
    try {
      const data = await fetchJson(url);

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
      // Handle 404 as a special case - return null instead of throwing
      // This allows callers to distinguish between "not found" (null) vs actual errors
      if (error instanceof NotFoundError) {
        console.error(
          `Component ${componentName} not found in GitHub repository`
        );
        return null;
      }

      // Re-throw all other errors (UnauthorizedError, ForbiddenError, FetchError, ValidationError)
      if (
        error instanceof UnauthorizedError ||
        error instanceof ForbiddenError ||
        error instanceof FetchError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      throw new FetchError(
        url,
        undefined,
        error instanceof Error ? error.message : String(error)
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
