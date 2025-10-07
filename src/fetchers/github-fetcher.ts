import { BaseUIComponent, BaseUIComponentSchema } from "../types.js";
import { FetchError, ValidationError } from "../errors/registry-error.js";

const GITHUB_API_BASE = "https://api.github.com/repos/mui/base-ui";
const GITHUB_RAW_BASE_URL =
  "https://raw.githubusercontent.com/mui/base-ui/master/docs/reference/generated";
const REFERENCE_DOCS_PATH = "docs/reference/generated";

/**
 * Fetch the list of all component JSON files from GitHub
 */
export async function fetchAvailableComponentNames(): Promise<string[]> {
  const url = `${GITHUB_API_BASE}/contents/${REFERENCE_DOCS_PATH}`;

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
}

/**
 * Fallback component list in case GitHub API is unavailable
 */
function getFallbackComponentNames(): string[] {
  return [
    // Accordion
    "accordion-root",
    "accordion-header",
    "accordion-item",
    "accordion-panel",
    "accordion-trigger",
    // Alert Dialog
    "alert-dialog-root",
    "alert-dialog-backdrop",
    "alert-dialog-close",
    "alert-dialog-description",
    "alert-dialog-popup",
    "alert-dialog-portal",
    "alert-dialog-title",
    "alert-dialog-trigger",
    // Avatar
    "avatar-root",
    "avatar-image",
    "avatar-fallback",
    // Checkbox
    "checkbox-root",
    "checkbox-indicator",
    // Collapsible
    "collapsible-root",
    "collapsible-trigger",
    "collapsible-content",
    // Dialog
    "dialog-root",
    "dialog-backdrop",
    "dialog-close",
    "dialog-description",
    "dialog-popup",
    "dialog-portal",
    "dialog-title",
    "dialog-trigger",
    // Field
    "field-root",
    "field-control",
    "field-description",
    "field-error",
    "field-label",
    "field-validity",
    // Input
    "input",
    // Menu
    "menu-root",
    "menu-trigger",
    "menu-portal",
    "menu-positioner",
    "menu-popup",
    "menu-item",
    "menu-arrow",
    // Popover
    "popover-root",
    "popover-trigger",
    "popover-portal",
    "popover-positioner",
    "popover-popup",
    "popover-arrow",
    "popover-backdrop",
    "popover-close",
    // Select
    "select-root",
    "select-trigger",
    "select-portal",
    "select-positioner",
    "select-popup",
    "select-option",
    "select-value",
    // Slider
    "slider-root",
    "slider-control",
    "slider-track",
    "slider-indicator",
    "slider-thumb",
    "slider-value",
    // Switch
    "switch-root",
    "switch-thumb",
    // Tabs
    "tabs-root",
    "tabs-list",
    "tabs-tab",
    "tabs-panel",
    // Tooltip
    "tooltip-root",
    "tooltip-trigger",
    "tooltip-portal",
    "tooltip-positioner",
    "tooltip-popup",
    "tooltip-arrow",
  ];
}

/**
 * Fetch a single component JSON file from GitHub
 */
export async function fetchComponent(
  componentName: string
): Promise<BaseUIComponent | null> {
  const url = `${GITHUB_RAW_BASE_URL}/${componentName}.json`;

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
      throw new ValidationError(`Invalid component data for ${componentName}`, {
        componentName,
        errors: result.error.errors,
      });
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
}

/**
 * Fetch multiple components in parallel
 */
export async function fetchComponents(
  componentNames: string[]
): Promise<Map<string, BaseUIComponent>> {
  const results = new Map<string, BaseUIComponent>();

  const promises = componentNames.map(async (name) => {
    try {
      const component = await fetchComponent(name);
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
export async function fetchAllComponents(): Promise<
  Map<string, BaseUIComponent>
> {
  // Dynamically fetch the list of available components
  const componentNames = await fetchAvailableComponentNames();

  console.error(`Fetching ${componentNames.length} components from GitHub...`);
  return fetchComponents(componentNames);
}

/**
 * Get the list of all available component names (cached or fetched)
 */
export async function getAvailableComponentNames(): Promise<string[]> {
  return fetchAvailableComponentNames();
}
