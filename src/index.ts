#!/usr/bin/env node

import { startServer } from "@/mcp/index";
import { initMCP } from "@/cli/init";

async function main() {
  const args = process.argv.slice(2);

  // Handle CLI commands
  if (args.length > 0) {
    const [command, ...params] = args;

    switch (command) {
      case "init":
        // Handle "init" command directly
        await initMCP(params);
        return;
      case "mcp":
        const subcommand = params[0];
        if (subcommand === "init") {
          await initMCP(params.slice(1));
          return;
        }
        break;
    }
  }

  // Default: start MCP server
  await startServer();
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
