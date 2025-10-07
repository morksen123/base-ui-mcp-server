#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dedent from 'dedent';

// Import our tools
import { searchComponents, getComponent, listComponents } from './tools/component-tools.js';

// Import schemas and errors
import { SearchComponentsSchema, GetComponentSchema, ListComponentsSchema } from './types.js';
import { BaseUIError } from './errors/registry-error.js';

async function main() {
  const server = new Server(
    {
      name: 'base-ui',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'search_components',
          description: dedent`
            Search Base UI components by name or description using fuzzy matching.
            Returns components with relevance scores.
          `,
          inputSchema: zodToJsonSchema(SearchComponentsSchema),
        },
        {
          name: 'get_component',
          description: dedent`
            Get detailed information about a specific Base UI component including props,
            data attributes, and CSS variables. Use the exact component name (e.g., 'Input', 'DialogRoot').
          `,
          inputSchema: zodToJsonSchema(GetComponentSchema),
        },
        {
          name: 'list_components',
          description: dedent`
            List all available Base UI components with pagination support.
            Use this to browse all components in the library.
          `,
          inputSchema: zodToJsonSchema(ListComponentsSchema),
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      if (!request.params.arguments) {
        throw new Error('No tool arguments provided.');
      }

      const { name, arguments: args } = request.params;

      // Log the tool call for debugging
      console.error(`Tool called: ${name}`, args);

      switch (name) {
        case 'search_components': {
          // Validate and parse input
          const parsedArgs = SearchComponentsSchema.parse(args);
          const results = await searchComponents(parsedArgs.query, parsedArgs.limit, {
            minScore: parsedArgs.minScore,
            includeProps: parsedArgs.includeProps,
            includeDataAttributes: parsedArgs.includeDataAttributes,
          });

          if (results.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: dedent`
                    No components found matching "${parsedArgs.query}".

                    💡 Try:
                    - Using a different search term
                    - Searching for partial matches (e.g., "dial" for Dialog)
                    - Using list_components to see all available components
                  `,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    query: parsedArgs.query,
                    resultsCount: results.length,
                    components: results.map((c) => ({
                      name: c.name,
                      description: c.description,
                      propsCount: Object.keys(c.props).length,
                      dataAttributesCount: Object.keys(c.dataAttributes).length,
                    })),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case 'get_component': {
          // Validate and parse input
          const parsedArgs = GetComponentSchema.parse(args);
          const component = await getComponent(parsedArgs.name);

          if (!component) {
            return {
              content: [
                {
                  type: 'text',
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
                type: 'text',
                text: dedent`
                  # ${component.name}

                  ${component.description || 'No description available.'}

                  ## Props (${Object.keys(component.props).length})
                  ${JSON.stringify(component.props, null, 2)}

                  ## Data Attributes (${Object.keys(component.dataAttributes).length})
                  ${JSON.stringify(component.dataAttributes, null, 2)}

                  ## CSS Variables (${Object.keys(component.cssVariables).length})
                  ${JSON.stringify(component.cssVariables, null, 2)}
                `,
              },
            ],
          };
        }

        case 'list_components': {
          // Validate and parse input
          const parsedArgs = ListComponentsSchema.parse(args);
          const components = await listComponents(parsedArgs.limit);

          return {
            content: [
              {
                type: 'text',
                text: dedent`
                  # Base UI Components (${components.length} total)

                  ${components
                    .map(
                      (c) =>
                        `## ${c.name}\n${c.description || 'No description'}\n- Props: ${Object.keys(c.props).length}\n- Data Attributes: ${Object.keys(c.dataAttributes).length}`,
                    )
                    .join('\n\n')}
                `,
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
              type: 'text',
              text: dedent`
                Invalid input parameters:
                ${error.errors.map((err) => `- ${err.path.join('.')}: ${err.message}`).join('\n')}
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
          errorMessage += `\n\nContext: ${JSON.stringify(error.context, null, 2)}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: dedent`
                Error (${error.code}): ${errorMessage}
              `,
            },
          ],
          isError: true,
        };
      }

      // Handle unknown errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Unexpected error:', error);

      return {
        content: [
          {
            type: 'text',
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

  console.error('MCP Server started successfully');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
