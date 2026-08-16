import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../health/route';

describe('Health Check API (integration)', () => {
  // These tests demonstrate integration testing patterns.
  // The health endpoint is stateless, but the setup/teardown pattern
  // shown here applies to endpoints that read/write database records.

  beforeEach(async () => {
    // In real integration tests, this would:
    // - Start a test database transaction
    // - Insert test fixtures
    // - Set up any required state
    console.log('Integration test setup');
  });

  afterEach(async () => {
    // In real integration tests, this would:
    // - Rollback the test transaction
    // - Clean up any created records
    // - Reset state
    console.log('Integration test teardown');
  });

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

  it('timestamp is recent (within last minute)', async () => {
    const response = await GET();
    const data = await response.json();

    const timestamp = new Date(data.timestamp).getTime();
    const now = Date.now();
    const diff = now - timestamp;

    // Should be within 60 seconds
    expect(diff).toBeLessThan(60000);
    expect(diff).toBeGreaterThanOrEqual(0);
  });
});
