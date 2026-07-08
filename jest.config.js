module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['cloudfunctions/**/*.js'],
  coverageDirectory: 'coverage'
};