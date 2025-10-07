import { BaseUIComponent, BaseUIComponentSchema } from '../types.js';
import { FetchError, ValidationError } from '../errors/registry-error.js';

const GITHUB_RAW_BASE_URL =
  'https://raw.githubusercontent.com/mui/base-ui/master/docs/reference/generated';

// List of all component files in the Base UI repository
// This will be used to fetch component data
const COMPONENT_FILES = [
  // Accordion
  'accordion-root',
  'accordion-header',
  'accordion-item',
  'accordion-panel',
  'accordion-trigger',
  // Alert Dialog
  'alert-dialog-root',
  'alert-dialog-backdrop',
  'alert-dialog-close',
  'alert-dialog-description',
  'alert-dialog-popup',
  'alert-dialog-portal',
  'alert-dialog-title',
  'alert-dialog-trigger',
  // Dialog
  'dialog-root',
  'dialog-backdrop',
  'dialog-close',
  'dialog-description',
  'dialog-popup',
  'dialog-portal',
  'dialog-title',
  'dialog-trigger',
  // Input
  'input',
  // Field
  'field-root',
  'field-control',
  'field-description',
  'field-error',
  'field-label',
  'field-validity',
  // Add more as needed...
];

/**
 * Fetch a single component JSON file from GitHub
 */
export async function fetchComponent(componentName: string): Promise<BaseUIComponent | null> {
  const url = `${GITHUB_RAW_BASE_URL}/${componentName}.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        // Component not found - return null (not an error)
        console.error(`Component ${componentName} not found in GitHub repository`);
        return null;
      }

      throw new FetchError(url, new Error(`HTTP ${response.status}: ${response.statusText}`));
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
    throw new FetchError(url, error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Fetch multiple components in parallel
 */
export async function fetchComponents(
  componentNames: string[],
): Promise<Map<string, BaseUIComponent>> {
  const results = new Map<string, BaseUIComponent>();

  const promises = componentNames.map(async (name) => {
    const component = await fetchComponent(name);
    if (component) {
      results.set(name, component);
    }
  });

  await Promise.all(promises);

  return results;
}

/**
 * Fetch all available components
 */
export async function fetchAllComponents(): Promise<Map<string, BaseUIComponent>> {
  console.error(`Fetching ${COMPONENT_FILES.length} components from GitHub...`);
  return fetchComponents(COMPONENT_FILES);
}

/**
 * Get the list of all available component names
 */
export function getAvailableComponentNames(): string[] {
  return [...COMPONENT_FILES];
}
