import { expect, afterAll, beforeAll } from 'vitest';
import '@testing-library/jest-dom';

// Load test environment variables
process.env.DATABASE_URL = 'postgres://test_user:test_password@localhost:5433/stats_hub_test';

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
