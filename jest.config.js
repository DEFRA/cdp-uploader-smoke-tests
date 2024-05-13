module.exports = {
  rootDir: 'src',
  testEnvironment: 'allure-jest/node',
  testEnvironmentOptions: {
    resultsDir: './allure-results'
  },
  verbose: true,
  testMatch: ['**/src/test/**/*.test.js']
}
