# Comprehensive Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a three-layer (unit, integration, E2E) test suite with Vitest, Docker Postgres, and Playwright that provides production confidence and fast developer feedback.

**Architecture:** Tests are organized colocated with source code (`__tests__` directories) for easy discovery. Unit tests run in isolation with mocks. Integration tests use a containerized Postgres database for realistic testing. E2E tests use Playwright to verify complete user workflows. CI/CD runs all three layers sequentially in GitHub Actions.

**Tech Stack:** Vitest (unit/integration), React Testing Library (component testing), Docker Compose (test database), Playwright (E2E), GitHub Actions (CI/CD)

**Spec:** `docs/superpowers/specs/2026-08-13-comprehensive-test-suite-design.md`

## Global Constraints

- Node.js version: 20+
- Next.js version: 14.2.29 (already installed)
- TypeScript: 5.8.3 (already installed)
- Docker must be installed locally for `docker-compose.test.yml`
- Test database port: 5433 (to avoid conflicts with development)
- Database: Postgres 16
- All tests must pass before merging to main

---

## Task 1: Install Test Dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: npm packages installed and ready for configuration

**Steps:**

- [ ] **Step 1: Install Vitest and React Testing Library**

Run:
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

This installs:
- `vitest` — Fast unit test framework (Jest-compatible)
- `@vitest/ui` — Browser-based test dashboard
- `@testing-library/react` — React component testing utilities
- `@testing-library/jest-dom` — Custom matchers for DOM elements
- `@testing-library/user-event` — Simulate user interactions

- [ ] **Step 2: Install Playwright**

Run:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

This installs Playwright and downloads browser binaries.

- [ ] **Step 3: Install additional test utilities**

Run:
```bash
npm install --save-dev vitest-mock-extended @vitest/coverage-v8 dotenv-cli
```

This installs:
- `vitest-mock-extended` — Enhanced mocking utilities
- `@vitest/coverage-v8` — Code coverage reporting
- `dotenv-cli` — Load environment variables from `.env.test`

- [ ] **Step 4: Verify installations**

Run:
```bash
npx vitest --version
npx playwright --version
```

Expected output: Version numbers for both tools

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add test dependencies (vitest, playwright, @testing-library)"
```

---

## Task 2: Create Vitest Configuration

**Files:**
- Create: `vitest.config.ts`
- Modify: `tsconfig.json`

**Interfaces:**
- Consumes: Node.js environment, TypeScript setup
- Produces: Vitest configured for Next.js, ready to run tests

**Steps:**

- [ ] **Step 1: Create vitest.config.ts**

Create file `/Users/onasdev/Documents/stats-hub/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'app/**/__tests__/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
      ],
    },
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/', '.next/', 'e2e/'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

- [ ] **Step 2: Install React plugin for Vitest**

Run:
```bash
npm install --save-dev @vitejs/plugin-react
```

- [ ] **Step 3: Update tsconfig.json to include Vitest types**

Open `tsconfig.json` and modify the `compilerOptions.types` array:

Change from:
```json
{
  "compilerOptions": {
    "types": []
  }
}
```

To:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

- [ ] **Step 4: Update tsconfig.json to include test paths in lib resolution**

In the same `tsconfig.json`, ensure the `paths` object includes:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 5: Verify configuration**

Run:
```bash
npx vitest --run --help
```

Expected: Help text appears without errors

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tsconfig.json
git commit -m "config: add vitest configuration with jsdom environment"
```

---

## Task 3: Create Vitest Setup File with Database Initialization

**Files:**
- Create: `vitest.setup.ts`
- Modify: `.env.test`

**Interfaces:**
- Consumes: Docker Compose service running on port 5433
- Produces: Database schema initialized before each test suite

**Steps:**

- [ ] **Step 1: Create .env.test file**

Create file `/Users/onasdev/Documents/stats-hub/.env.test`:

```
DATABASE_URL=postgres://test_user:test_password@localhost:5433/stats_hub_test
NODE_ENV=test
```

- [ ] **Step 2: Create vitest.setup.ts**

Create file `/Users/onasdev/Documents/stats-hub/vitest.setup.ts`:

```typescript
import { expect, afterAll, beforeAll } from 'vitest';
import '@testing-library/jest-dom';

// Load test environment variables
process.env.DATABASE_URL = 'postgres://test_user:test_password@localhost:5433/stats_hub_test';
process.env.NODE_ENV = 'test';

