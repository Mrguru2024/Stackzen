const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: '<rootDir>/jest.env.js',
  testPathIgnorePatterns: [
    '<rootDir>/tests/integration/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/e2e/',
    '<rootDir>/.history/',
  ],
  /**
   * Jest's haste-map walks the workspace at startup. Stale Prisma generator
   * outputs (e.g. `prisma/.generated/client`) can leave behind an empty
   * `package.json` on Windows that crashes haste-map. The active client is
   * pinned via `moduleNameMapper` to `prisma/.generated/current`, so we can
   * safely ignore the legacy artifact paths here.
   */
  modulePathIgnorePatterns: [
    '<rootDir>/prisma/\\.generated/client/',
    '<rootDir>/prisma/\\.generated/client_',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@prisma/client$': '<rootDir>/prisma/.generated/current',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.stories.tsx',
    '!**/*.test.tsx',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
};

module.exports = createJestConfig(customJestConfig);
