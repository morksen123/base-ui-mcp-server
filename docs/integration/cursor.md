# Cursor Integration

Integrate Base UI MCP Server with Cursor to browse, search, and get examples for Base UI components using natural language.

## Quick Start

### 1. Install and Configure

Run the following command in your project:

```bash
npx base-ui-mcp-server@latest init --client cursor
```

This will create `.cursor/mcp.json` with the proper configuration using **zod validation** and **configuration merging**.

### 2. Restart Cursor

Restart Cursor to load the MCP server. You should see a green dot next to "base-ui" in the MCP server list.

### 3. Start Using Base UI

Try these example prompts:

- **Browse Components**: "Show me all available Base UI components"
- **Search Components**: "Find me a dialog component"
- **Get Examples**: "Show me how to use the DialogRoot component"
- **Install Instructions**: "How do I install Base UI?"
- **Setup Help**: "Verify my Base UI setup"

## What You Get

The Base UI MCP Server provides AI assistants with direct access to:

- **🔍 Search Components** - Find components by fuzzy matching on names, descriptions, and props
- **📦 Get Examples** - Complete working code + full API reference in one call
- **💿 Install Instructions** - Get install commands and setup instructions
- **✅ Setup Verification** - Verify installation and troubleshoot issues

## Configuration

The MCP server is configured automatically with **zod validation** and **configuration merging**, but you can customize it by editing `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "base-ui": {
      "command": "npx",
      "args": ["base-ui-mcp-server", "mcp"]
    }
  }
}
```

## Features

### Zod Validation

The CLI uses **zod schema validation** to ensure proper configuration:

- **Input validation** - Validates client names and options before processing
- **Clear error messages** - Provides user-friendly error messages for invalid inputs
- **Type safety** - Runtime validation matches TypeScript types

### Configuration Merging

The MCP server **merges with existing configurations** instead of overwriting them:

- **Preserves existing MCP servers** - Other MCP servers in your config remain intact
- **Safe updates** - Won't break existing MCP setups
- **Backward compatible** - Works with existing `.cursor/mcp.json` files

### Smart Error Handling

Enhanced error handling provides better debugging information:

- **Validation errors** show expected values and clear messages
- **Network errors** include troubleshooting steps
- **Installation errors** provide specific guidance

## Environment Variables

For private registries or enhanced functionality, set these environment variables:

```bash
# GitHub token for increased rate limits
export GITHUB_TOKEN=your_github_token

# HTTP proxy for network requests
export https_proxy=http://your-proxy:8080
```

## Available Tools

### search_components

Find Base UI components using fuzzy matching.

```json
{
  "query": "dialog",
  "limit": 10,
  "minScore": 0.7,
  "includeProps": true
}
```

### get_component_examples

Get complete working code examples and API documentation.

```json
{
  "name": "DialogRoot",
  "variant": "css-modules"
}
```

### install_base_ui

Get installation commands and setup instructions.

```json
{
  "runCommand": false
}
```

### get_setup_checklist

Verify your Base UI setup and troubleshoot issues.

```json
{}
```

## Troubleshooting

### MCP Server Not Responding

1. **Check Configuration** - Verify `.cursor/mcp.json` exists and is valid JSON
2. **Restart Cursor** - Restart Cursor after configuration changes
3. **Check Logs** - View MCP logs in Cursor: View → Output → MCP: project-\*
4. **Network Issues** - Ensure you can access GitHub (may need proxy configuration)
5. **Validation Errors** - If you see zod validation errors, check that you're using a supported client: `cursor`, `claude`, `vscode`, or `codex`

### Component Loading Issues

1. **Check Network** - Verify internet connection and proxy settings
2. **GitHub Access** - Ensure you can access `github.com`
3. **Rate Limits** - Consider setting `GITHUB_TOKEN` for higher rate limits

### Installation Issues

1. **Check Project Setup** - Ensure you have a valid project with `package.json`
2. **Verify Package Manager** - Make sure npm/yarn/pnpm is available
3. **Check Permissions** - Ensure write permissions for `node_modules`
4. **Zod Validation** - The CLI validates inputs using zod schemas - ensure you're using supported client names

## Advanced Configuration

### Multiple Registries

The MCP server supports multiple component registries. Configure them in your project's `components.json`:

```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json",
    "@base-ui": "https://base-ui.com/r/{name}.json"
  }
}
```

### Private Registries

For private registries requiring authentication:

```bash
export REGISTRY_TOKEN=your_private_token
```

## Examples

### Browse Components

```
Show me all available components in Base UI
```

### Search Specific Components

```
Find me a form input component
```

### Get Code Examples

```
Show me how to use the Button component with Tailwind CSS
```

### Install Components

```
How do I install Base UI in my React project?
```

### Setup Verification

```
Verify my Base UI setup is working correctly
```

## Learn More

- [Base UI Documentation](https://base-ui.com/react/overview/quick-start)
- [MCP Specification](https://modelcontextprotocol.io/)
- [GitHub Repository](https://github.com/morksen123/base-ui-mcp-server)

---

**Built for Base UI React components**
