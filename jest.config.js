module.exports = {
  rootDir: '.',
  testEnvironment: 'allure-jest/node',
  testEnvironmentOptions: {
    resultsDir: './allure-results'
  },
  verbose: true,
  testMatch: ['**/src/**/*.test.js']
}
