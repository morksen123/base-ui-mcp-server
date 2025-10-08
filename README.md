# Base UI MCP Server

An MCP (Model Context Protocol) server that provides AI assistants with direct access to Base UI React component information, documentation, and metadata.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## 🎯 Overview

This MCP server enables AI assistants to seamlessly interact with the [Base UI](https://base-ui.com/react/overview/quick-start) component library with **action-oriented tools** following the [shadcn MCP pattern](https://ui.shadcn.com/docs/mcp).

**4 Essential Tools:**

- 🔍 **search_components** - Find components by fuzzy matching
- 📦 **get_component_examples** - Get full code examples + component API
- 💿 **get_installation_guide** - Get install commands + imports + setup
- ✅ **get_setup_checklist** - Verify installation and troubleshoot

**Key Features:**

- ⚡ **Performance** - In-memory promise-based caching
- 🛡️ **Type Safety** - Full Zod validation and TypeScript support
- 💬 **Helpful Errors** - Clear messages with actionable suggestions
- 🎯 **Action-Oriented** - Every tool provides immediately actionable results

## ✨ Features

### Advanced Search

- Fuzzy matching for partial queries
- Multi-field search (name, description, props, data attributes)
- Relevance ranking with weighted scoring
- Case-insensitive matching

### Component Information

- Complete prop definitions with types and defaults
- Data attributes for styling and state
- CSS variables for theming
- Component descriptions and documentation

### Developer Experience

- Comprehensive error handling
- Input validation with helpful messages
- Caching for optimal performance
- TypeScript-first development

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/morksen123/base-ui-mcp-server.git
cd base-ui-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Usage

#### As a Standalone Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

#### With MCP Inspector

Test the server interactively using the MCP Inspector:

```bash
npm run mcp:inspect
```

This will open a web interface where you can test all available tools.

#### With AI Assistants

Configure your AI assistant to use the MCP server by adding it to your MCP configuration file:

```json
{
  "mcpServers": {
    "base-ui": {
      "command": "node",
      "args": ["/path/to/mcp/dist/index.js"]
    }
  }
}
```

## 📖 Available Tools

### 1. `search_components` 🔍

Find components using fuzzy matching on names, descriptions, and props.

**Use when:** "I need a component for modals" or "What components handle forms?"

**Quick start:**

```json
{
  "query": "dialog"
}
```

**With options:**

```json
{
  "query": "form input",
  "limit": 5
}
```

<details>
<summary>All parameters</summary>

- `query` (string, required): Search term
- `limit` (number): Max results (default: 10, max: 100)
- `offset` (number): Skip N items for pagination
- `minScore` (number): Match threshold 0-1 (default: 0.7)

</details>

**Returns:** Component names, descriptions, and API counts (props/attributes).

---

### 2. `get_component_examples` 📦 ⭐ MOST IMPORTANT

Get complete working code + full API reference in one call.

**Use when:** "Show me how to use Dialog" or "I need Dialog's full API"

**Quick start:**

```json
{
  "name": "DialogRoot"
}
```

**With styling preference:**

```json
{
  "name": "AccordionRoot",
  "variant": "css-modules"
}
```

<details>
<summary>All parameters</summary>

- `name` (string, required): Exact component name (e.g., "DialogRoot", "Input")
- `variant` (enum): Filter demos: `"css-modules"` or `"tailwind"`

</details>

**Returns:**

- Component description & what it renders
- Anatomy (how parts fit together)
- Full demo code (TSX + CSS) - copy-paste ready
- All props, data attributes, CSS variables with types

**💡 Tip:** Use exact names from search results (e.g., `DialogRoot` not `Dialog`).

---

### 3. `get_installation_guide` 💿

Get install commands, imports, and setup instructions.

**Use when:** "How do I install Dialog?" or "What imports do I need?"

**Single component:**

```json
{
  "componentNames": ["DialogRoot"]
}
```

**Multiple components:**

```json
{
  "componentNames": ["DialogRoot", "DialogTrigger", "DialogPopup"]
}
```

<details>
<summary>All parameters</summary>

- `componentNames` (string[], required): Array of exact component names

</details>

**Returns:**

- `npm install` commands (+ yarn/pnpm)
- React version requirements
- Import statements
- Basic usage example
- Related components in the family

**💡 Tip:** Use exact names (e.g., `DialogRoot`, not `Dialog`). For compound components, list all parts you need.

---

### 4. `get_setup_checklist` ✅

Verify your Base UI setup and troubleshoot issues.

**Use when:** "Components aren't working" or "Is my setup correct?"

**Usage:**

```json
{}
```

**Returns:**

- Installation verification
- React version check
- TypeScript config guide
- CSS setup instructions
- Common issues & solutions

## 🏗️ Architecture

```
mcp/
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── types.ts                 # TypeScript types and Zod schemas
│   ├── errors/
│   │   └── registry-error.ts    # Custom error classes
│   ├── fetchers/
│   │   └── github-fetcher.ts    # GitHub API integration
│   ├── tools/
│   │   └── component-tools.ts   # Tool implementations
│   └── utils/
│       └── search-utils.ts      # Search algorithms
├── test-milestone*.js           # Test suites
└── dist/                        # Compiled output
```

## 🧪 Testing

The project includes comprehensive test suites for all milestones:

```bash
# Run all milestone tests
npm run build && node test-milestone1.js
npm run build && node test-milestone2.js
npm run build && node test-milestone3.js
npm run build && node test-milestone4.js
```

### Test Coverage

- ✅ **Milestone 1**: Basic MCP server (3/3 tests)
- ✅ **Milestone 2**: Component data fetching (3/3 tests)
- ✅ **Milestone 3**: Enhanced search (5/5 tests, 100% accuracy)
- ✅ **Milestone 4**: Error handling (5/5 tests)

## 🎨 Component Families

Base UI components are organized into families:

- **Dialog**: DialogRoot, DialogTrigger, DialogPopup, DialogClose, etc.
- **Menu**: MenuRoot, MenuTrigger, MenuPopup, MenuItem, etc.
- **Field**: FieldRoot, FieldLabel, FieldControl, FieldError, etc.
- **Input**: Input (standalone)
- **Alert Dialog**: AlertDialogRoot, AlertDialogTrigger, etc.
- **Accordion**: AccordionRoot, AccordionItem, AccordionTrigger, etc.
- And many more...

## 🔧 Development

### Scripts

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Run MCP Inspector
npm run mcp:inspect
```

### Project Structure

- **Modular Design**: Separate concerns (fetching, search, tools)
- **Type Safety**: Full TypeScript with Zod validation
- **Error Handling**: Custom error classes with helpful messages
- **Performance**: In-memory caching with TTL
- **Testing**: Comprehensive test coverage

## 🐛 Error Handling

The server provides helpful error messages with actionable suggestions:

### Input Validation Errors

```
Invalid input parameters:
- query: Query must not be empty
- limit: Number must be less than or equal to 100
```

### Component Not Found

```
Component "NonExistent" not found.

💡 Try:
- Using search_components to find the component first
- Checking the spelling (e.g., "DialogRoot" not "Dialog-Root")
- Using list_components to see all available components
```

### Network Errors

```
Error (FETCH_ERROR): Failed to fetch from GitHub

💡 Check your internet connection and try again.
```

## 📊 Performance

- **Caching**: 1-hour TTL for component data
- **Parallel Fetching**: Multiple components fetched simultaneously
- **Lazy Loading**: Components loaded on-demand
- **Efficient Search**: Optimized fuzzy matching algorithms

## 🤝 Contributing

Contributions are welcome! This project follows incremental development with clear milestones.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Coding Standards

- Follow TypeScript best practices
- Use Zod for validation
- Add tests for new features
- Follow the existing code style
- Run `npm run lint` before committing

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Base UI](https://base-ui.com/react/overview/about) - The component library by MUI
- [shadcn](https://ui.shadcn.com/docs/mcp) - MCP pattern inspiration
- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocol specification

## 🔗 Related Links

- [Base UI Documentation](https://base-ui.com/react/overview/quick-start)
- [Base UI GitHub Repository](https://github.com/mui/base-ui)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [shadcn MCP Documentation](https://ui.shadcn.com/docs/mcp)

## 📞 Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check existing issues for similar problems
- Provide clear reproduction steps

---

**Built with ❤️ following the shadcn MCP pattern**
