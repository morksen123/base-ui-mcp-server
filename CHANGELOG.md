# Changelog

All notable changes to the Base UI MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.2] - 2025-10-10

### Added - Initial Beta Release

**🚀 Complete Base UI MCP Server**

- **5 Essential MCP Tools:**

  - 🔍 `search_components` - Find Base UI components by fuzzy matching
  - 📦 `get_component_examples` - Get complete working code examples + full API documentation
  - 💿 `get_setup_checklist` - Verify Base UI setup and troubleshoot issues
  - 🛠️ **One-Command Setup** - `npx base-ui-mcp init --client cursor` for instant integration

- **GitHub Integration:**

  - Component data fetching from Base UI repository
  - GitHub token support (`--github-token`) for 5000 requests/hour
  - HTTP proxy support (`--proxy`) for enterprise environments

- **shadcn-Compatible CLI:**

  - `npx base-ui-mcp` - Start MCP server with options
  - `npx base-ui-mcp init --client cursor` - Auto-setup for Cursor
  - `npx base-ui-mcp init --client claude` - Setup for Claude Code
  - `npx base-ui-mcp init --client vscode` - Setup for VS Code

- **Production Ready:**
  - ✅ 87 passing tests across 5 test suites
  - ✅ Complete Zod-first type safety
  - ✅ Enterprise proxy and authentication support
  - ✅ Multi-client MCP compatibility

### Technical Features

- **TypeScript & Zod-First Architecture** - Runtime validation and complete type safety
- **Multi-Client Support** - Cursor, Claude Code, VS Code, Codex integration
- **Environment Variables** - GitHub tokens and HTTP proxy configuration
- **Error Handling** - Comprehensive error management and logging
- **Performance Optimized** - Efficient component search and caching
