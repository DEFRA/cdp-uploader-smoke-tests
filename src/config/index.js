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
  },
  smokeTestBucket: {
    doc: 'S3 bucket for test uploads',
    format: String,
    default: 'cdp-uploader-smoke-test-bucket',
    env: 'UPLOADER_SMOKE_TEST_BUCKET'
  },
  uploadScanInterval: {
    doc: 'How long to delay each poll for scan completion',
    format: Number,
    default: 2000,
    env: 'UPLOAD_SCAN_INTERVAL'
  },
  uploadMaxAttempts: {
    doc: 'How many times to poll for scan completion',
    format: Number,
    default: 30,
    env: 'UPLOAD_MAX_ATTEMPTS'
  },
  uploadScanTimeout: {
    doc: 'How long to poll for scan completion',
    format: Number,
    default: 1000 * 60,
    env: 'UPLOAD_SCAN_TIMEOUT'
  }
})

config.validate({ allowed: 'strict' })

export { config }
