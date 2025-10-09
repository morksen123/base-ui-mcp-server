# Beta Testing Execution Plan

## Current Test Status

### ✅ Existing Tests (27 tests passing)

- `src/utils/search-utils.test.ts` - 11 tests
- `src/fetchers/github-fetcher.test.ts` - 16 tests

### ❌ Missing Critical Tests

1. `src/config/index.test.ts` - Config system
2. `src/utils/fetch-json.test.ts` - HTTP client
3. `src/mcp/handlers.test.ts` - MCP tool handlers
4. `src/tools/component-tools.test.ts` - Component search/retrieval
5. `src/tools/examples-tools.test.ts` - Examples fetching
6. `src/tools/installation-tools.test.ts` - Installation guide generation

---

## Phase 1: Critical Module Tests (Must Have) 🔴

### 1.1 Config System Tests

**File:** `src/config/index.test.ts`

Test coverage:

- [ ] Load default config successfully
- [ ] Override with environment variables (GITHUB_TOKEN, https_proxy)
- [ ] Validate config schema with Zod
- [ ] Handle invalid config gracefully
- [ ] Cache config after first load
- [ ] Reset config for testing

### 1.2 HTTP Client Tests

**File:** `src/utils/fetch-json.test.ts`

Test coverage:

- [ ] Successful JSON fetch
- [ ] Proxy agent configuration
- [ ] GitHub headers with token
- [ ] Error handling: 401, 403, 404, 500
- [ ] RFC 7807 error parsing with Zod
- [ ] Network errors (timeout, no connection)
- [ ] Custom error handler option

### 1.3 MCP Handler Tests

**File:** `src/mcp/handlers.test.ts`

Test coverage:

- [ ] `handleSearchComponents` - valid query
- [ ] `handleSearchComponents` - no results
- [ ] `handleGetComponentExamples` - valid component
- [ ] `handleGetComponentExamples` - invalid component
- [ ] `handleGetInstallationGuide` - single component
- [ ] `handleGetInstallationGuide` - multiple components
- [ ] `handleGetSetupChecklist` - returns checklist

---

## Phase 2: Tool Integration Tests (Should Have) 🟡

### 2.1 Component Tools Tests

**File:** `src/tools/component-tools.test.ts`

Test coverage:

- [ ] `searchComponents` with fuzzy matching
- [ ] `searchComponentsWithPagination` - pagination works
- [ ] `getAllComponents` - caching behavior
- [ ] `getComponentStats` - correct stats

### 2.2 Examples Tools Tests

**File:** `src/tools/examples-tools.test.ts`

Test coverage:

- [ ] `getExamples` - fetches demos + metadata
- [ ] `getExamples` - filters by variant (css-modules/tailwind)
- [ ] `getExamples` - handles missing component
- [ ] `getComponentExamples` - fetches from GitHub

### 2.3 Installation Tools Tests

**File:** `src/tools/installation-tools.test.ts`

Test coverage:

- [ ] `getInstallationGuide` - generates npm/yarn/pnpm commands
- [ ] `getInstallationGuide` - includes all component parts
- [ ] `getSetupChecklist` - returns verification steps
- [ ] `getSetupChecklist` - includes troubleshooting

---

## Phase 3: Code Quality Audit (Nice to Have) 🟢

### 3.1 Code Quality Checks

- [ ] **JSDoc**: All public APIs documented
- [ ] **Type Safety**: No `any` without justification
- [ ] **Code Smells**: Functions <50 lines, nesting <3 levels
- [ ] **Imports**: Sorted (external → internal → types)
- [ ] **DRY**: No duplicate code

### 3.2 Shadcn Compliance

- [ ] File structure matches: `mcp/`, `config/`, `utils/`, `tools/`
- [ ] Tests colocated: `*.test.ts` next to source
- [ ] Error classes extend base error
- [ ] Config uses Zod + defaults pattern
- [ ] Function names: `get*`, `fetch*`, `handle*` prefixes

### 3.3 Project Structure

- [ ] `.gitignore` excludes `/dist`, `.env`, `.DS_Store`
- [ ] `package.json` complete metadata
- [ ] Essential files present: README, LICENSE, CHANGELOG
- [ ] No unnecessary files in git

---

## Testing Standards (from shadcn)

### Test File Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { vi } from "vitest";

describe("moduleName", () => {
  beforeEach(() => {
    // Setup: clear mocks, reset state
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  it("should handle valid input", async () => {
    // Arrange
    const input = {
      /* test data */
    };

    // Act
    const result = await functionUnderTest(input);

    // Assert
    expect(result).toEqual(expectedOutput);
  });

  it("should handle errors gracefully", async () => {
    // Test error paths
    await expect(functionUnderTest(invalidInput)).rejects.toThrow(
      ExpectedError
    );
  });
});
```

### MSW Setup (Optional Enhancement)

```typescript
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.get("https://api.github.com/repos/mui/base-ui/*", () => {
    return HttpResponse.json({
      /* mock data */
    });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
```

---

## Execution Order

1. **Start with Phase 1.1** - Config tests (foundation)
2. **Then Phase 1.2** - HTTP client tests (critical path)
3. **Then Phase 1.3** - Handler tests (integration)
4. **Move to Phase 2** - Tool tests (features)
5. **Finally Phase 3** - Code quality audit

---

## Success Criteria

### Phase 1 Complete

- [ ] All config tests pass
- [ ] All fetch-json tests pass
- [ ] All handler tests pass
- [ ] **Total: 27 + ~30 new tests = ~57 tests passing**

### Phase 2 Complete

- [ ] All tool tests pass
- [ ] **Total: ~57 + ~25 new tests = ~82 tests passing**

### Phase 3 Complete

- [ ] Code quality audit passed
- [ ] Shadcn compliance verified
- [ ] Project structure clean
- [ ] **Ready for public beta release**

---

## Commands

```bash
# Run all tests
npm test -- --run

# Run specific test file
npm test -- src/config/index.test.ts --run

# Run with coverage
npm test -- --coverage --run

# Watch mode for TDD
npm test -- src/config/index.test.ts
```
