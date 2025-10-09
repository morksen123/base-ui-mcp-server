import {
  getComponentExamples,
  getSpecificDemo,
} from "@/fetchers/examples-fetcher";
import { fetchComponent } from "@/fetchers/github-fetcher";
import { BaseUIError } from "@/errors/registry-error";

export async function getExamples(
  componentName: string,
  variant?: "css-modules" | "tailwind"
) {
  try {
    const [examples, component] = await Promise.all([
      getComponentExamples(componentName),
      fetchComponent(componentName.toLowerCase()),
    ]);

    let filteredDemos = examples.demos;
    if (variant) {
      filteredDemos = examples.demos.filter((demo) => demo.variant === variant);
    }

    return {
      componentName: examples.componentName,
      anatomy: examples.anatomy,
      demos: filteredDemos,
      inlineExamples: examples.inlineExamples,
      component: component || undefined,
    };
  } catch (error) {
    throw new BaseUIError(
      `Failed to fetch examples for component "${componentName}"`,
      {
        code: "FETCH_ERROR",
        suggestion: "Check if the component name is correct and try again",
        context: { componentName, error: String(error) },
      }
    );
  }
}

export async function getDemo(
  componentName: string,
  demoName: string,
  variant: "css-modules" | "tailwind" = "css-modules"
) {
  try {
    const demo = await getSpecificDemo(componentName, demoName, variant);

    if (!demo) {
      throw new BaseUIError(
        `Demo "${demoName}" not found for component "${componentName}"`,
        {
          code: "NOT_FOUND",
          suggestion: "Use get_component_examples to see all available demos",
          context: { componentName, demoName, variant },
        }
      );
    }

    return demo;
  } catch (error) {
    if (error instanceof BaseUIError) {
      throw error;
    }
    throw new BaseUIError(
      `Failed to fetch demo "${demoName}" for component "${componentName}"`,
      {
        code: "FETCH_ERROR",
        suggestion: "Check if the demo name is correct and try again",
        context: { componentName, demoName, variant, error: String(error) },
      }
    );
  }
}
