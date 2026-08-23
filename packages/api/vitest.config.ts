import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    fileParallelism: false, // Prevent concurrency issues with DB
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
