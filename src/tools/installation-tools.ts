import { BaseUIComponent } from "../types";
import { getComponent } from "./component-tools";

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

/**
 * Get installation guide for one or more components
 */
export async function getInstallationGuide(
  componentNames: string[]
): Promise<InstallationGuide> {
  const components: BaseUIComponent[] = [];
  const relatedComponentsSet = new Set<string>();

  // Fetch all requested components
  for (const name of componentNames) {
    const component = await getComponent(name);
    if (component) {
      components.push(component);

      // Extract related components from component name patterns
      // e.g., DialogRoot, DialogTrigger, DialogPopup all belong to Dialog family
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

  // Get the main component family name
  const mainComponent = components[0].name;
  const componentFamily = mainComponent
    .replace(
      /Root|Trigger|Popup|Backdrop|Portal|Close|Item|Content|Control|Value/gi,
      ""
    )
    .toLowerCase();

  // Generate imports
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

  // Generate basic usage based on the component type
  const basicUsage = generateBasicUsage(mainComponent);

  return {
    packageName: "@base-ui-components/react",
    installCommand: {
      npm: "npm install @base-ui-components/react",
      yarn: "yarn add @base-ui-components/react",
      pnpm: "pnpm add @base-ui-components/react",
    },
    peerDependencies: {
      react: "^18.0.0 || ^19.0.0",
      reactDom: "^18.0.0 || ^19.0.0",
    },
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

/**
 * Get setup checklist for Base UI
 */
export async function getSetupChecklist(): Promise<SetupChecklist> {
  return {
    items: [
      {
        id: "install-base-ui",
        title: "Install Base UI",
        description: "Install @base-ui-components/react package",
        required: true,
        checkCommand: "npm list @base-ui-components/react",
      },
      {
        id: "react-version",
        title: "Check React Version",
        description: "Ensure React version is 18.0.0 or higher",
        required: true,
        checkCommand: "npm list react",
      },
      {
        id: "typescript",
        title: "TypeScript Configuration (Optional)",
        description:
          'If using TypeScript, ensure your tsconfig.json has "moduleResolution": "bundler" or "node16"',
        required: false,
      },
      {
        id: "css-setup",
        title: "CSS/Styling Setup",
        description:
          "Base UI components are unstyled. Set up your preferred styling solution (CSS Modules, Tailwind, Styled Components, etc.)",
        required: true,
      },
      {
        id: "import-test",
        title: "Test Component Import",
        description: "Try importing a component to verify the setup",
        required: true,
        checkCommand: `node -e "require('@base-ui-components/react/button')"`,
      },
      {
        id: "accessibility",
        title: "Review Accessibility Features",
        description:
          "Base UI components follow WAI-ARIA patterns. Review the accessibility features of the components you use.",
        required: false,
      },
    ],
    troubleshooting: [
      {
        issue: "Module not found: @base-ui-components/react",
        solution:
          "Run the install command: npm install @base-ui-components/react. Make sure you are in the correct directory.",
      },
      {
        issue: "React version incompatibility",
        solution:
          "Upgrade React to version 18.0.0 or higher: npm install react@^18 react-dom@^18",
      },
      {
        issue: "TypeScript errors with imports",
        solution:
          'Update your tsconfig.json to include "moduleResolution": "bundler" and ensure "jsx" is set to "react-jsx" or "react"',
      },
      {
        issue: "Components have no styling",
        solution:
          "Base UI components are unstyled by default. Add your own styles using className prop and your preferred CSS solution.",
      },
      {
        issue: "ESM/CommonJS module errors",
        solution:
          "Base UI uses ESM. If using CommonJS, you may need to update your build configuration or use dynamic imports.",
      },
    ],
  };
}

/**
 * Get component dependencies and related components
 */
export async function getComponentDependencies(componentName: string): Promise<{
  component: string;
  peerDependencies: Record<string, string>;
  relatedComponents: string[];
  componentFamily: string;
  requiredParts: string[];
  optionalParts: string[];
}> {
  const component = await getComponent(componentName);

  if (!component) {
    throw new Error(`Component "${componentName}" not found`);
  }

  // Determine component family
  const family = componentName.replace(
    /Root|Trigger|Popup|Backdrop|Portal|Close|Item|Content|Control|Value|Positioner|Arrow|Title|Description/gi,
    ""
  );

  // Get related components based on common patterns
  const relatedComponents = getRelatedComponentsByFamily(family);

  // Determine required vs optional parts based on component type
  const { required, optional } = categorizeComponentParts(
    family,
    relatedComponents
  );

  return {
    component: componentName,
    peerDependencies: {
      react: "^18.0.0 || ^19.0.0",
      "react-dom": "^18.0.0 || ^19.0.0",
    },
    relatedComponents,
    componentFamily: family,
    requiredParts: required,
    optionalParts: optional,
  };
}

/**
 * Helper: Format component name to PascalCase
 */
function formatComponentName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Helper: Generate basic usage example
 */
function generateBasicUsage(componentName: string): string {
  const family = componentName
    .replace(
      /Root|Trigger|Popup|Backdrop|Portal|Close|Item|Content|Control|Value/gi,
      ""
    )
    .toLowerCase();
  const Component = formatComponentName(family);

  // Component-specific usage patterns
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

/**
 * Helper: Get related components by family
 */
function getRelatedComponentsByFamily(family: string): string[] {
  const componentFamilies: Record<string, string[]> = {
    Dialog: [
      "DialogRoot",
      "DialogTrigger",
      "DialogPortal",
      "DialogBackdrop",
      "DialogPopup",
      "DialogTitle",
      "DialogDescription",
      "DialogClose",
    ],
    Popover: [
      "PopoverRoot",
      "PopoverTrigger",
      "PopoverPortal",
      "PopoverBackdrop",
      "PopoverPositioner",
      "PopoverPopup",
      "PopoverArrow",
      "PopoverClose",
    ],
    Menu: [
      "MenuRoot",
      "MenuTrigger",
      "MenuPortal",
      "MenuPositioner",
      "MenuPopup",
      "MenuItem",
      "MenuArrow",
      "MenuSeparator",
    ],
    Select: [
      "SelectRoot",
      "SelectTrigger",
      "SelectPortal",
      "SelectPositioner",
      "SelectPopup",
      "SelectOption",
      "SelectValue",
    ],
    Slider: [
      "SliderRoot",
      "SliderControl",
      "SliderTrack",
      "SliderIndicator",
      "SliderThumb",
      "SliderValue",
    ],
    Switch: ["SwitchRoot", "SwitchThumb"],
    Checkbox: ["CheckboxRoot", "CheckboxIndicator"],
    Radio: ["RadioRoot", "RadioIndicator"],
    Accordion: [
      "AccordionRoot",
      "AccordionItem",
      "AccordionHeader",
      "AccordionTrigger",
      "AccordionPanel",
    ],
    Tabs: ["TabsRoot", "TabsList", "TabsTab", "TabsPanel"],
    Tooltip: [
      "TooltipRoot",
      "TooltipTrigger",
      "TooltipPortal",
      "TooltipPositioner",
      "TooltipPopup",
      "TooltipArrow",
    ],
  };

  return componentFamilies[family] || [];
}

/**
 * Helper: Categorize component parts as required or optional
 */
function categorizeComponentParts(
  family: string,
  relatedComponents: string[]
): { required: string[]; optional: string[] } {
  // Common patterns for required vs optional parts
  const requiredPatterns = ["Root", "Trigger", "Popup", "Control", "Track"];
  const optionalPatterns = [
    "Portal",
    "Backdrop",
    "Arrow",
    "Close",
    "Title",
    "Description",
    "Value",
    "Indicator",
  ];

  const required = relatedComponents.filter((comp) =>
    requiredPatterns.some((pattern) => comp.includes(pattern))
  );

  const optional = relatedComponents.filter((comp) =>
    optionalPatterns.some((pattern) => comp.includes(pattern))
  );

  return { required, optional };
}
