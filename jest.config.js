module.exports = {
  projects: [
    {
      displayName: 'client',
      rootDir: '<rootDir>/src/client',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/client/src/setupTests.ts'],
    },
    {
      displayName: 'server',
      rootDir: '<rootDir>/src/server',
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: 'shared',
      rootDir: '<rootDir>/src/shared',
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
