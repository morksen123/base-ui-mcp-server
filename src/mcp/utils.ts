import dedent from "dedent";
import type {
  BaseUIComponent,
  ComponentExamples,
  SetupChecklist,
} from "@/schema";
import type { PaginatedSearchResults } from "@/schema";

export function formatSearchResults(
  results: PaginatedSearchResults,
  query: string
): string {
  const { items, pagination } = results;

  let response = `# Search Results for "${query}"\n\n`;
  response += `Found ${pagination.total} component(s) (showing ${items.length})\n\n`;

  items.forEach((component) => {
    response += `## ${component.name}\n`;
    response += `${component.description || "No description"}\n`;
    response += `- Props: ${Object.keys(component.props).length}\n`;
    response += `- Data Attributes: ${
      Object.keys(component.dataAttributes).length
    }\n`;
    response += `- CSS Variables: ${
      Object.keys(component.cssVariables).length
    }\n\n`;
  });

  response += `---\n\n`;
  response += `**Pagination:** Showing ${pagination.offset + 1}-${Math.min(
    pagination.offset + pagination.limit,
    pagination.total
  )} of ${pagination.total}\n`;

  if (pagination.hasMore) {
    response += `\n💡 Use \`offset: ${
      pagination.offset + pagination.limit
    }\` to see more results.\n`;
  }

  return response;
}

export function formatComponentExamples(
  examples: ComponentExamples & {
    component?: BaseUIComponent;
  }
): string {
  let response = `# ${examples.componentName}\n\n`;

  if (examples.component) {
    response += `${
      examples.component.description || "No description available."
    }\n\n`;
    response += `**Renders:** ${
      examples.component.renders || "Doesn't render its own HTML element"
    }\n\n`;
    response += `- **Props:** ${
      Object.keys(examples.component.props).length
    }\n`;
    response += `- **Data Attributes:** ${
      Object.keys(examples.component.dataAttributes).length
    }\n`;
    response += `- **CSS Variables:** ${
      Object.keys(examples.component.cssVariables).length
    }\n\n`;
    response += `---\n\n`;
  }

  if (examples.anatomy) {
    response += `## Anatomy\n\n\`\`\`jsx\n${examples.anatomy}\n\`\`\`\n\n`;
  }

  if (examples.demos.length > 0) {
    response += `## Interactive Demos (${examples.demos.length})\n\n`;
    examples.demos.forEach((demo) => {
      response += `### ${demo.description} (${demo.variant})\n\n`;
      response += `\`\`\`tsx\n${demo.code}\n\`\`\`\n\n`;
      if (demo.cssCode) {
        response += `**CSS:**\n\`\`\`css\n${demo.cssCode}\n\`\`\`\n\n`;
      }
    });
  }

  if (examples.inlineExamples.length > 0) {
    response += `## Additional Examples (${examples.inlineExamples.length})\n\n`;
    examples.inlineExamples.forEach((example) => {
      response += `### ${example.title}\n\n`;
      response += `\`\`\`tsx\n${example.code}\n\`\`\`\n\n`;
    });
  }

  if (examples.component) {
    response += `---\n\n## Component API\n\n`;

    if (Object.keys(examples.component.props).length > 0) {
      response += `### Props (${
        Object.keys(examples.component.props).length
      })\n\n`;
      response += `\`\`\`json\n${JSON.stringify(
        examples.component.props,
        null,
        2
      )}\n\`\`\`\n\n`;
    }

    if (Object.keys(examples.component.dataAttributes).length > 0) {
      response += `### Data Attributes (${
        Object.keys(examples.component.dataAttributes).length
      })\n\n`;
      response += `\`\`\`json\n${JSON.stringify(
        examples.component.dataAttributes,
        null,
        2
      )}\n\`\`\`\n\n`;
    }

    if (Object.keys(examples.component.cssVariables).length > 0) {
      response += `### CSS Variables (${
        Object.keys(examples.component.cssVariables).length
      })\n\n`;
      response += `\`\`\`json\n${JSON.stringify(
        examples.component.cssVariables,
        null,
        2
      )}\n\`\`\`\n\n`;
    }
  }

  return response;
}

export function formatSetupChecklist(checklist: SetupChecklist) {
  let response = "# Base UI Setup Checklist\n\n";

  checklist.items.forEach((item, index) => {
    response += `## ${index + 1}. ${item.title} ${
      item.required ? "(Required)" : "(Optional)"
    }\n\n`;
    response += `${item.description}\n\n`;
    if (item.checkCommand) {
      response += `**Verify:** \`${item.checkCommand}\`\n\n`;
    }
  });

  response += "## Troubleshooting\n\n";
  checklist.troubleshooting.forEach((item) => {
    response += `**Issue:** ${item.issue}\n\n`;
    response += `**Solution:** ${item.solution}\n\n`;
  });

  return response;
}

export function formatNoResultsFound(query: string) {
  return dedent`
    No components found matching "${query}".

    💡 Try:
    - Using a different search term
    - Searching for partial matches (e.g., "dial" for Dialog)
    - Lowering the minScore threshold
  `;
}

export function formatNoExamplesFound(componentName: string) {
  return dedent`
    No examples found for component "${componentName}".

    💡 Try:
    - Checking the component name spelling
    - Using search_components to find the correct name
    - Some components may not have dedicated demos yet
  `;
}
