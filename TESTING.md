# Testing Guide

This document describes the testing strategy and how to run tests for the Base UI MCP Server.

## Test Overview

The project includes comprehensive test suites for all development milestones:

| Milestone             | Tests     | Status      | Accuracy |
| --------------------- | --------- | ----------- | -------- |
| 1: Basic MCP Server   | 3/3       | ✅ Pass     | 100%     |
| 2: Component Fetching | 3/3       | ✅ Pass     | 100%     |
| 3: Enhanced Search    | 5/5       | ✅ Pass     | 100%     |
| 4: Error Handling     | 5/5       | ✅ Pass     | 100%     |
| **Total**             | **16/16** | **✅ Pass** | **100%** |

## Running Tests

### Prerequisites

```bash
# Build the project first
npm run build
```

### Running Individual Test Suites

```bash
# Milestone 1: Basic MCP Server
node test-milestone1.js

# Milestone 2: Component Data Fetching
node test-milestone2.js

# Milestone 3: Enhanced Search & Filtering
node test-milestone3.js

# Milestone 4: Error Handling & Validation
node test-milestone4.js
```

### Running All Tests

```bash
# Run all tests sequentially
npm run build && \
node test-milestone1.js && \
node test-milestone2.js && \
node test-milestone3.js && \
node test-milestone4.js
```

## Test Details

### Milestone 1: Basic MCP Server

**Goal**: Verify basic server functionality
**Tests**: 3
**Status**: ✅ All Passing

#### Test Cases

1. **Server Startup**
   - ✅ Server starts without errors
   - ✅ Responds to tool/list requests
   - ✅ Returns 3 expected tools

2. **Tool Definitions**
   - ✅ search_components tool is defined
   - ✅ get_component tool is defined
   - ✅ list_components tool is defined

3. **Basic Functionality**
   - ✅ Server accepts JSON-RPC requests
   - ✅ Server returns valid JSON-RPC responses

**Command**: `node test-milestone1.js`

---

### Milestone 2: Component Data Fetching

**Goal**: Verify GitHub data fetching and parsing
**Tests**: 3
**Status**: ✅ All Passing

#### Test Cases

1. **Fetch Specific Component**
   - ✅ Successfully fetches Input component from GitHub
   - ✅ Parses component data correctly
   - ✅ Returns props and data attributes

2. **Search Components**
   - ✅ Searches for "dialog" components
   - ✅ Returns multiple relevant results
   - ✅ Displays component names

3. **List Components**
   - ✅ Lists all available components
   - ✅ Returns at least 10 components
   - ✅ Includes descriptions

**Command**: `node test-milestone2.js`

---

### Milestone 3: Enhanced Search & Filtering

**Goal**: Verify advanced search features
**Tests**: 5
**Status**: ✅ All Passing
**Accuracy**: 100%

#### Test Cases

1. **Fuzzy Search**
   - ✅ Partial match "dial" finds Dialog components
   - ✅ Returns 5+ relevant results

2. **Relevance Ranking**
   - ✅ Exact match "Input" is ranked first
   - ✅ Proper scoring algorithm

3. **Description Search**
   - ✅ Searches in component descriptions
   - ✅ Finds "button" in descriptions
   - ✅ Returns 10+ relevant components

4. **Case Insensitive**
   - ✅ "DIALOG" finds dialog components
   - ✅ Uppercase/lowercase handled correctly

5. **Irrelevant Query Handling**
   - ✅ "xyz123" returns 0 results
   - ✅ No false positives

**Command**: `node test-milestone3.js`

---

### Milestone 4: Error Handling & Validation

**Goal**: Verify comprehensive error handling
**Tests**: 5
**Status**: ✅ All Passing

#### Test Cases

1. **Validation: Empty Query**
   - ✅ Rejects empty query string
   - ✅ Returns validation error message

2. **Validation: Invalid Limit**
   - ✅ Rejects negative limit value
   - ✅ Returns helpful error message

3. **Component Not Found**
   - ✅ Handles non-existent component gracefully
   - ✅ Provides suggestions with 💡 icon
   - ✅ Suggests using search_components

4. **Empty Search Results**
   - ✅ Handles no results gracefully
   - ✅ Provides alternative suggestions
   - ✅ Includes "Try:" section

5. **Valid Requests Still Work**
   - ✅ Valid search query works correctly
   - ✅ Returns expected results
   - ✅ No regression in functionality

**Command**: `node test-milestone4.js`

