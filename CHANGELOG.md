# Changelog

All notable changes to the Base UI MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-06

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
- In-memory caching with 1-hour TTL
- Support for 30+ Base UI components
- Real-time data from Base UI GitHub repository
- Test suite for component fetching (3/3 tests passing)

### Added - Milestone 3: Enhanced Search & Filtering

- Advanced search with fuzzy matching algorithm
- Multi-field search (name, description, props, data attributes)
- Relevance scoring with weighted fields
- Case-insensitive search
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

- 1-hour TTL for component cache
- Parallel component fetching
- Optimized search algorithms
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
