import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/apps/backend',
    '<rootDir>/apps/orchestrator',
  ],
  coverageDirectory: '<rootDir>/coverage',
};

export default config;
