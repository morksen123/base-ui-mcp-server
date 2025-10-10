import { mergeMcpConfig, ensureDirectoryExists } from "@/utils/config-merger";
import { installPackage } from "@/utils/package-manager";
import { spinner } from "@/utils/spinner";
import { z } from "zod";

const PACKAGE_NAME = "base-ui-mcp-server";

const CLIENTS = [
  {
    name: "cursor",
    label: "Cursor",
    configPath: ".cursor/mcp.json",
    configKey: "mcpServers",
    configDir: ".cursor",
  },
  {
    name: "claude",
    label: "Claude Code",
    configPath: ".mcp.json",
    configKey: "mcpServers",
    configDir: null,
  },
  {
    name: "vscode",
    label: "VS Code",
    configPath: ".vscode/mcp.json",
    configKey: "servers", // VS Code uses "servers" not "mcpServers"
    configDir: ".vscode",
  },
  {
    name: "codex",
    label: "Codex",
    configPath: ".codex/config.toml",
    configKey: "mcp_servers",
    configDir: ".codex",
    isToml: true,
  },
] as const;

const mcpInitOptionsSchema = z.object({
  client: z.enum(["cursor", "claude", "vscode", "codex"]),
  cwd: z.string(),
});

export async function initMCP(args: string[]) {
  const clientArg = args.find((arg) => arg.startsWith("--client="));
  const client = clientArg?.split("=")[1] || "cursor";

  console.log(`🔧 Initializing Base UI MCP server for ${client}...`);

  // Validate options with zod schema
  let options;
  try {
    options = mcpInitOptionsSchema.parse({
      client,
      cwd: process.cwd(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid options:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }

  const clientInfo = CLIENTS.find((c) => c.name === options.client);
  // This should never happen since zod validates the client enum
  if (!clientInfo) {
    console.error(`❌ Unsupported client: ${options.client}`);
    console.log("Supported clients: cursor, claude, vscode, codex");
    process.exit(1);
  }

  try {
    // Install the package first
    const installSpinner = spinner(`Installing ${PACKAGE_NAME} package...`);
    installSpinner.start();
    await installPackage(PACKAGE_NAME, options.cwd);
    installSpinner.succeed("Package installed successfully");

    // Configure the client
    const configSpinner = spinner("Configuring MCP server...");
    configSpinner.start();

    if (clientInfo.name === "codex") {
      await initCodex();
    } else {
      await initJsonClient(clientInfo, options.cwd);
    }

    configSpinner.succeed();

    console.log("✅ MCP server initialized successfully!");
    console.log(
      `🎉 You can now use Base UI components with ${clientInfo.label}!`
    );
  } catch (error) {
    console.error("❌ Failed to initialize MCP server:", error);
    process.exit(1);
  }
}

async function initJsonClient(
  clientInfo: (typeof CLIENTS)[number],
  cwd: string
) {
  const configPath = `${cwd}/${clientInfo.configPath}`;

  // Ensure directory exists
  if (clientInfo.configDir) {
    await ensureDirectoryExists(`${cwd}/${clientInfo.configDir}`);
  }

  const newConfig = {
    [clientInfo.configKey]: {
      "base-ui": {
        command: "npx",
        args: [PACKAGE_NAME, "mcp"],
      },
    },
  };

  await mergeMcpConfig(configPath, newConfig);

  console.log(`📝 Updated ${clientInfo.configPath}`);
  console.log(`🔄 Restart ${clientInfo.label} to load the MCP server`);
}

async function initCodex() {
  console.log("📝 For Codex, add this to ~/.codex/config.toml:");
  console.log("");
  console.log(`[mcp_servers.base-ui]`);
  console.log(`command = "npx"`);
  console.log(`args = ["${PACKAGE_NAME}", "mcp"]`);
  console.log("");
  console.log("🔄 Restart Codex to load the MCP server");
}