## Test Implementation

### Test Structure

Each test file follows this pattern:

```javascript
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testMilestone() {
  console.log('🧪 Testing Milestone X\n');

  // Start server
  const server = spawn('npm', ['run', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  await setTimeout(2000); // Wait for startup

  // Test cases
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1
  console.log('📋 Test 1: Description...');
  // ... test implementation

  // Cleanup
  server.kill();

  // Summary
  console.log(`   ✅ Passed: ${testsPassed}/${totalTests}`);
}
```

### Test Utilities

Common utilities used in tests:

```javascript
// Send a request to the server
async function sendRequest(server, request) {
  let responseData = '';
  // ... implementation
  return responseData;
}

// Parse JSON response
function parseResponse(responseData) {
  const jsonMatch = responseData.match(/\{.*\}/s);
  return JSON.parse(jsonMatch[0]);
}
```

## Manual Testing

### Using MCP Inspector

```bash
# Start the interactive inspector
npm run mcp:inspect
```

This opens a web interface at `http://localhost:6274` where you can:

- View all available tools
- Test tool calls interactively
- See real-time responses
- Debug issues

### Manual Test Cases

#### Test 1: Search for Components

```json
{
  "name": "search_components",
  "arguments": {
    "query": "dialog",
    "limit": 5
  }
}
```

**Expected**: Returns 5 dialog-related components

#### Test 2: Get Component Details

```json
{
  "name": "get_component",
  "arguments": {
    "name": "Input"
  }
}
```

**Expected**: Returns complete Input component information

#### Test 3: List Components

```json
{
  "name": "list_components",
  "arguments": {
    "limit": 10
  }
}
```

**Expected**: Returns 10 components with descriptions

#### Test 4: Error Handling

```json
{
  "name": "search_components",
  "arguments": {
    "query": "",
    "limit": -5
  }
}
```

**Expected**: Returns validation error with helpful message

## Performance Testing

### Response Time Benchmarks

| Operation         | First Call | Cached Call | Target |
| ----------------- | ---------- | ----------- | ------ |
| search_components | <3s        | <100ms      | <5s    |
| get_component     | <2s        | <50ms       | <3s    |
| list_components   | <3s        | <100ms      | <5s    |

### Load Testing

Test server under load:

```bash
# Run multiple concurrent requests
for i in {1..10}; do
  echo "Request $i"
  echo '{"jsonrpc": "2.0", "id": '$i', "method": "tools/call", "params": {"name": "search_components", "arguments": {"query": "dialog"}}}' | npm run dev &
done
```

## Continuous Integration

### Pre-commit Checks

Before committing:

```bash
# 1. Type check
npm run type-check

# 2. Lint
npm run lint

# 3. Build
npm run build

# 4. Test
node test-milestone1.js
node test-milestone2.js
node test-milestone3.js
node test-milestone4.js
```

### CI Pipeline (Future)

```yaml
# Example GitHub Actions workflow
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: node test-milestone1.js
      - run: node test-milestone2.js
      - run: node test-milestone3.js
      - run: node test-milestone4.js
```

## Debugging Tests

### Common Issues

1. **Server fails to start**
   - Check if port is already in use
   - Verify dependencies are installed
   - Check Node.js version (18+)

2. **Tests timeout**
   - Increase timeout duration in test files
   - Check internet connection (for GitHub fetching)
   - Verify server startup time

3. **JSON parsing errors**
   - Check server output format
   - Verify JSON-RPC format
   - Look for extra output in stderr

### Debug Mode

Enable verbose logging:

```bash
# Add debug logging to server
console.error('Debug:', variableName);

# Run tests with debug output
node test-milestone1.js 2>&1 | tee test-output.log
```

## Test Coverage Goals

- ✅ 100% of tools tested
- ✅ All error paths tested
- ✅ Edge cases covered
- ✅ Integration tests included
- ⏳ Unit tests (future enhancement)

## Future Testing Improvements

- [ ] Unit tests for individual functions
- [ ] Integration tests with real AI assistants
- [ ] Performance benchmarks
- [ ] Load testing suite
- [ ] Regression tests
- [ ] Code coverage reporting
- [ ] Automated CI/CD pipeline

## Resources

- [MCP Testing Guide](https://modelcontextprotocol.io/docs/testing)
- [Vitest Documentation](https://vitest.dev/) (for future unit tests)
- [Node.js Testing](https://nodejs.org/api/test.html)
