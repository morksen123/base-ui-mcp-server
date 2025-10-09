# Changelog

All notable changes to the Base UI MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Beta-0] - 2025-10-09

### Codebase Cleanup & Standards Alignment

Following shadcn MCP patterns for cleaner, more maintainable code.

### Removed

- Verbose BETA_ANALYSIS.md documentation
- Verbose TESTING.md documentation
- Unused imports (`UnauthorizedError`, `ForbiddenError`, `NotFoundError` from handle-error.ts)
- Unused imports (`getAvailableComponentNames` from component-tools.ts)
- Unused imports (`BaseUIError` from examples-fetcher.ts)
- Excessive code comments

### Changed

- **Source files**: Removed excessive comments, added meaningful ones following shadcn's clean code style
- **README.md**: Simplified to essential information
- **CONTRIBUTING.md**: Condensed to key guidelines
- Added strategic comments where self-documenting code isn't sufficient

### Added

- Meaningful comments explaining non-obvious implementation details:
  - Cache deduplication logic
  - Hook filtering in component fetcher
  - Fuzzysort threshold behavior
  - Component family extraction patterns

### Code Quality

- ✅ Test colocation pattern (shadcn standard)
- ✅ Custom error classes with helpful suggestions
- ✅ Zod validation for all inputs
- ✅ Clean, minimal comments
- ✅ Self-documenting code

### Test Coverage

- MCP Handlers: 564 lines
- GitHub Fetcher: 473 lines
- Config System: 223 lines
- Search Utils: 283 lines
- Fetch JSON: 355 lines
- **Total:** 1,898 lines of tests

---

## [1.0.0] - 2025-01-06 (Alpha Release)

### Added - Milestone 1: Basic MCP Server

- Initial project structure with TypeScript
- Basic MCP server implementation using @modelcontextprotocol/sdk
- Three core tools: search_components, get_component, list_components
- Tool request handlers with placeholder responses
- Server startup and error handling
- Test suite for basic server functionality (3/3 tests passing)

### Added - Milestone 2: Component Data Fetching

- GitHub raw content fetcher for component JSON files
- Component data validation using Zod schemas
- Parallel fetching for multiple components
- In-memory caching with request deduplication
- Support for 30+ Base UI components
- Real-time data from Base UI GitHub repository
- Test suite for component fetching (3/3 tests passing)

### Added - Milestone 3: Enhanced Search & Filtering

- Advanced search with fuzzy matching algorithm
- Multi-field search (name, description, props, data attributes)
- Relevance scoring with weighted fields
- Case-insensitive matching
- Component family grouping (Dialog, Menu, Field, etc.)
- Auto-complete suggestions for partial input
- Advanced filtering by props, data attributes, CSS variables
- Test suite for search functionality (5/5 tests passing, 100% accuracy)

### Added - Milestone 4: Error Handling & Validation

- Custom error classes (BaseUIError, ComponentNotFoundError, FetchError, etc.)
- Comprehensive Zod validation schemas with constraints
- Input validation for all tool parameters
- Helpful error messages with actionable suggestions
- Context information in error responses
- Three-tier error handling (Zod, Custom, Unknown)
- Integration of `zod-to-json-schema` for tool definitions
- Integration of `dedent` for clean error formatting
- Test suite for error handling (5/5 tests passing)

### Added - Milestone 5: Documentation & Final Polish

- Comprehensive README with usage examples
- CONTRIBUTING guide for developers
- LICENSE file (MIT)
- CHANGELOG documentation
- Code comments and JSDoc annotations
- Project structure documentation
- Performance optimization notes
- Related links and acknowledgments

### Features

- 🔍 Intelligent search with fuzzy matching
- 📚 Complete component information (props, data attributes, CSS variables)
- 🎨 Component family grouping
- ⚡ In-memory caching for performance
- 🛡️ Full TypeScript and Zod validation
- 💬 Helpful error messages with suggestions
- 📖 Comprehensive documentation
- 🧪 Complete test coverage

### Technical Details

- TypeScript 5.3 with strict mode
- Node.js 18+ support
- Model Context Protocol SDK v0.5.0
- Zod v3.22.4 for validation
- ESLint for code quality
- Modular architecture with clear separation of concerns

### Performance

- In-memory caching (no TTL - persists for process lifetime)
- Request deduplication prevents concurrent duplicate fetches
- Parallel component fetching
- Optimized search algorithms with fuzzysort
- Lazy loading of component data

### Testing

- Milestone 1: Basic MCP Server (3/3 tests, 100%)
- Milestone 2: Component Data Fetching (3/3 tests, 100%)
- Milestone 3: Enhanced Search (5/5 tests, 100% accuracy)
- Milestone 4: Error Handling (5/5 tests, 100%)
- All 16 tests passing

## Future Enhancements

### Potential Features

- [ ] Component usage examples and code snippets
- [ ] Component dependencies and relationships
- [ ] Version history and changelog for components
- [ ] Integration with Base UI documentation links
- [ ] Support for custom component registries
- [ ] Webhook support for cache invalidation
- [ ] GraphQL API support
- [ ] Component playground integration

### Performance Improvements

- [ ] Persistent caching with Redis
- [ ] CDN integration for static component data
- [ ] Streaming responses for large datasets
- [ ] Background cache warming

### Developer Experience

- [ ] CLI for managing the server
- [ ] Configuration file support
- [ ] Custom registry URLs
- [ ] Debug mode with detailed logging
- [ ] Health check endpoints

## Links

- [Base UI Documentation](https://base-ui.com/react)
- [Base UI GitHub](https://github.com/mui/base-ui)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [shadcn MCP Pattern](https://ui.shadcn.com/docs/mcp)
