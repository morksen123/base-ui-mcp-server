import { getConfig } from "@/config";
import { fetchJson, fetchText, getGitHubHeaders } from "@/utils/fetch-json";
import { ComponentExample, ComponentExamples } from "@/schema";

async function fetchDemosList(componentName: string): Promise<string[]> {
  const config = getConfig();
  const component = componentName.toLowerCase().replace(/root$/, "");
  const url = `${config.github.apiBase}/contents/${config.github.examplesPath}/${component}/demos`;

  try {
    const data = await fetchJson<any[]>(url, {
      headers: getGitHubHeaders(),
    });

    return data
      .filter((item: any) => item.type === "dir")
      .map((item: any) => item.name);
  } catch (error) {
    console.error(`Failed to fetch demos list for ${componentName}:`, error);
    return [];
  }
}

async function fetchDemoCode(
  componentName: string,
  demoName: string,
  variant: "css-modules" | "tailwind" = "css-modules"
): Promise<{ tsx: string; css?: string } | null> {
  const config = getConfig();
  const component = componentName.toLowerCase().replace(/root$/, "");
  const basePath = `${config.github.rawBase}/${config.github.examplesPath}/${component}/demos/${demoName}/${variant}`;

  try {
    const tsx = await fetchText(`${basePath}/index.tsx`);
    if (!tsx) {
      return null;
    }

    let css: string | undefined;
    if (variant === "css-modules") {
      css = (await fetchText(`${basePath}/index.module.css`)) || undefined;
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

async function fetchPageContent(componentName: string): Promise<string | null> {
  const config = getConfig();
  const component = componentName.toLowerCase().replace(/root$/, "");
  const url = `${config.github.rawBase}/${config.github.examplesPath}/${component}/page.mdx`;

  return await fetchText(url);
}

function parseAnatomy(pageContent: string): string {
  const anatomyMatch = pageContent.match(/```jsx title="Anatomy"([\s\S]*?)```/);
  return anatomyMatch ? anatomyMatch[1].trim() : "";
}

function parseInlineExamples(
  pageContent: string
): Array<{ title: string; code: string }> {
  const examples: Array<{ title: string; code: string }> = [];

  const codeBlockRegex =
    /```(?:tsx|jsx|js)(?:\s+title="([^"]+)")?([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(pageContent)) !== null) {
    const title = match[1] || "Example";
    const code = match[2].trim();

    if (title !== "Anatomy" && code.length > 0) {
      examples.push({ title, code });
    }
  }

  return examples;
}

export async function getComponentExamples(
  componentName: string
): Promise<ComponentExamples> {
  const demoNames = await fetchDemosList(componentName);

  const pageContent = await fetchPageContent(componentName);
  const anatomy = pageContent ? parseAnatomy(pageContent) : "";
  const inlineExamples = pageContent ? parseInlineExamples(pageContent) : [];

  const demos: ComponentExample[] = [];

  for (const demoName of demoNames) {
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

function formatDemoName(demoName: string): string {
  return demoName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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
