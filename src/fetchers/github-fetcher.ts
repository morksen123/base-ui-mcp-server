import { BaseUIComponent, BaseUIComponentSchema } from "@/types";
import {
  FetchError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "@/errors/registry-error";
import { FALLBACK_COMPONENT_NAMES } from "@/constants";
import { fetchJson, getGitHubHeaders } from "@/utils/fetch-json";
import { getConfig } from "@/config";

// Cache stores promises to prevent duplicate concurrent requests for the same resource
const resourceCache = new Map<string, Promise<any>>();

export function clearResourceCache(): void {
  resourceCache.clear();
  console.error("Resource cache cleared");
}

export async function fetchAvailableComponentNames(options?: {
  useCache?: boolean;
}): Promise<string[]> {
  const useCache = options?.useCache ?? true;
  const config = getConfig();
  const url = `${config.github.apiBase}/contents/${config.github.referencePath}`;

  if (useCache && resourceCache.has(url)) {
    return resourceCache.get(url)!;
  }

  const fetchPromise = (async () => {
    try {
      const data = await fetchJson<any[]>(url, {
        headers: getGitHubHeaders(),
      });

      // Filter to JSON files only, excluding hooks (use-*) which have different structure
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
      return getFallbackComponentNames();
    }
  })();

  if (useCache) {
    resourceCache.set(url, fetchPromise);
  }

  return fetchPromise;
}

function getFallbackComponentNames(): string[] {
  return [...FALLBACK_COMPONENT_NAMES];
}

export async function fetchComponent(
  componentName: string,
  options?: { useCache?: boolean }
): Promise<BaseUIComponent | null> {
  const useCache = options?.useCache ?? true;
  const config = getConfig();
  const url = `${config.github.rawBase}/${config.github.referencePath}/${componentName}.json`;

  if (useCache && resourceCache.has(url)) {
    return resourceCache.get(url)!;
  }

  const fetchPromise = (async () => {
    try {
      const data = await fetchJson(url);

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
      if (error instanceof NotFoundError) {
        console.error(
          `Component ${componentName} not found in GitHub repository`
        );
        return null;
      }

      if (
        error instanceof UnauthorizedError ||
        error instanceof ForbiddenError ||
        error instanceof FetchError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      throw new FetchError(
        url,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  })();

  if (useCache) {
    resourceCache.set(url, fetchPromise);
  }

  return fetchPromise;
}

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
      console.error(`Failed to fetch component ${name}:`, error);
    }
  });

  await Promise.all(promises);

  return results;
}

export async function fetchAllComponents(options?: {
  useCache?: boolean;
}): Promise<Map<string, BaseUIComponent>> {
  const componentNames = await fetchAvailableComponentNames(options);

  console.error(`Fetching ${componentNames.length} components from GitHub...`);
  return fetchComponents(componentNames, options);
}

export async function getAvailableComponentNames(options?: {
  useCache?: boolean;
}): Promise<string[]> {
  return fetchAvailableComponentNames(options);
}
