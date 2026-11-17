import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      clearMocks: true,
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        // Entry points, type declarations and the test harness itself are not
        // behaviour worth measuring.
        exclude: [
          'src/main.tsx',
          'src/vite-env.d.ts',
          'src/test/**',
          '**/*.test.{ts,tsx}',
        ],
        reporter: ['text', 'html', 'lcov', 'json-summary'],
        reportsDirectory: './coverage',
        thresholds: {
          lines: 90,
          statements: 90,
          branches: 80,
        },
      },
    },
  }),
);
