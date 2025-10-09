#!/usr/bin/env node

import { startServer } from "@/mcp/index";

async function main() {
  await startServer();
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
