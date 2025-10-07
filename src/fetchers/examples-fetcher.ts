import { BaseUIError } from "../errors/registry-error";

const GITHUB_API_BASE = "https://api.github.com/repos/mui/base-ui";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/mui/base-ui/master";
const DOCS_PATH = "docs/src/app/(public)/(content)/react/components";

export interface ComponentExample {
  name: string;
  description: string;
  code: string;
  cssCode?: string;
  language: "tsx" | "jsx";
  variant: "css-modules" | "tailwind";
}

export interface ComponentExamples {
  componentName: string;
  demos: ComponentExample[];
  anatomy: string;
  inlineExamples: Array<{
    title: string;
    code: string;
  }>;
}

/**
 * Fetch the directory structure for a component's demos
 */
async function fetchDemosList(componentName: string): Promise<string[]> {
  const component = componentName.toLowerCase().replace(/root$/, "");
  const url = `${GITHUB_API_BASE}/contents/${DOCS_PATH}/${component}/demos`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data
      .filter((item: any) => item.type === "dir")
      .map((item: any) => item.name);
  } catch (error) {
    console.error(`Failed to fetch demos list for ${componentName}:`, error);
    return [];
  }
}

/**
 * Fetch example code from a demo
 */
async function fetchDemoCode(
  componentName: string,
  demoName: string,
  variant: "css-modules" | "tailwind" = "css-modules"
): Promise<{ tsx: string; css?: string } | null> {
  const component = componentName.toLowerCase().replace(/root$/, "");
  const basePath = `${GITHUB_RAW_BASE}/${DOCS_PATH}/${component}/demos/${demoName}/${variant}`;

  try {
    // Fetch TypeScript/JSX code
    const tsxResponse = await fetch(`${basePath}/index.tsx`);
    if (!tsxResponse.ok) {
      return null;
    }
    const tsx = await tsxResponse.text();

    // Try to fetch CSS if it's css-modules variant
    let css: string | undefined;
    if (variant === "css-modules") {
      const cssResponse = await fetch(`${basePath}/index.module.css`);
      if (cssResponse.ok) {
        css = await cssResponse.text();
      }
    }

    return { tsx, css };
  } catch (error) {
    console.error(
      `Failed to fetch demo code for ${componentName}/${demoName}:`,
      error
    );
    return null;
  }
}

/**
 * Fetch the page.mdx content to extract anatomy and inline examples
 */
async function fetchPageContent(componentName: string): Promise<string | null> {
  const component = componentName.toLowerCase().replace(/root$/, "");
  const url = `${GITHUB_RAW_BASE}/${DOCS_PATH}/${component}/page.mdx`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch page content for ${componentName}:`, error);
    return null;
  }
}

/**
 * Parse anatomy from page content
 */
function parseAnatomy(pageContent: string): string {
  const anatomyMatch = pageContent.match(/```jsx title="Anatomy"([\s\S]*?)```/);
  return anatomyMatch ? anatomyMatch[1].trim() : "";
}

/**
 * Parse inline examples from page content
 */
function parseInlineExamples(
  pageContent: string
): Array<{ title: string; code: string }> {
  const examples: Array<{ title: string; code: string }> = [];

  // Match code blocks with titles, excluding the anatomy block
  const codeBlockRegex =
    /```(?:tsx|jsx|js)(?:\s+title="([^"]+)")?([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(pageContent)) !== null) {
    const title = match[1] || "Example";
    const code = match[2].trim();

    // Skip the anatomy block
    if (title !== "Anatomy" && code.length > 0) {
      examples.push({ title, code });
    }
  }

  return examples;
}

/**
 * Get all examples for a component
 */
export async function getComponentExamples(
  componentName: string
): Promise<ComponentExamples> {
  // Fetch demos list
  const demoNames = await fetchDemosList(componentName);

  // Fetch page content for anatomy and inline examples
  const pageContent = await fetchPageContent(componentName);
  const anatomy = pageContent ? parseAnatomy(pageContent) : "";
  const inlineExamples = pageContent ? parseInlineExamples(pageContent) : [];

  // Fetch code for each demo (both CSS Modules and Tailwind variants)
  const demos: ComponentExample[] = [];

  for (const demoName of demoNames) {
    // Fetch CSS Modules variant
    const cssModulesCode = await fetchDemoCode(
      componentName,
      demoName,
      "css-modules"
    );
    if (cssModulesCode) {
      demos.push({
        name: demoName,
        description: formatDemoName(demoName),
        code: cssModulesCode.tsx,
        cssCode: cssModulesCode.css,
        language: "tsx",
        variant: "css-modules",
      });
    }

    // Fetch Tailwind variant
    const tailwindCode = await fetchDemoCode(
      componentName,
      demoName,
      "tailwind"
    );
    if (tailwindCode) {
      demos.push({
        name: demoName,
        description: formatDemoName(demoName),
        code: tailwindCode.tsx,
        language: "tsx",
        variant: "tailwind",
      });
    }
  }

  return {
    componentName,
    demos,
    anatomy,
    inlineExamples,
  };
}

/**
 * Format demo name to be more readable
 */
function formatDemoName(demoName: string): string {
  return demoName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get a specific demo by name
 */
export async function getSpecificDemo(
  componentName: string,
  demoName: string,
  variant: "css-modules" | "tailwind" = "css-modules"
): Promise<ComponentExample | null> {
  const code = await fetchDemoCode(componentName, demoName, variant);

  if (!code) {
    return null;
  }

  return {
    name: demoName,
    description: formatDemoName(demoName),
    code: code.tsx,
    cssCode: code.css,
    language: "tsx",
    variant,
  };
}
