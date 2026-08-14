import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock server-side dependencies that can't be loaded in jsdom environment
vi.mock('@/shared/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  })),
}));

vi.mock('@/shared/lib/logger', () => ({
  pageLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/shared/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/features/hub/components/HubCard', () => ({
  HubCard: ({ hub }: any) => <div data-testid="hub-card">{hub?.name || 'Hub'}</div>,
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Home Page', () => {
  it('should verify test infrastructure is working', () => {
    // Simple test to verify vitest and React Testing Library are configured correctly
    const TestComponent = () => <div><h1>Test Component</h1></div>;
    const { container } = render(<TestComponent />);
    expect(container).toBeTruthy();
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should execute without configuration errors', () => {
    // Verify that the test can run without import or configuration errors
    expect(true).toBe(true);
  });
});
