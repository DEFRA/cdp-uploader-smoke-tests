const environments = [
  'infra-dev',
  'management',
  'dev',
  'test',
  'perf-test',
  'prod'
]

function inCdpEnvironment(activeEnvironments) {
  const env = process.env.ENVIRONMENT
  if (env) {
    const inEnv = environments.includes(env)
    if (Array.isArray(activeEnvironments)) {
      return inEnv && activeEnvironments.includes(env)
    }
    if (activeEnvironments) {
      return inEnv && activeEnvironments === env
    }
    return inEnv
  }
  return false
}

export { inCdpEnvironment }
