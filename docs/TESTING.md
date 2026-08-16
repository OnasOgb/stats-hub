# Testing Guide

This guide explains how to write and run tests in the stats-hub codebase.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker installed and running

### Running Tests Locally

```bash
# 1. Start the test database (once per session)
npm run test:db:start

# 2. In another terminal, run tests in watch mode
npm run test:watch

# 3. Make changes and watch tests re-run automatically
```

### Running E2E Tests

```bash
# Start the dev server in one terminal
npm run dev

# In another terminal, run E2E tests with UI
npm run test:e2e:ui
```

## Test Organization

Tests are organized in `__tests__` directories colocated with source code:

```
app/
├── page.tsx
└── __tests__/
    ├── page.test.tsx          # Component unit tests
    └── page.integration.test.ts # Component + data integration tests

lib/
├── utils.ts
└── __tests__/
    ├── utils.test.ts          # Utility function tests
    └── fixtures.ts            # Reusable test data
```

## Writing Tests

### Unit Tests

Unit tests focus on a single component or function in isolation.

**File:** `component/__tests__/component.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../component';

describe('MyComponent', () => {
  it('renders text content', () => {
    render(<MyComponent text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

**What to test:**
- Component renders correctly
- Props are used properly
- User interactions work (clicks, form inputs)
- Conditional rendering works
- Error states display

### Integration Tests

Integration tests verify how components, API routes, and the database work together.

**File:** `api/endpoint/__tests__/route.integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { supabase } from '@/lib/supabase';

describe('POST /api/endpoint', () => {
  beforeEach(async () => {
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('table').delete().neq('id', 'null');
  });

  it('creates record and returns success', async () => {
    const request = new Request('http://localhost/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBeDefined();
  });
});
```

**What to test:**
- API endpoints return correct status codes
- Data is persisted to database
- Validation works end-to-end
- Error handling works correctly
- Database constraints are respected

### E2E Tests

E2E tests verify complete user workflows through the browser.

**File:** `e2e/feature.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Flow', () => {
  test('user can complete workflow', async ({ page }) => {
    // Navigate to page
    await page.goto('http://localhost:3000/feature');

    // Interact with UI
    await page.fill('input[type="text"]', 'value');
    await page.click('button:has-text("Submit")');

    // Verify result
    await expect(page.locator('h1')).toContainText('Success');
  });
});
```

**What to test:**
- Complete user workflows from start to finish
- Navigation works correctly
- Form submission works end-to-end
- Success and error messages display
- Page redirects work properly

## Test Data & Fixtures

Reusable test data is in `lib/__tests__/fixtures.ts`.

```typescript
import { testUser, testHub } from '../../../lib/__tests__/fixtures';

// Use in tests
const user = testUser;
```

## Running Tests

### Local Development

```bash
# Watch mode - re-runs tests when files change
npm run test:watch

# Run all tests once
npm run test:run

# Run tests with UI dashboard
npm run test:ui

# Run only unit/integration tests
npm run test:integration

# Check code coverage
npm run test:coverage
```

### E2E Testing

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with interactive UI
npm run test:e2e:ui

# Debug single test
npm run test:e2e:debug
```

### Database Management

```bash
# Start test database
npm run test:db:start

# Stop test database
npm run test:db:stop

# Reset test database (clears data)
npm run test:db:reset
```

## CI/CD

Tests run automatically on every pull request using GitHub Actions. The workflow:

1. Checks out code
2. Installs dependencies
3. Runs unit & integration tests
4. Builds the app
5. Runs E2E tests
6. Uploads coverage reports

All tests must pass before merging to main.

## Troubleshooting

### Tests timeout waiting for database

```bash
# Reset the database
npm run test:db:reset

# Verify database is running
docker ps | grep postgres
```

### Port 5433 already in use

The test database uses port 5433. If it's occupied:

```bash
# Find process using port
lsof -i :5433

# Stop test database and try again
npm run test:db:stop
```

### E2E tests fail in CI but pass locally

This is often due to:
1. Race conditions (add more waits)
2. Environment differences (check .env variables)
3. Timing issues (tests might be too fast/slow)

Add explicit waits:

```typescript
await page.waitForURL('**/path');
await page.waitForLoadState('networkidle');
```

## Best Practices

1. **Test behavior, not implementation** — Test what the component does, not how
2. **Use descriptive test names** — Name should describe expected behavior
3. **One assertion focus** — Each test should verify one thing
4. **DRY test data** — Use fixtures for repeated test data
5. **Cleanup after tests** — Always clean up database records in `afterEach`
6. **Avoid test interdependencies** — Tests should pass in any order
7. **Mock external services** — Mock APIs, don't call real services in unit tests
8. **Use real database in integration** — Integration tests should use real database

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](./superpowers/specs/2026-08-13-comprehensive-test-suite-design.md)