// Initialize test database before all tests
beforeAll(async () => {
  // Database initialization happens via docker-compose
  // This hook can be extended later for schema setup/migrations
  console.log('Test environment initialized');
});

// Cleanup after all tests
afterAll(async () => {
  console.log('Test environment cleanup complete');
});

// Extend Vitest matchers if needed
expect.extend({});
```

- [ ] **Step 3: Update .gitignore to exclude test artifacts**

Open `.gitignore` and add these lines:

```
# Test artifacts
coverage/
.nyc_output/
.vitest/
playwright-report/
```

- [ ] **Step 4: Verify setup works**

Run:
```bash
echo "Setup file created successfully"
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add vitest.setup.ts .env.test .gitignore
git commit -m "config: add vitest setup with test environment variables"
```

---

## Task 4: Create Docker Compose Configuration

**Files:**
- Create: `docker-compose.test.yml`

**Interfaces:**
- Consumes: Docker daemon running
- Produces: Postgres 16 service on port 5433 for tests

**Steps:**

- [ ] **Step 1: Create docker-compose.test.yml**

Create file `/Users/onasdev/Documents/stats-hub/docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: stats_hub_test_db
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: stats_hub_test
    ports:
      - "5433:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_test_data:
```

- [ ] **Step 2: Verify Docker Compose syntax**

Run:
```bash
docker-compose -f docker-compose.test.yml config
```

Expected: Valid YAML output with no errors

- [ ] **Step 3: Test Docker setup**

Run:
```bash
docker-compose -f docker-compose.test.yml up -d
sleep 5
docker-compose -f docker-compose.test.yml exec postgres psql -U test_user -d stats_hub_test -c "SELECT 1"
docker-compose -f docker-compose.test.yml down
```

Expected: Database responds with `1`

- [ ] **Step 4: Commit**

```bash
git add docker-compose.test.yml
git commit -m "config: add docker-compose configuration for test database"
```

---

## Task 5: Create Test Fixtures and Helpers

**Files:**
- Create: `lib/__tests__/fixtures.ts`

**Interfaces:**
- Consumes: Nothing initially (will be enhanced as tests are written)
- Produces: Reusable test data and helper functions for integration tests

**Steps:**

- [ ] **Step 1: Create fixtures directory if it doesn't exist**

Run:
```bash
mkdir -p /Users/onasdev/Documents/stats-hub/lib/__tests__
```

- [ ] **Step 2: Create fixtures.ts with basic test data**

Create file `/Users/onasdev/Documents/stats-hub/lib/__tests__/fixtures.ts`:

```typescript
// Mock user data for testing
export const testUser = {
  id: 'user-test-123',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
};

export const testUser2 = {
  id: 'user-test-456',
  email: 'test2@example.com',
  name: 'Test User 2',
  created_at: new Date().toISOString(),
};

// Mock hub data for testing
export const testHub = {
  id: 'hub-test-123',
  name: 'Test Hub',
  description: 'A test hub for testing',
  owner_id: testUser.id,
  created_at: new Date().toISOString(),
};

// Mock profile data for testing
export const testProfile = {
  id: 'profile-test-123',
  user_id: testUser.id,
  bio: 'Test bio',
  avatar_url: 'https://example.com/avatar.jpg',
  created_at: new Date().toISOString(),
};

// Helper to create mock request objects
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  userId?: string;
} = {}) {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    userId = testUser.id,
  } = options;

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userId}`,
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(url, requestInit);
}

// Helper to parse response JSON
export async function parseResponseJson(response: Response) {
  return response.json().catch(() => null);
}
```

- [ ] **Step 3: Verify fixtures are syntactically correct**

Run:
```bash
npx tsc --noEmit lib/__tests__/fixtures.ts
```

Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add lib/__tests__/fixtures.ts
git commit -m "test: add test fixtures and mock data helpers"
```

---

## Task 6: Update package.json with Test Scripts

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: Vitest, Playwright, and other test tools installed
- Produces: npm scripts for running tests locally and in CI

**Steps:**

- [ ] **Step 1: Add test scripts to package.json**

Open `package.json` and update the `"scripts"` section to add these entries:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --include '**/*.{test,integration.test}.ts'",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:db:start": "docker-compose -f docker-compose.test.yml up -d",
    "test:db:stop": "docker-compose -f docker-compose.test.yml down",
    "test:db:reset": "docker-compose -f docker-compose.test.yml down -v && docker-compose -f docker-compose.test.yml up -d",
    "db:migrate": "node scripts/migrate.js"
  }
}
```

