import convict from 'convict'

const config = convict({
  logLevel: {
    doc: 'Logging level',
    format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
    default: 'info',
    env: 'LOG_LEVEL'
  },
  httpProxy: {
    doc: 'HTTP Proxy',
    format: String,
    nullable: true,
    default: null,
    env: 'CDP_HTTP_PROXY'
  },
  httpsProxy: {
    doc: 'HTTPS Proxy',
    format: String,
    nullable: true,
    default: null,
    env: 'CDP_HTTPS_PROXY'
  },
  uploaderBaseUrl: {
    doc: 'Uploader Base URL',
    format: String,
    default: 'http://localhost:7337',
    env: 'CDP_UPLOADER_BASE_URL'
  }
})

config.validate({ allowed: 'strict' })

export { config }
