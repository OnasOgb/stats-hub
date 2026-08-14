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