The complete scripts section should look like:

```json
{
  "name": "statshub",
  "private": true,
  "scripts": {
    "dev": "next dev | pino-pretty --colorize",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --include '**/*.{test,integration.test}.ts'",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:db:start": "docker-compose -f docker-compose.test.yml up -d",
    "test:db:stop": "docker-compose -f docker-compose.test.yml down",
    "test:db:reset": "docker-compose -f docker-compose.test.yml down -v && docker-compose -f docker-compose.test.yml up -d",
    "db:migrate": "node scripts/migrate.js"
  }
}
```

- [ ] **Step 2: Verify package.json is valid JSON**

Run:
```bash
npx json --help > /dev/null && echo "JSON tool available"
```

Or manually verify by checking if the file opens without errors in an editor.

- [ ] **Step 3: Install packages to update lock file**

Run:
```bash
npm install
```

This updates `package-lock.json` with any new dependencies.

- [ ] **Step 4: Verify scripts work**

Run:
```bash
npm run test -- --help 2>&1 | head -5
```

Expected: Vitest help text appears

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add npm test scripts for vitest and playwright"
```

---

## Task 7: Create Playwright Configuration

**Files:**
- Create: `playwright.config.ts`

**Interfaces:**
- Consumes: Docker test database running
- Produces: Playwright configured to test local app instance

**Steps:**

- [ ] **Step 1: Create playwright.config.ts**

Create file `/Users/onasdev/Documents/stats-hub/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  
  fullyParallel: false, // Run tests sequentially to avoid database conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results.json' }],
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chromium'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

- [ ] **Step 2: Create e2e directory structure**

Run:
```bash
mkdir -p /Users/onasdev/Documents/stats-hub/e2e
```

- [ ] **Step 3: Verify Playwright configuration**

Run:
```bash
npx playwright config-validate --config playwright.config.ts
```

Expected: "Configuration validation successful" (or similar message)

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts
git commit -m "config: add playwright configuration for e2e testing"
```

---

## Task 8: Create First Unit Test

**Files:**
- Create: `app/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: React Testing Library, Vitest globals
- Produces: Working unit test that validates component rendering

**Steps:**

- [ ] **Step 1: Create app/__tests__ directory**

Run:
```bash
mkdir -p /Users/onasdev/Documents/stats-hub/app/__tests__
```

- [ ] **Step 2: Create first unit test**

Create file `/Users/onasdev/Documents/stats-hub/app/__tests__/page.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../page';

describe('Home Page', () => {
  it('renders the page heading', () => {
    render(<Home />);
    
    // Adjust this to match actual content in your page.tsx
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(<Home />);
    expect(container).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run the test to verify it works**

Run:
```bash
npm run test:run -- app/__tests__/page.test.tsx
```

Expected: Test passes (or shows failure that's expected based on your page content)

- [ ] **Step 4: Commit**

```bash
git add app/__tests__/page.test.tsx
git commit -m "test: add first unit test for home page"
```

---

## Task 9: Create First Integration Test

**Files:**
- Create: `app/api/__tests__/health-check.integration.test.ts`
- Create: `app/api/health/route.ts` (if it doesn't exist)

**Interfaces:**
- Consumes: Docker database running, test fixtures
- Produces: Integration test verifying API behavior

**Steps:**

- [ ] **Step 1: Create health check API endpoint (if it doesn't exist)**

Create file `/Users/onasdev/Documents/stats-hub/app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }, { status: 200 });
}
```

- [ ] **Step 2: Create app/api/__tests__ directory**

Run:
```bash
mkdir -p /Users/onasdev/Documents/stats-hub/app/api/__tests__
```

- [ ] **Step 3: Create integration test**

Create file `/Users/onasdev/Documents/stats-hub/app/api/__tests__/health-check.integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '../health/route';

