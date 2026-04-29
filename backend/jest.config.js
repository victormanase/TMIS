/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.test.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: { strict: false } }] },
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  setupFilesAfterFramework: undefined,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/matchers.ts'],
  testTimeout: 30000,
  verbose: true,
};
