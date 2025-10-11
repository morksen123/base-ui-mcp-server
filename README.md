# Base UI MCP Server

An MCP (Model Context Protocol) server that provides AI assistants with direct access to Base UI React component information, documentation, and metadata.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## Overview

This MCP server enables AI assistants to seamlessly interact with the [Base UI](https://base-ui.com/react/overview/quick-start) component library, following the [shadcn MCP pattern](https://ui.shadcn.com/docs/mcp).

**5 Essential Tools:**

- 🔍 **search_components** - Find components by fuzzy matching
- 📦 **get_component_examples** - Get full code examples + component API
- 💿 **install_base_ui** - Get install commands + setup instructions
- ✅ **get_setup_checklist** - Verify installation and troubleshoot
- 🛠️ **Easy Setup** - One command integration with Cursor

## Quick Start

### 🚀 One-Command Setup (Recommended)

For **Cursor**, **Claude Code**, **VS Code**, or **Codex**:

```bash
npx base-ui-mcp-server@latest init --client cursor
```

This automatically creates the correct MCP configuration file for your editor with **zod validation** and **smart error handling**.

### Manual Installation

```bash
git clone https://github.com/morksen123/base-ui-mcp-server.git
cd base-ui-mcp-server
npm install
npm run build
```

### Usage

#### Standalone Server

```bash
npm run dev   # Development mode
npm start     # Production mode
```

#### MCP Inspector

```bash
npm run mcp:inspect
```

#### With AI Assistants

The MCP server is automatically configured when using the CLI command above.

**Manual configuration:**

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

## Integration

### Cursor

**One-command setup:**

```bash
npx base-ui-mcp-server@latest init --client cursor
```

This creates `.cursor/mcp.json` with the proper configuration using **zod validation** and **configuration merging**. Restart Cursor and you're ready to use Base UI components!

[📖 Full Cursor Documentation](docs/integration/cursor.md)

### Claude Code

```bash
npx base-ui-mcp-server@latest init --client claude
```

### VS Code

```bash
npx base-ui-mcp-server@latest init --client vscode
```

### Codex

```bash
npx base-ui-mcp-server@latest init --client codex
```

## Available Tools

### search_components

Find components using fuzzy matching.

```json
{ "query": "dialog", "limit": 10 }
```

### get_component_examples

Get complete working code + full API reference.

```json
{ "name": "DialogRoot", "variant": "css-modules" }
```

### install_base_ui

Get installation commands and setup instructions for Base UI.

```json
{ "runCommand": false }
```

### get_setup_checklist

Verify Base UI setup and troubleshoot issues.

```json
{}
```

## Architecture

Built with **zod validation**, **configuration merging**, and **smart error handling**:

```
src/
├── index.ts                 # Server entry point & CLI
├── cli/
│   └── init.ts              # MCP client integration (Cursor, VS Code, etc.)
├── mcp/                     # MCP server implementation
│   ├── index.ts             # Server setup & tool definitions
│   ├── handlers.ts          # Tool request handlers
│   └── utils.ts             # MCP utilities
├── config/                  # Configuration system
│   ├── index.ts             # Config loading & validation
│   └── schema.ts            # Zod schemas for config
├── constants.ts             # Fallback data & constants
├── errors/                  # Custom error classes
├── fetchers/                # GitHub API integration
├── tools/                   # Tool implementations
└── utils/                   # Utilities (spinner, package manager, etc.)
```

## Development

```bash
npm run dev        # Auto-rebuild
npm run build      # Build TypeScript
npm test           # Run tests
npm run typecheck  # Type checking
```

## Testing

Tests are colocated with source files following shadcn pattern:

```bash
npm test                                         # Run all tests (87 tests)
npm test -- src/fetchers/github-fetcher.test.ts  # Run specific test
```

**Test Coverage:**

- 87 tests across 5 test suites
- MCP Handlers: 564 lines (26 tests)
- GitHub Fetcher: 473 lines (16 tests)
- Config System: 223 lines (17 tests)
- Search Utils: 283 lines (11 tests)
- Fetch JSON: 355 lines (17 tests)
- **Total:** 1,898 lines of tests

## Environment Variables

### GitHub Token (Recommended)

For higher rate limits when fetching component data:

```bash
export GITHUB_TOKEN=your_github_token_here
```

### HTTP Proxy

For network requests behind a proxy:

```bash
export https_proxy=http://your-proxy-server:8080
```

## Advanced Configuration

### Multiple Registries

Configure additional component registries in your project's `components.json`:

```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json",
    "@base-ui": "https://base-ui.com/r/{name}.json"
  }
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Base UI](https://base-ui.com) - Component library by MUI
- [shadcn/ui](https://ui.shadcn.com/docs/mcp) - MCP pattern reference and inspiration
- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocol specification

---

**Built following the shadcn MCP pattern**
