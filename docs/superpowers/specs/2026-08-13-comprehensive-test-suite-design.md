# Comprehensive Test Suite Design

**Date:** August 13, 2026  
**Branch:** `feat/test-suite`  
**Status:** Design approved, pending implementation

---

## Executive Summary

This document specifies a comprehensive, production-focused test suite for the stats-hub codebase. The suite consists of three testing layers—unit tests, integration tests, and end-to-end tests—designed to maximize production confidence while maintaining fast feedback loops for developers.

**Key Goals:**
- Production confidence through realistic integration and E2E testing
- Fast local feedback for developers (watch mode)
- Automated CI/CD validation on every pull request
- Clear ownership and maintenance of tests through colocated organization

---

## Architecture Overview

### Three Test Layers

#### 1. Unit Tests (Vitest + React Testing Library)
- **Scope:** Individual components, utilities, and API route logic in isolation
- **Database:** No database access; uses mocks and fixtures
- **Runtime:** <2 minutes for full suite
- **Purpose:** Catch logic errors early, enable confident refactoring
- **When to write:** Testing component behavior, form validation, conditional rendering, utility functions

#### 2. Integration Tests (Vitest + Docker Postgres)
- **Scope:** API routes + database queries, components with data dependencies
- **Database:** Real containerized Postgres instance that mirrors production schema
- **Runtime:** 2-3 minutes
- **Purpose:** Verify data contracts, catch schema mismatches, ensure migrations work
- **When to write:** Testing API endpoints, database operations, data transformations

#### 3. End-to-End Tests (Playwright)
- **Scope:** Complete user workflows through the browser
- **Database:** Test instance of the app running against test database
- **Runtime:** 5-10 minutes
- **Purpose:** Verify real user flows work end-to-end, catch integration issues between frontend and backend
- **When to write:** Critical user journeys (auth flows, data creation/editing, navigation)

### Database Strategy

**Containerization:**
- Use Docker with `docker-compose.test.yml` to run Postgres 16
- Test database is isolated from development database (different port)
- Database state is reset before each test suite run

**Isolation:**
- Integration tests use database transactions that roll back after each test
- Manual cleanup in `afterEach` hooks for tests that need it
- Fixtures in `lib/__tests__/fixtures.ts` provide reusable test data

**Parity with Production:**
- Test database schema matches production schema exactly
- Migrations run in test environment same as production
- Queries use real Supabase client (not mocked) to catch real bugs

---

## Directory Structure

### Test Organization

Tests are colocated with source code for easy discovery and maintenance:

```
stats-hub/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── __tests__/
│   │   │       ├── login.test.tsx              # Component unit tests
│   │   │       └── login.integration.test.ts   # Auth flow with DB
│   ├── hub/
│   │   ├── page.tsx
│   │   ├── __tests__/
│   │   │   ├── hub.test.tsx
│   │   │   └── hub.integration.test.ts
│   ├── profile/
│   │   ├── page.tsx
│   │   ├── __tests__/
│   │   │   ├── profile.test.tsx
│   │   │   └── profile.integration.test.ts
│   └── api/
│       ├── auth/
│       │   ├── route.ts
│       │   └── __tests__/
│       │       └── route.integration.test.ts
│       ├── hubs/
│       │   ├── route.ts
│       │   └── __tests__/
│       │       └── route.integration.test.ts
│       └── ...
├── lib/
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── __tests__/
│   │       └── helpers.test.ts
│   ├── supabase.ts
│   ├── __tests__/
│   │   └── fixtures.ts                        # Reusable test data
│   └── ...
├── e2e/                                         # E2E tests separate
│   ├── auth.spec.ts                            # Auth flow: signup → login
│   ├── hub.spec.ts                             # Hub: create, edit, view
│   ├── profile.spec.ts                         # Profile: view, edit
│   └── fixtures.ts                             # E2E test helpers
├── docker-compose.test.yml                     # Test database config
├── vitest.config.ts                            # Vitest configuration
├── playwright.config.ts                        # Playwright configuration
├── .env.test                                   # Test environment variables
├── docs/
│   ├── TESTING.md                              # Testing guide for team
│   └── superpowers/specs/
│       └── 2026-08-13-comprehensive-test-suite-design.md (this file)
└── package.json
```

### Naming Conventions

- `*.test.ts` / `*.test.tsx` — Unit tests (no database)
- `*.integration.test.ts` — Integration tests (with database)
- `*.spec.ts` — E2E tests (Playwright convention)

**Rationale:** Naming makes the test type obvious at a glance. File extensions make it easy to filter which tests to run.

---

## Test Setup & Infrastructure

### Docker Compose Configuration

**File:** `docker-compose.test.yml`

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: stats_hub_test
    ports:
      - "5433:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
volumes:
  postgres_test_data:
```

**Rationale:** Separate port (5433) prevents conflicts with development database. Docker ensures consistent environment across machines and CI.

### Database Initialization

**File:** `vitest.setup.ts`

Handles before/after test suite:
1. Starts Docker container (if not running)
2. Waits for Postgres to be ready
3. Runs migrations to set up schema
4. Seeds initial test data (optional)
5. After tests complete: tears down or resets database

### Test Fixtures

**File:** `lib/__tests__/fixtures.ts`

Provides reusable test data for consistent, readable tests:

```typescript
export const testUser = {
  id: 'user-test-123',
  email: 'test@example.com',
  name: 'Test User'
};

export const testHub = {
  id: 'hub-test-123',
  name: 'Test Hub',
  ownerId: testUser.id
};

// Helper to create records in test database
export async function createTestUser(overrides = {}) {
  return supabase
    .from('users')
    .insert({ ...testUser, ...overrides })
    .select()
    .single();
}

export async function createTestHub(overrides = {}) {
  return supabase
    .from('hubs')
    .insert({ ...testHub, ...overrides })
    .select()
    .single();
}
```

### Environment Configuration

**File:** `.env.test`

Test-specific environment variables:
```
DATABASE_URL=postgres://test_user:test_password@localhost:5433/stats_hub_test
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=test
```

**Rationale:** Separate `.env.test` ensures tests don't interfere with development or production databases.

---

## Testing Strategy by Layer

### Unit Tests

**Scope:** Component behavior, form validation, utility logic  
**Tools:** Vitest + React Testing Library  
**Database:** None (use fixtures and mocks)

**Example: Component Unit Test**

```typescript
// app/profile/__tests__/profile.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilePage } from '../page';

