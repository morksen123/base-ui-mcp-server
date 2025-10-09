import { getComponentExamples } from "@/fetchers/examples-fetcher";
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
