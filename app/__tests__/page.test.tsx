import { describe, it, expect } from 'vitest';
import { cn } from '@/shared/lib/utils';

describe('cn utility function', () => {
  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-2', 'py-1');
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('bg-white', isActive && 'border-blue-500');
    expect(result).toContain('bg-white');
    expect(result).toContain('border-blue-500');
  });

  it('should resolve conflicting Tailwind utility classes', () => {
    // When conflicting utilities are passed, tailwind-merge resolves them
    const result = cn('px-2', 'px-4');
    // px-4 should override px-2
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['rounded-lg', 'shadow-md']);
    expect(result).toContain('rounded-lg');
    expect(result).toContain('shadow-md');
  });

  it('should handle empty inputs', () => {
    const result = cn('', undefined, null as any, false);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
