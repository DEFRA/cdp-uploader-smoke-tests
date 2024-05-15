function isInAnEnvironment() {
  return process.env.ENVIRONMENT && process.env.ENVIRONMENT !== 'local'
}

export { isInAnEnvironment }
