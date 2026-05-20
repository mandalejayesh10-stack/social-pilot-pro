module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest'],
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['**/*.(t|j)s'],
};
