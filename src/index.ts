#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import dedent from "dedent";

// Import our tools
import {
  searchComponents,
  searchComponentsWithPagination,
  getComponent,
  listComponents,
} from "./tools/component-tools.js";
import { getExamples, getDemo } from "./tools/examples-tools.js";
import {
  getInstallationGuide,
  getSetupChecklist,
  getComponentDependencies,
} from "./tools/installation-tools.js";

// Import schemas and errors
import {
  SearchComponentsSchema,
  GetComponentSchema,
  ListComponentsSchema,
  GetComponentExamplesSchema,
  GetSpecificDemoSchema,
  GetInstallationGuideSchema,
  GetComponentDependenciesSchema,
  GetSetupChecklistSchema,
} from "./types.js";
import { BaseUIError } from "./errors/registry-error.js";

async function main() {
  const server = new Server(
    {
      name: "base-ui",
      version: "1.0.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_components",
          description: dedent`
            Search Base UI components by name or description using fuzzy matching.
            Returns components with relevance scores.
          `,
          inputSchema: zodToJsonSchema(SearchComponentsSchema),
        },
        {
          name: "get_component",
          description: dedent`
            Get detailed information about a specific Base UI component including props,
            data attributes, and CSS variables. Use the exact component name (e.g., 'Input', 'DialogRoot').
          `,
          inputSchema: zodToJsonSchema(GetComponentSchema),
        },
        {
          name: "list_components",
          description: dedent`
            List all available Base UI components with pagination support.
            Use this to browse all components in the library.
          `,
          inputSchema: zodToJsonSchema(ListComponentsSchema),
        },
        {
          name: "get_component_examples",
          description: dedent`
            ⭐ MOST IMPORTANT: Get full, copy-pasteable code examples and demos for a component.
            Returns working demo code (both CSS Modules and Tailwind variants), anatomy,
            and inline examples from documentation. This is what users need to actually USE the component.
          `,
          inputSchema: zodToJsonSchema(GetComponentExamplesSchema),
        },
        {
          name: "get_specific_demo",
          description: dedent`
            Get a specific demo by name for a component. Useful when you know which demo you want.
            Returns the full code for that specific demo.
          `,
          inputSchema: zodToJsonSchema(GetSpecificDemoSchema),
        },
        {
          name: "get_installation_guide",
          description: dedent`
            Get installation commands, required imports, peer dependencies, and basic usage
            for one or more components. Includes npm/yarn/pnpm commands and setup instructions.
          `,
          inputSchema: zodToJsonSchema(GetInstallationGuideSchema),
        },
        {
          name: "get_component_dependencies",
          description: dedent`
            Get detailed dependency information for a component including peer dependencies,
            related components in the same family, required vs optional parts, and component structure.
          `,
          inputSchema: zodToJsonSchema(GetComponentDependenciesSchema),
        },
        {
          name: "get_setup_checklist",
          description: dedent`
            Get a comprehensive setup checklist for Base UI including installation verification,
            React version checks, TypeScript configuration, CSS setup, and common troubleshooting.
          `,
          inputSchema: zodToJsonSchema(GetSetupChecklistSchema),
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      if (!request.params.arguments) {
        throw new Error("No tool arguments provided.");
      }

      const { name, arguments: args } = request.params;

      // Log the tool call for debugging
      console.error(`Tool called: ${name}`, args);

      switch (name) {
        case "search_components": {
          // Validate and parse input
          const parsedArgs = SearchComponentsSchema.parse(args);
          const searchResults = await searchComponentsWithPagination(
            parsedArgs.query,
            parsedArgs.limit,
            {
              offset: parsedArgs.offset,
              minScore: parsedArgs.minScore,
              includeProps: parsedArgs.includeProps,
              includeDataAttributes: parsedArgs.includeDataAttributes,
            }
          );

          if (searchResults.items.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: dedent`
                    No components found matching "${parsedArgs.query}".

                    💡 Try:
                    - Using a different search term
                    - Searching for partial matches (e.g., "dial" for Dialog)
                    - Lowering the minScore threshold
                    - Using list_components to see all available components
                  `,
                },
              ],
            };
          }

          const { items, pagination } = searchResults;
          
          let response = `# Search Results for "${parsedArgs.query}"\n\n`;
          response += `Found ${pagination.total} component(s) (showing ${items.length})\n\n`;
          
          items.forEach((component) => {
            response += `## ${component.name}\n`;
            response += `${component.description || "No description"}\n`;
            response += `- Props: ${Object.keys(component.props).length}\n`;
            response += `- Data Attributes: ${Object.keys(component.dataAttributes).length}\n`;
            response += `- CSS Variables: ${Object.keys(component.cssVariables).length}\n\n`;
          });
          
          response += `---\n\n`;
          response += `**Pagination:** Showing ${pagination.offset + 1}-${Math.min(pagination.offset + pagination.limit, pagination.total)} of ${pagination.total}\n`;
          if (pagination.hasMore) {
            response += `\n💡 Use \`offset: ${pagination.offset + pagination.limit}\` to see more results.\n`;
          }

          return {
            content: [
              {
                type: "text",
                text: response,
              },
            ],
          };
        }

        case "get_component": {
          // Validate and parse input
          const parsedArgs = GetComponentSchema.parse(args);
          const component = await getComponent(parsedArgs.name);

          if (!component) {
            return {
              content: [
                {
                  type: "text",
                  text: dedent`
                    Component "${parsedArgs.name}" not found.

                    💡 Try:
                    - Using search_components to find the component first
                    - Checking the spelling (e.g., "DialogRoot" not "Dialog-Root")
                    - Using list_components to see all available components
                  `,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: dedent`
                  # ${component.name}

                  ${component.description || "No description available."}

                  ## Props (${Object.keys(component.props).length})
                  ${JSON.stringify(component.props, null, 2)}

                  ## Data Attributes (${
                    Object.keys(component.dataAttributes).length
                  })
                  ${JSON.stringify(component.dataAttributes, null, 2)}

                  ## CSS Variables (${
                    Object.keys(component.cssVariables).length
                  })
                  ${JSON.stringify(component.cssVariables, null, 2)}
                `,
              },
            ],
          };
        }

        case "list_components": {
          // Validate and parse input
          const parsedArgs = ListComponentsSchema.parse(args);
          const components = await listComponents(parsedArgs.limit);

          return {
            content: [
              {
                type: "text",
                text: dedent`
                  # Base UI Components (${components.length} total)

                  ${components
                    .map(
                      (c) =>
                        `## ${c.name}\n${
                          c.description || "No description"
                        }\n- Props: ${
                          Object.keys(c.props).length
                        }\n- Data Attributes: ${
                          Object.keys(c.dataAttributes).length
                        }`
                    )
                    .join("\n\n")}
                `,
              },
            ],
          };
        }

        case "get_component_examples": {
          const parsedArgs = GetComponentExamplesSchema.parse(args);
          const examples = await getExamples(
            parsedArgs.name,
            parsedArgs.variant
          );

          if (
            examples.demos.length === 0 &&
            examples.inlineExamples.length === 0
          ) {
            return {
              content: [
                {
                  type: "text",
                  text: dedent`
                    No examples found for component "${parsedArgs.name}".

                    💡 Try:
                    - Checking the component name spelling
                    - Using search_components to find the correct name
                    - Some components may not have dedicated demos yet
                  `,
                },
              ],
            };
          }

          // Format the response with all examples
          let response = `# Examples for ${examples.componentName}\n\n`;

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

          return {
            content: [
              {
                type: "text",
                text: response,
              },
            ],
          };
        }

        case "get_specific_demo": {
          const parsedArgs = GetSpecificDemoSchema.parse(args);
          const demo = await getDemo(
            parsedArgs.componentName,
            parsedArgs.demoName,
            parsedArgs.variant
          );

          return {
            content: [
              {
                type: "text",
                text: dedent`
                  # ${demo.description} (${demo.variant})

                  \`\`\`${demo.language}
                  ${demo.code}
                  \`\`\`

                  ${
                    demo.cssCode
                      ? `## CSS\n\n\`\`\`css\n${demo.cssCode}\n\`\`\``
                      : ""
                  }
                `,
              },
            ],
          };
        }

        case "get_installation_guide": {
          const parsedArgs = GetInstallationGuideSchema.parse(args);
          const guide = await getInstallationGuide(parsedArgs.componentNames);

          return {
            content: [
              {
                type: "text",
                text: dedent`
                  # Installation Guide

                  ## Install ${guide.packageName}

                  **npm:**
                  \`\`\`bash
                  ${guide.installCommand.npm}
                  \`\`\`

                  **yarn:**
                  \`\`\`bash
                  ${guide.installCommand.yarn}
                  \`\`\`

                  **pnpm:**
                  \`\`\`bash
                  ${guide.installCommand.pnpm}
                  \`\`\`

                  ## Peer Dependencies

                  - React: ${guide.peerDependencies.react}
                  - React DOM: ${guide.peerDependencies.reactDom}

                  ## Import

                  ${guide.imports.join("\n")}

                  ## Basic Usage

                  \`\`\`jsx
                  ${guide.basicUsage}
                  \`\`\`

                  ${
                    guide.relatedComponents &&
                    guide.relatedComponents.length > 0
                      ? `## Related Components\n\n${guide.relatedComponents.join(
                          ", "
                        )}`
                      : ""
                  }

                  ## Styling

                  ${guide.cssSetup}
                `,
              },
            ],
          };
        }

        case "get_component_dependencies": {
          const parsedArgs = GetComponentDependenciesSchema.parse(args);
          const deps = await getComponentDependencies(parsedArgs.name);

          return {
            content: [
              {
                type: "text",
                text: dedent`
                  # Dependencies for ${deps.component}

                  ## Component Family
                  ${deps.componentFamily}

                  ## Peer Dependencies
                  ${JSON.stringify(deps.peerDependencies, null, 2)}

                  ## Related Components
                  ${deps.relatedComponents.join(", ")}

                  ## Required Parts
                  ${deps.requiredParts.join(", ")}

                  ## Optional Parts
                  ${deps.optionalParts.join(", ")}
                `,
              },
            ],
          };
        }

        case "get_setup_checklist": {
          GetSetupChecklistSchema.parse(args);
          const checklist = await getSetupChecklist();

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

          return {
            content: [
              {
                type: "text",
                text: response,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return {
          content: [
            {
              type: "text",
              text: dedent`
                Invalid input parameters:
                ${error.errors
                  .map((err) => `- ${err.path.join(".")}: ${err.message}`)
                  .join("\n")}
              `,
            },
          ],
          isError: true,
        };
      }

      // Handle custom BaseUI errors
      if (error instanceof BaseUIError) {
        let errorMessage = error.message;

        if (error.suggestion) {
          errorMessage += `\n\n💡 ${error.suggestion}`;
        }

        if (error.context) {
          errorMessage += `\n\nContext: ${JSON.stringify(
            error.context,
            null,
            2
          )}`;
        }

        return {
          content: [
            {
              type: "text",
              text: dedent`
                Error (${error.code}): ${errorMessage}
              `,
            },
          ],
          isError: true,
        };
      }

      // Handle unknown errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Unexpected error:", error);

      return {
        content: [
          {
            type: "text",
            text: dedent`
              Error: ${errorMessage}

              💡 If this persists, try restarting the server or check your internet connection.
            `,
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("MCP Server started successfully");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
