# Contributing to Base UI MCP Server

Thank you for your interest in contributing!

## Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm

### Getting Started

```bash
git clone https://github.com/morksen123/base-ui-mcp-server.git
cd base-ui-mcp-server
npm install
npm run build
npm test  # 87 tests should pass
```

## Project Structure

```
src/
├── index.ts                    # Server entry point
├── types.ts                    # Zod schemas
├── mcp/                        # MCP implementation
│   ├── index.ts
│   ├── handlers.ts
│   └── utils.ts
├── config/                     # Configuration
├── errors/                     # Custom errors
├── fetchers/                   # GitHub API
├── tools/                      # Tool logic
└── utils/                      # Utilities
```

## Coding Standards

- TypeScript strict mode
- Zod for validation
- Custom error classes
- Tests colocated with source

## Testing

```bash
npm test                                         # Run all tests (87 tests)
npm test -- src/fetchers/github-fetcher.test.ts  # Run specific test
npm test -- --watch                              # Watch mode
```

**Writing Tests:**

Tests are colocated with source files (`.test.ts` extension) following shadcn pattern:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { myFunction } from "./my-module";

describe("myFunction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle valid input", () => {
    expect(myFunction("test")).toBe("expected");
  });

  it("should throw on invalid input", () => {
    expect(() => myFunction("")).toThrow();
  });
});
```

## Pull Request Process

1. Run tests: `npm test`
2. Type check: `npm run typecheck`
3. Build: `npm run build`
4. Submit PR with clear description

## Adding New Features

### New Tool

1. Define schema in `src/types.ts`
2. Implement handler in `src/mcp/handlers.ts`
3. Register in `src/mcp/index.ts`
4. Add tests colocated with source

### New Error Type

1. Define in `src/errors/registry-error.ts`
2. Extend `BaseUIError`
3. Include helpful suggestions

## Code Style

Follow existing patterns:

- Minimal comments (self-documenting code)
- Clear function/variable names
- Error handling with custom classes
- Zod validation

## Getting Help

- Open an issue on [GitHub](https://github.com/morksen123/base-ui-mcp-server/issues)
- Reference [shadcn MCP docs](https://ui.shadcn.com/docs/mcp)
- Check [MCP specification](https://modelcontextprotocol.io/)

## License

By contributing, you agree your contributions will be licensed under MIT License.
