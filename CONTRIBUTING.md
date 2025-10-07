# Contributing to Base UI MCP Server

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or pnpm
- Git

### Getting Started

1. **Fork and Clone**

   ```bash
   git clone https://github.com/yourusername/mcp.git
   cd mcp
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build the Project**

   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test -- --run
   ```

## Project Structure

```
base-ui-mcp-server/
├── src/
│   ├── index.ts                        # Main server entry point
│   ├── types.ts                        # TypeScript types and Zod schemas
│   ├── constants/                      # Constants and fallback data
│   │   └── fallback-components.ts
│   ├── errors/                         # Custom error classes
│   │   └── registry-error.ts
│   ├── fetchers/                       # GitHub and examples fetching
│   │   ├── github-fetcher.ts
│   │   ├── github-fetcher.test.ts     # Tests colocated with source
│   │   └── examples-fetcher.ts
│   ├── tools/                          # MCP tool implementations
│   │   ├── component-tools.ts
│   │   ├── component-tools.test.ts    # Tests colocated with source
│   │   ├── examples-tools.ts
│   │   └── installation-tools.ts
│   └── utils/                          # Utility functions
│       ├── search-utils.ts
│       └── search-utils.test.ts       # Tests colocated with source
└── dist/                               # Compiled output (generated)
```

> **Note**: Following shadcn's pattern, test files are colocated with their source files for better maintainability.

## Coding Standards

### TypeScript

- Use strict TypeScript settings
- Define proper types for all functions
- Avoid `any` type unless absolutely necessary
- Use Zod schemas for validation

### Code Style

- Follow existing code formatting
- Use ESLint for linting
- Use Prettier for formatting (if configured)
- Maximum line length: 100 characters

### Naming Conventions

- **Files**: kebab-case (e.g., `github-fetcher.ts`)
- **Classes**: PascalCase (e.g., `BaseUIError`)
- **Functions**: camelCase (e.g., `searchComponents`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `CACHE_TTL`)

### Error Handling

Always use custom error classes from `src/errors/`:

```typescript
throw new ComponentNotFoundError("Button", {
  suggestion: "Try searching for the component first",
});
```

### Validation

Use Zod schemas for all input validation:

```typescript
const MySchema = z.object({
  name: z.string().min(1, "Name must not be empty"),
  limit: z.number().int().positive().max(100),
});

const parsed = MySchema.parse(input);
```

## Testing

### Running Tests

```bash
# Run all tests
npm test -- --run

# Run tests in watch mode
npm run test:watch

# Run specific test file (tests are colocated with source)
npm test -- src/utils/search-utils.test.ts --run
npm test -- src/fetchers/github-fetcher.test.ts --run
npm test -- src/tools/component-tools.test.ts --run
```

### Writing Tests

**Test Colocation Pattern (following shadcn):**

Tests are colocated with their source files:

- `src/utils/search-utils.ts` → `src/utils/search-utils.test.ts`
- `src/fetchers/github-fetcher.ts` → `src/fetchers/github-fetcher.test.ts`
- `src/tools/component-tools.ts` → `src/tools/component-tools.test.ts`

When adding new features:

1. Create test file next to source file with `.test.ts` extension
2. Add tests that verify the feature works
3. Add tests for error conditions
4. Ensure test coverage for edge cases
5. Follow existing test patterns

Example test structure using Vitest:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { newFeature } from "./new-feature.js"; // Relative import

describe("New Feature", () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it("should work correctly", () => {
    // Arrange
    const input = "test input";

    // Act
    const result = newFeature(input);

    // Assert
    expect(result).toBe("expected output");
  });

  it("should handle errors gracefully", () => {
    // Test error conditions
    expect(() => newFeature("")).toThrow("Error message");
  });
});
```

## Pull Request Process

### Before Submitting

1. **Run Tests**: Ensure all tests pass

   ```bash
   npm test -- --run
   ```

2. **Check Types**: Verify TypeScript compilation

   ```bash
   npm run type-check
   ```

3. **Lint Code**: Fix any linting issues

   ```bash
   npm run lint
   ```

4. **Update Documentation**: Update README.md if needed

### Submitting a PR

1. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

   Use conventional commit messages:

   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `refactor:` Code refactoring
   - `test:` Test additions/changes
   - `chore:` Maintenance tasks

3. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request**
   - Provide a clear description
   - Reference any related issues
   - Include test results
   - Add screenshots if applicable

### PR Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged

## Adding New Features

### Adding a New Tool

1. **Define the Schema** (`src/types.ts`)

   ```typescript
   export const NewToolSchema = z.object({
     param: z.string().describe("Parameter description"),
   });
   ```

2. **Implement the Tool** (`src/tools/component-tools.ts`)

   ```typescript
   export async function newTool(param: string): Promise<Result> {
     // Implementation
   }
   ```

3. **Register the Tool** (`src/index.ts`)

   ```typescript
   server.setRequestHandler(ListToolsRequestSchema, async () => {
     return {
       tools: [
         // ... existing tools
         {
           name: "new_tool",
           description: "Tool description",
           inputSchema: zodToJsonSchema(NewToolSchema),
         },
       ],
     };
   });
   ```

4. **Handle Tool Calls** (`src/index.ts`)

   ```typescript
   case 'new_tool': {
     const parsed = NewToolSchema.parse(args);
     const result = await newTool(parsed.param);
     return { content: [{ type: 'text', text: JSON.stringify(result) }] };
   }
   ```

5. **Add Tests**
   - Create test file colocated with the new feature (e.g., `src/tools/new-tool.test.ts`)
   - Test success cases
   - Test error cases
   - Test edge cases
   - Use Vitest's `describe`, `it`, and `expect` APIs
   - Follow the test colocation pattern (see Testing section)

### Adding New Error Types

1. **Define Error Class** (`src/errors/registry-error.ts`)

   ```typescript
   export class NewError extends BaseUIError {
     constructor(context: string) {
       super(`Error message: ${context}`, {
         code: "NEW_ERROR",
         suggestion: "How to fix this error",
         context: { context },
       });
       this.name = "NewError";
     }
   }
   ```

2. **Use the Error**
   ```typescript
   throw new NewError("context information");
   ```

## Component Data

### Adding New Components

Components are automatically fetched from the GitHub API. If you need to update the fallback list, update `src/constants/fallback-components.ts`:

```typescript
export const FALLBACK_COMPONENT_NAMES: readonly string[] = [
  // ... existing components
  "new-component-root",
  "new-component-trigger",
  // ...
] as const;
```

## Performance Considerations

- **Caching**: Use the existing cache for component data
- **Parallel Fetching**: Fetch multiple components in parallel
- **Lazy Loading**: Load data only when needed
- **Efficiency**: Optimize search algorithms

## Documentation

### Code Comments

- Add JSDoc comments for public functions
- Explain complex logic
- Document assumptions and limitations

```typescript
/**
 * Search components by query string with advanced scoring
 *
 * @param query - Search query
 * @param limit - Maximum results to return
 * @param options - Additional search options
 * @returns Array of matching components
 */
export async function searchComponents(
  query: string,
  limit: number = 10,
  options?: SearchOptions
): Promise<BaseUIComponent[]> {
  // Implementation
}
```

### README Updates

When adding features:

- Update the README.md
- Add usage examples
- Document new tools
- Update feature list

## Getting Help

- Open an issue on [GitHub](https://github.com/morksen123/base-ui-mcp-server/issues) for questions
- Check existing issues and PRs
- Review the [shadcn MCP documentation](https://ui.shadcn.com/docs/mcp)
- Read the [MCP specification](https://modelcontextprotocol.io/)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow best practices

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
