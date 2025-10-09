#!/usr/bin/env node

import { startServer } from "@/mcp/index";

/**
 * Main entry point for the Base UI MCP Server
 * Simplified to just start the server - all logic moved to @/mcp/
 */
async function main() {
  await startServer();
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
