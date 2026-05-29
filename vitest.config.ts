import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: {
      navigator: {
        userAgent: 'Vitest/JSDOM',
        userAgentData: { brands: [], mobile: false, platform: 'Linux' }
      }
    },
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'electron/',
      ]
    },
    setupFiles: [path.resolve(__dirname, './tests/setup.ts')]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cdc': path.resolve(__dirname, '../../.cdc'),
    },
  },
});
