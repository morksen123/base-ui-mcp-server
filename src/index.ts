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
} from "@/tools/component-tools";
import { getExamples } from "@/tools/examples-tools";
import {
  getInstallationGuide,
  getSetupChecklist,
} from "@/tools/installation-tools";

// Import schemas and errors
import {
  SearchComponentsSchema,
  GetComponentExamplesSchema,
  GetInstallationGuideSchema,
  GetSetupChecklistSchema,
} from "@/types";
import { BaseUIError } from "@/errors/registry-error";

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
            Returns components with relevance scores (0-1 scale where 1=perfect match).
            Use minScore to control match quality: 0.3=lenient, 0.7=strict (default), 0.9=near-exact.
            
            After finding a component, use get_component_examples to see full usage examples with code.
          `,
          inputSchema: zodToJsonSchema(SearchComponentsSchema),
        },
        {
          name: "get_component_examples",
          description: dedent`
            ⭐ MOST IMPORTANT: Get full, copy-pasteable code examples and demos for a component.
            Returns working demo code (both CSS Modules and Tailwind variants), component anatomy,
            inline examples, AND component metadata (props, data attributes, CSS variables).
            This is the complete resource for using a component.
          `,
          inputSchema: zodToJsonSchema(GetComponentExamplesSchema),
        },
        {
          name: "get_installation_guide",
          description: dedent`
            Get installation commands, required imports, peer dependencies, related components,
            and basic usage for one or more components. Includes npm/yarn/pnpm commands and setup instructions.
          `,
          inputSchema: zodToJsonSchema(GetInstallationGuideSchema),
        },
        {
          name: "get_setup_checklist",
          description: dedent`
            Get a comprehensive setup checklist for Base UI including installation verification,
            React version checks, TypeScript configuration, CSS setup, and common troubleshooting.
            Use this after adding components to verify everything is working correctly.
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
            response += `- Data Attributes: ${
              Object.keys(component.dataAttributes).length
            }\n`;
            response += `- CSS Variables: ${
              Object.keys(component.cssVariables).length
            }\n\n`;
          });

          response += `---\n\n`;
          response += `**Pagination:** Showing ${
            pagination.offset + 1
          }-${Math.min(
            pagination.offset + pagination.limit,
            pagination.total
          )} of ${pagination.total}\n`;
          if (pagination.hasMore) {
            response += `\n💡 Use \`offset: ${
              pagination.offset + pagination.limit
            }\` to see more results.\n`;
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

          // Format the response with all examples and component metadata
          let response = `# ${examples.componentName}\n\n`;

          // Add component metadata if available
          if (examples.component) {
            response += `${examples.component.description || "No description available."}\n\n`;
            response += `**Renders:** ${examples.component.renders || "Doesn't render its own HTML element"}\n\n`;
            response += `- **Props:** ${Object.keys(examples.component.props).length}\n`;
            response += `- **Data Attributes:** ${Object.keys(examples.component.dataAttributes).length}\n`;
            response += `- **CSS Variables:** ${Object.keys(examples.component.cssVariables).length}\n\n`;
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

          // Add detailed component API if available
          if (examples.component) {
            response += `---\n\n## Component API\n\n`;
            
            if (Object.keys(examples.component.props).length > 0) {
              response += `### Props (${Object.keys(examples.component.props).length})\n\n`;
              response += `\`\`\`json\n${JSON.stringify(examples.component.props, null, 2)}\n\`\`\`\n\n`;
            }

            if (Object.keys(examples.component.dataAttributes).length > 0) {
              response += `### Data Attributes (${Object.keys(examples.component.dataAttributes).length})\n\n`;
              response += `\`\`\`json\n${JSON.stringify(examples.component.dataAttributes, null, 2)}\n\`\`\`\n\n`;
            }

            if (Object.keys(examples.component.cssVariables).length > 0) {
              response += `### CSS Variables (${Object.keys(examples.component.cssVariables).length})\n\n`;
              response += `\`\`\`json\n${JSON.stringify(examples.component.cssVariables, null, 2)}\n\`\`\`\n\n`;
            }
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
