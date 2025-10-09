import { BaseUIComponent } from "@/types";
import { getComponent } from "./component-tools";
import { fetchJson } from "@/utils/fetch-json";
import { getConfig } from "@/config";

export interface InstallationGuide {
  packageName: string;
  installCommand: {
    npm: string;
    yarn: string;
    pnpm: string;
  };
  peerDependencies: {
    react: string;
    reactDom: string;
  };
  imports: string[];
  basicUsage: string;
  relatedComponents?: string[];
  cssSetup?: string;
}

export interface SetupChecklist {
  items: Array<{
    id: string;
    title: string;
    description: string;
    required: boolean;
    checkCommand?: string;
  }>;
  troubleshooting: Array<{
    issue: string;
    solution: string;
  }>;
}

export interface PackageJson {
  name: string;
  version: string;
  peerDependencies?: {
    react?: string;
    "react-dom"?: string;
    [key: string]: string | undefined;
  };
}

// Cache for package.json to avoid repeated fetches
let packageJsonCache: PackageJson | null = null;

// Export for testing purposes
export function clearPackageJsonCache(): void {
  packageJsonCache = null;
}

export async function fetchPackageJson(): Promise<PackageJson> {
  if (packageJsonCache) {
    return packageJsonCache;
  }

  const config = getConfig();
  const packageJsonUrl = `${config.github.rawBase}/packages/react/package.json`;

  try {
    const packageJson = await fetchJson<PackageJson>(packageJsonUrl);
    packageJsonCache = packageJson;
    return packageJson;
  } catch (error) {
    console.error(
      "Failed to fetch package.json from Base UI repository:",
      error
    );

    // Provide fallback package information based on the actual Base UI package.json
    const fallbackPackageJson: PackageJson = {
      name: "@base-ui-components/react",
      version: "1.0.0-beta.4",
      peerDependencies: {
        react: "^17 || ^18 || ^19",
        "react-dom": "^17 || ^18 || ^19",
      },
    };

    console.warn(
      "Using fallback package information. Installation guide may not reflect the latest package details."
    );
    packageJsonCache = fallbackPackageJson;
    return fallbackPackageJson;
  }
}

export async function getInstallationGuide(
  componentNames: string[]
): Promise<InstallationGuide> {
  // Fetch package.json from Base UI repository for accurate package information
  const packageJson = await fetchPackageJson();

  const components: BaseUIComponent[] = [];
  const relatedComponentsSet = new Set<string>();

  for (const name of componentNames) {
    const component = await getComponent(name);
    if (component) {
      components.push(component);

      // Extract component family by removing common suffixes
      const family = name.replace(
        /Root|Trigger|Popup|Backdrop|Portal|Close|Item|Content|Control|Value/gi,
        ""
      );
      if (family && family !== name) {
        relatedComponentsSet.add(family);
      }
    }
  }

  if (components.length === 0) {
    throw new Error(`No components found for: ${componentNames.join(", ")}`);
  }

  const mainComponent = components[0].name;
  const componentFamily = mainComponent
    .replace(
      /Root|Trigger|Popup|Backdrop|Portal|Close|Item|Content|Control|Value/gi,
      ""
    )
    .toLowerCase();

  const imports: string[] = [];
  const uniqueFamilies = new Set<string>();

  for (const component of components) {
    const family = component.name
      .replace(
        /Root|Trigger|Popup|Backdrop|Portal|Close|Item|Content|Control|Value/gi,
        ""
      )
      .toLowerCase();
    uniqueFamilies.add(family);
  }

  uniqueFamilies.forEach((family) => {
    const importPath = family ? family : componentFamily;
    imports.push(
      `import { ${formatComponentName(
        importPath
      )} } from '@base-ui-components/react/${importPath}';`
    );
  });

  const basicUsage = generateBasicUsage(mainComponent);

  // Generate install commands using the actual package name
  const installCommand = {
    npm: `npm install ${packageJson.name}`,
    yarn: `yarn add ${packageJson.name}`,
    pnpm: `pnpm add ${packageJson.name}`,
  };

  // Extract peer dependencies, with fallbacks if not available
  const peerDependencies = {
    react: packageJson.peerDependencies?.react || "^17 || ^18 || ^19",
    reactDom:
      packageJson.peerDependencies?.["react-dom"] || "^17 || ^18 || ^19",
  };

  return {
    packageName: packageJson.name,
    installCommand,
    peerDependencies,
    imports,
    basicUsage,
    relatedComponents: Array.from(relatedComponentsSet),
    cssSetup: `Base UI components are unstyled by default. You can style them using:
- CSS Modules
- Tailwind CSS
- Styled Components
- Any other CSS-in-JS solution

Example with CSS Modules:
\`\`\`css
/* styles.module.css */
.button {
  padding: 8px 16px;
  border-radius: 4px;
  background: blue;
  color: white;
}
\`\`\`

\`\`\`jsx
import styles from './styles.module.css';
<Component.Root className={styles.button} />
\`\`\``,
  };
}

export async function getSetupChecklist(): Promise<SetupChecklist> {
  return {
    items: [
      {
        id: "quick-start",
        title: "Base UI Quick Start Guide",
        description:
          "Follow the official Base UI quick start guide for installation and setup instructions.",
        required: true,
      },
    ],
    troubleshooting: [
      {
        issue: "Need installation help?",
        solution:
          "Visit the Base UI quick start guide at https://base-ui.com/react/overview/quick-start for complete setup instructions.",
      },
    ],
  };
}

function formatComponentName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function generateBasicUsage(componentName: string): string {
  const family = componentName
    .replace(
      /Root|Trigger|Popup|Backdrop|Portal|Close|Item|Content|Control|Value/gi,
      ""
    )
    .toLowerCase();
  const Component = formatComponentName(family);

  const usagePatterns: Record<string, string> = {
    dialog: `<Dialog.Root>
  <Dialog.Trigger>Open Dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Popup>
      <Dialog.Title>Dialog Title</Dialog.Title>
      <Dialog.Description>Dialog description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>`,
    popover: `<Popover.Root>
  <Popover.Trigger>Open Popover</Popover.Trigger>
  <Popover.Portal>
    <Popover.Positioner>
      <Popover.Popup>
        <Popover.Arrow />
        Content
      </Popover.Popup>
    </Popover.Positioner>
  </Popover.Portal>
</Popover.Root>`,
    menu: `<Menu.Root>
  <Menu.Trigger>Open Menu</Menu.Trigger>
  <Menu.Portal>
    <Menu.Positioner>
      <Menu.Popup>
        <Menu.Item>Item 1</Menu.Item>
        <Menu.Item>Item 2</Menu.Item>
      </Menu.Popup>
    </Menu.Positioner>
  </Menu.Portal>
</Menu.Root>`,
    slider: `<Slider.Root>
  <Slider.Control>
    <Slider.Track>
      <Slider.Indicator />
      <Slider.Thumb />
    </Slider.Track>
  </Slider.Control>
</Slider.Root>`,
    switch: `<Switch.Root>
  <Switch.Thumb />
</Switch.Root>`,
    checkbox: `<Checkbox.Root>
  <Checkbox.Indicator />
</Checkbox.Root>`,
  };

  return (
    usagePatterns[family] ||
    `<${Component}.Root>
  {/* Add ${Component} parts here */}
</${Component}.Root>`
  );
}
