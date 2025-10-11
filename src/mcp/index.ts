import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import dedent from "dedent";

import {
  SearchComponentsSchema,
  GetComponentExamplesSchema,
  GetSetupChecklistSchema,
} from "@/schema";
import {
  handleSearchComponents,
  handleGetComponentExamples,
  handleGetSetupChecklist,
} from "./handlers";
import { handleError } from "@/utils/handle-error";
import { getConfig } from "@/config";

export function createServer() {
  const config = getConfig();

  const server = new Server(
    {
      name: config.server.name,
      version: config.server.version,
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_components",
          description: dedent`
            Find components using fuzzy matching on names, descriptions, and props.

            Example: { "query": "dialog" }
            Advanced: { "query": "form", "limit": 5, "minScore": 0.7 }

            Returns: Component names, descriptions, and API counts.
            Tip: Use results with get_component_examples to see full usage.
          `,
          inputSchema: zodToJsonSchema(SearchComponentsSchema),
        },
        {
          name: "get_component_examples",
          description: dedent`
            ⭐ Get complete working code + full API reference in one call.

            Example: { "name": "DialogRoot" }
            With variant: { "name": "AccordionRoot", "variant": "css-modules" }

            Returns: Demos (TSX+CSS), anatomy, props, data attributes, CSS variables.
            Tip: Use exact component names (e.g., DialogRoot, not Dialog).
          `,
          inputSchema: zodToJsonSchema(GetComponentExamplesSchema),
        },
        {
          name: "get_setup_checklist",
          description: dedent`
            Verify your Base UI setup and troubleshoot issues.

            Example: {}

            Returns: Installation verification, React version check, troubleshooting.
            Use after adding components to verify everything works.
          `,
          inputSchema: zodToJsonSchema(GetSetupChecklistSchema),
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      if (!request.params.arguments) {
        throw new Error("No tool arguments provided.");
      }

      const { name, arguments: args } = request.params;

      console.error(`Tool called: ${name}`, args);

      switch (name) {
        case "search_components":
          return await handleSearchComponents(args);

        case "get_component_examples":
          return await handleGetComponentExamples(args);

        case "get_setup_checklist":
          return await handleGetSetupChecklist(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return handleError(error);
    }
  });

  return server;
}

export async function startServer() {
  const config = getConfig();
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `${config.server.name} MCP server v${config.server.version} running on stdio`
  );
}
