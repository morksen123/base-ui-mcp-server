# Base UI MCP Server

An MCP (Model Context Protocol) server that provides AI assistants with direct access to Base UI React component information, documentation, and metadata.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## Overview

This MCP server enables AI assistants to seamlessly interact with the [Base UI](https://base-ui.com/react/overview/quick-start) component library, following the [shadcn MCP pattern](https://ui.shadcn.com/docs/mcp).

**4 Essential Tools:**

- 🔍 **search_components** - Find components by fuzzy matching
- 📦 **get_component_examples** - Get full code examples + component API
- 💿 **get_installation_guide** - Get install commands + imports + setup
- ✅ **get_setup_checklist** - Verify installation and troubleshoot

## Quick Start

### Installation

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

Configure your AI assistant by adding to MCP configuration:

```json
{
  "mcpServers": {
    "base-ui": {
      "command": "node",
      "args": ["/path/to/base-ui-mcp-server/dist/index.js"]
    }
  }
}
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

### get_installation_guide

Get install commands and setup instructions.

```json
{ "componentNames": ["DialogRoot", "DialogTrigger"] }
```

### get_setup_checklist

Verify Base UI setup and troubleshoot issues.

```json
{}
```

## Architecture

```
src/
├── index.ts                 # Server entry point
├── types.ts                 # Zod schemas
├── mcp/                     # MCP server implementation
│   ├── index.ts
│   ├── handlers.ts
│   └── utils.ts
├── config/                  # Configuration system
├── constants/               # Fallback data
├── errors/                  # Custom error classes
├── fetchers/                # GitHub API integration
├── tools/                   # Tool implementations
└── utils/                   # Utilities
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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Base UI](https://base-ui.com) - Component library by MUI
- [shadcn](https://ui.shadcn.com/docs/mcp) - MCP pattern reference
- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocol specification

---

**Built following the shadcn MCP pattern**
