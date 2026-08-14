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
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