describe('ProfilePage', () => {
  it('renders user profile information', () => {
    const user = { id: '1', name: 'Alice', email: 'alice@example.com' };
    render(<ProfilePage user={user} />);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('shows validation error when email is invalid', async () => {
    render(<ProfilePage user={testUser} />);
    const emailInput = screen.getByLabelText('Email');
    
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);
    
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('disables submit button when form has errors', () => {
    render(<ProfilePage user={testUser} />);
    const submitButton = screen.getByRole('button', { name: /save/i });
    
    expect(submitButton).toBeDisabled();
  });
});
```

**What we verify:**
- Component renders correctly with given props
- Form validation works
- Error messages display
- User interactions trigger expected state changes

### Integration Tests

**Scope:** API routes + database, complete data flows  
**Tools:** Vitest + Docker Postgres  
**Database:** Real containerized Postgres

**Example: API Route Integration Test**

```typescript
// app/api/hubs/__tests__/route.integration.test.ts
import { POST } from '../route';
import { supabase } from '@/lib/supabase';
import { testUser, createTestUser } from '@/lib/__tests__/fixtures';

describe('POST /api/hubs (integration)', () => {
  beforeEach(async () => {
    await createTestUser();
  });

  afterEach(async () => {
    // Clean up created records
    await supabase.from('hubs').delete().neq('id', 'null');
  });

  it('creates a hub and persists to database', async () => {
    const request = new Request('http://localhost/api/hubs', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Hub',
        description: 'A test hub'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.id}`
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('New Hub');

    // Verify it's actually in the database
    const { data: dbRecord, error } = await supabase
      .from('hubs')
      .select('*')
      .eq('id', data.id)
      .single();

    expect(error).toBeNull();
    expect(dbRecord).toBeDefined();
    expect(dbRecord.name).toBe('New Hub');
  });

  it('returns 400 if required fields are missing', async () => {
    const request = new Request('http://localhost/api/hubs', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.id}`
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    // Verify no record was created
    const { data: records } = await supabase
      .from('hubs')
      .select('*')
      .eq('name', '');
    
    expect(records.length).toBe(0);
  });
});
```

**What we verify:**
- API endpoint returns correct status codes
- Data is persisted to database correctly
- Validation works end-to-end
- Errors are handled gracefully
- Schema constraints are respected

### End-to-End Tests

**Scope:** Complete user workflows through the browser  
**Tools:** Playwright  
**Database:** Test instance of the app

**Example: User Authentication E2E Test**

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign up, log out, and log back in', async ({ page }) => {
    // Sign up
    await page.goto('http://localhost:3000/auth/signup');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'SecurePassword123');
    await page.click('button:has-text("Sign Up")');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/hub');
    await expect(page.locator('h1')).toContainText('My Hubs');

    // Log out
    await page.click('button:has-text("Menu")');
    await page.click('text=Log Out');

    // Verify redirect to login
    await expect(page).toHaveURL('http://localhost:3000/auth/login');

    // Log back in
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'SecurePassword123');
    await page.click('button:has-text("Log In")');

    // Verify back at dashboard
    await expect(page).toHaveURL('http://localhost:3000/hub');
    await expect(page.locator('h1')).toContainText('My Hubs');
  });

  it('shows error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'WrongPassword');
    await page.click('button:has-text("Log In")');

    // Error message appears
    await expect(page.locator('[role="alert"]')).toContainText(
      'Invalid email or password'
    );

    // Still on login page
    await expect(page).toHaveURL('http://localhost:3000/auth/login');
  });
});
```

**What we verify:**
- User can complete critical workflows start-to-finish
- Navigation works correctly
- Form submission works through the browser
- Error messages appear in the UI
- Redirects happen as expected
- Session management works

---

## CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

Runs on every push to main and pull request:

```yaml
name: Test Suite

on:
  push:
    branches: [main, feat/test-suite]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: stats_hub_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5433:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          DATABASE_URL: postgres://test_user:test_password@localhost:5433/stats_hub_test
        run: npm run db:migrate

      - name: Run unit & integration tests
        env:
          DATABASE_URL: postgres://test_user:test_password@localhost:5433/stats_hub_test
          NODE_ENV: test
        run: npm run test:integration -- --run

      - name: Build app
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Test Execution Order

1. **Lint & Type Check** (~30s) — catch syntax errors first
2. **Install Dependencies** (~30s) — npm ci with cache
3. **Database Setup** (~30s) — migrations run
4. **Unit & Integration Tests** (~2-3 min) — fast feedback
5. **Build** (~2 min) — ensure code compiles for production
6. **E2E Tests** (~5-10 min) — full confidence in user flows

**Total CI time:** ~12-15 minutes  
**Rationale:** Fast tests run first for quick feedback. E2E tests run last since they take longest. If any step fails, CI stops and notifies the team.

### Pull Request Experience

- Tests run automatically on every PR
- Pass/fail status appears as a GitHub check
- Failed tests block merging (status check requirement)
- Coverage reports posted as PR comments
- E2E test failures include screenshots for debugging

---

## Local Development

### Getting Started

```bash
# 1. Ensure Docker is running
docker --version

# 2. Start the test database
npm run test:db:start

# 3. In another terminal, run tests in watch mode
npm run test:watch

# 4. Make changes and watch tests re-run automatically
```

### npm Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --include '**/*.integration.test.ts' --include '**/*.test.ts'",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:db:start": "docker-compose -f docker-compose.test.yml up -d",
    "test:db:stop": "docker-compose -f docker-compose.test.yml down",
    "test:db:reset": "docker-compose -f docker-compose.test.yml down && docker-compose -f docker-compose.test.yml up -d",
    "db:migrate": "node scripts/migrate.js"
  }
}
```

### Typical Developer Workflow

```bash
# Start database (once per session)
npm run test:db:start

# Watch for changes while coding
npm run test:watch

# Before committing, run E2E tests with UI
npm run test:e2e:ui

# Check coverage
npm run test:coverage

# Push when all tests pass
git push
```

### IDE Integration

Modern IDEs (VS Code, WebStorm) support Vitest natively:
- Red/green test status in code gutter
- "Run Test" / "Debug Test" buttons
- Inline failure messages
- Watch mode syncs with editor

### Expected Test Performance

- First run (setup): ~5 minutes (Docker pulls image, migrations run)
- Subsequent unit test runs: <1 second per file in watch mode
- Full unit + integration suite: ~2-3 minutes
- Full E2E suite: 5-10 minutes
- Single E2E test: 30-60 seconds

---

## Team Documentation

**File:** `docs/TESTING.md`

Provides quick reference for team members:

- How to run tests locally
- How to write new tests (by layer)
- Naming conventions
- Common patterns and fixtures
- Troubleshooting guide

---

## Success Criteria

This test suite is successful when:

✅ Unit tests run in <2 minutes and catch logic errors early  
✅ Integration tests verify data flows work with real database  
✅ E2E tests verify critical user workflows end-to-end  
✅ Developers get <5 second feedback in watch mode  
✅ CI/CD runs in <15 minutes and blocks bad merges  
✅ New features include tests before merge  
✅ Bugs get regression tests before fixes  
✅ Team confidence in production deployments increases  

---

## Out of Scope (Phase 2+)

These items are valuable but not included in Phase 1:

- Visual regression testing (Percy, Chromatic)
- Performance testing / benchmarking
- Load testing
- Accessibility automated testing (a11y)
- Contract testing with external APIs
- Chaos engineering / failure injection

These can be added as separate phases once the foundation is solid.

---

## Implementation Order

1. **Foundation** — Configure Vitest, Playwright, Docker Compose
2. **Fixtures & Helpers** — Create reusable test data and utilities
3. **Unit Tests** — Add tests for existing components and utilities
4. **Integration Tests** — Add tests for API routes and database flows
5. **E2E Tests** — Add tests for critical user workflows
6. **CI/CD** — Set up GitHub Actions workflow
7. **Documentation** — Write team testing guide
8. **Review & Refinement** — Gather team feedback and iterate

---

## Appendix: Key Dependencies

**Testing Framework:**
- `vitest` — Fast unit testing framework
- `@testing-library/react` — React component testing utilities
- `@playwright/test` — E2E testing framework

**Infrastructure:**
- `docker` — Container runtime
- `docker-compose` — Multi-container orchestration

**Supporting Tools:**
- Coverage reporting (built into Vitest)
- GitHub Actions — CI/CD platform
- Codecov — Coverage tracking (optional)

---

**Design approved:** August 13, 2026  
**Ready for implementation:** Yes