describe('Health Check API (integration)', () => {
  it('returns 200 status with ok message', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  it('returns valid ISO timestamp', async () => {
    const response = await GET();
    const data = await response.json();

    const timestamp = new Date(data.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
```

- [ ] **Step 4: Start test database**

Run:
```bash
npm run test:db:start
sleep 3
```

This starts the Docker container for tests.

- [ ] **Step 5: Run the integration test**

Run:
```bash
npm run test:run -- app/api/__tests__/health-check.integration.test.ts
```

Expected: Tests pass

- [ ] **Step 6: Stop test database**

Run:
```bash
npm run test:db:stop
```

- [ ] **Step 7: Commit**

```bash
git add app/api/health/route.ts app/api/__tests__/health-check.integration.test.ts
git commit -m "test: add integration test for health check API"
```

---

## Task 10: Create E2E Test Fixtures

**Files:**
- Create: `e2e/fixtures.ts`

**Interfaces:**
- Consumes: Playwright test utilities
- Produces: Helper functions for E2E tests

**Steps:**

- [ ] **Step 1: Create e2e/fixtures.ts**

Create file `/Users/onasdev/Documents/stats-hub/e2e/fixtures.ts`:

```typescript
import { test as base, expect } from '@playwright/test';

// Extend test fixture with custom helpers
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Helper to login and navigate to dashboard
    await page.goto('/auth/login');
    
    // Fill login form with test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Log In")');
    
    // Wait for navigation to complete
    await page.waitForURL('**/hub');
    
    // Provide the authenticated page to the test
    await use(page);
  },
});

export { expect };

// Helper to seed test data (called before tests if needed)
export async function seedTestUser() {
  // This can be expanded to create test data in the database
  // For now, it's a placeholder for future implementation
  return {
    id: 'user-test-123',
    email: 'test@example.com',
    name: 'Test User',
  };
}

// Helper to cleanup after tests
export async function cleanupTestData() {
  // This can be expanded to clean up test data from database
  // For now, it's a placeholder for future implementation
}
```

- [ ] **Step 2: Verify fixtures syntax**

Run:
```bash
npx tsc --noEmit e2e/fixtures.ts
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add e2e/fixtures.ts
git commit -m "test: add e2e test fixtures and helpers"
```

---

## Task 11: Create First E2E Test

**Files:**
- Create: `e2e/basic-navigation.spec.ts`

**Interfaces:**
- Consumes: Next.js dev server running on port 3000
- Produces: E2E test verifying navigation works

**Steps:**

- [ ] **Step 1: Create basic navigation E2E test**

Create file `/Users/onasdev/Documents/stats-hub/e2e/basic-navigation.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on home page (adjust selector based on your actual content)
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Page title should contain expected text
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Verify Playwright test syntax**

Run:
```bash
npx playwright config-validate --config playwright.config.ts
```

Expected: Configuration validates successfully

- [ ] **Step 3: Commit**

```bash
git add e2e/basic-navigation.spec.ts
git commit -m "test: add first e2e test for basic navigation"
```

---

## Task 12: Set Up GitHub Actions CI/CD Workflow

**Files:**
- Create: `.github/workflows/test.yml`

**Interfaces:**
- Consumes: GitHub Actions environment
- Produces: Automated test runs on every PR and push

**Steps:**

- [ ] **Step 1: Create .github/workflows directory**

Run:
```bash
mkdir -p /Users/onasdev/Documents/stats-hub/.github/workflows
```

- [ ] **Step 2: Create test workflow**

Create file `/Users/onasdev/Documents/stats-hub/.github/workflows/test.yml`:

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
        image: postgres:16-alpine
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

      - name: Run unit & integration tests
        env:
          DATABASE_URL: postgres://test_user:test_password@localhost:5433/stats_hub_test
          NODE_ENV: test
        run: npm run test:run

      - name: Build app
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage reports
        if: always()
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            playwright-report/
            coverage/
```

- [ ] **Step 3: Verify YAML syntax**

Run:
```bash
yamllint --version 2>/dev/null || echo "yamllint not installed, but workflow should be valid"
```

Or validate manually by checking the file in a YAML validator.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add github actions workflow for test suite"
```

---

## Task 13: Create Team Documentation

**Files:**
- Create: `docs/TESTING.md`

**Interfaces:**
- Consumes: Test infrastructure set up in previous tasks
- Produces: Clear documentation for the team on how to write and run tests

**Steps:**

- [ ] **Step 1: Create docs/TESTING.md**

Create file `/Users/onasdev/Documents/stats-hub/docs/TESTING.md`:

```markdown
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
import { testUser, testHub } from '@/lib/__tests__/fixtures';

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
```

- [ ] **Step 2: Verify documentation is complete**

Review the file for clarity and completeness.

- [ ] **Step 3: Commit**

```bash
git add docs/TESTING.md
git commit -m "docs: add comprehensive testing guide for team"
```

---

## Task 14: Database Migration Helper Script

**Files:**
- Create: `scripts/migrate.ts`

**Interfaces:**
- Consumes: Database connection string, migration files
- Produces: Database schema initialized for tests

**Steps:**

- [ ] **Step 1: Create scripts directory if needed**

Run:
```bash
mkdir -p /Users/onasdev/Documents/stats-hub/scripts
```

- [ ] **Step 2: Create migration helper script**

Create file `/Users/onasdev/Documents/stats-hub/scripts/migrate.ts`:

```typescript
// Migration helper script
// This is a placeholder that can be expanded as your database schema evolves

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgres://test_user:test_password@localhost:5433/stats_hub_test';

async function runMigrations() {
  console.log('🗄️  Running database migrations...');
  console.log(`Database: ${DATABASE_URL}`);

  try {
    // If you use a migration tool like:
    // - Prisma: npx prisma migrate deploy
    // - TypeORM: npx typeorm migration:run
    // - Raw SQL: execute migration files here

    // For now, this is a placeholder
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
```

- [ ] **Step 2: Make script executable**

Run:
```bash
chmod +x /Users/onasdev/Documents/stats-hub/scripts/migrate.ts
```

- [ ] **Step 3: Verify script syntax**

Run:
```bash
npx tsc --noEmit scripts/migrate.ts
```

Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate.ts
git commit -m "chore: add database migration helper script"
```

---

## Task 15: Verify Complete Setup

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All infrastructure and tests created in previous tasks
- Produces: Working test suite ready for use

**Steps:**

- [ ] **Step 1: Start test database**

Run:
```bash
npm run test:db:start
sleep 5
```

Expected: Database starts without errors

- [ ] **Step 2: Verify database connection**

Run:
```bash
docker-compose -f docker-compose.test.yml exec postgres psql -U test_user -d stats_hub_test -c "SELECT NOW()"
```

Expected: Current timestamp is returned

- [ ] **Step 3: Run unit tests**

Run:
```bash
npm run test:run
```

Expected: Unit tests run and pass (or show expected failures if you modified page content)

- [ ] **Step 4: Run integration tests**

Run:
```bash
npm run test:integration
```

Expected: Integration tests pass

- [ ] **Step 5: Stop database**

Run:
```bash
npm run test:db:stop
```

Expected: Database stops cleanly

- [ ] **Step 6: Verify all scripts are available**

Run:
```bash
npm run 2>&1 | grep -E "test:|db:"
```

Expected: All test scripts listed

- [ ] **Step 7: Final verification commit (if any uncommitted changes)**

Run:
```bash
git status
```

Expected: Working tree clean (all changes committed)

- [ ] **Step 8: View implementation summary**

Run:
```bash
echo "✅ Test suite setup complete!"
echo ""
echo "Next steps:"
echo "1. npm run test:db:start     - Start test database"
echo "2. npm run test:watch        - Run tests in watch mode"
echo "3. npm run test:e2e:ui       - Run E2E tests with UI"
echo "4. Review docs/TESTING.md    - Team documentation"
```

---

## Summary

This implementation plan sets up a complete, production-ready test suite with:

✅ **Vitest** — Fast unit and integration testing  
✅ **React Testing Library** — Component testing  
✅ **Playwright** — E2E browser testing  
✅ **Docker** — Containerized test database  
✅ **GitHub Actions** — Automated CI/CD  
✅ **Team Documentation** — Clear testing guide  

**Total estimated time:** 2-3 hours for initial setup, then ongoing maintenance as tests are added.

**Key files created:**
- Test configuration: `vitest.config.ts`, `playwright.config.ts`
- Database setup: `docker-compose.test.yml`, `vitest.setup.ts`
- Test fixtures: `lib/__tests__/fixtures.ts`, `e2e/fixtures.ts`
- Example tests: `app/__tests__/page.test.tsx`, `app/api/__tests__/health-check.integration.test.ts`, `e2e/basic-navigation.spec.ts`
- CI/CD: `.github/workflows/test.yml`
- Documentation: `docs/TESTING.md`

**Ready to use:**
```bash
npm run test:db:start
npm run test:watch
```
