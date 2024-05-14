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
  smokeTestPath: {
    doc: 'S3 prefix path for test uploads',
    format: String,
    default: 'smoke-test',
    env: 'UPLOADER_SMOKE_TEST_PATH'
  },
  uploadScanInterval: {
    doc: 'How long to delay each poll for scan completion',
    format: Number,
    default: 3000,
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
  },
  cleanFileName: {
    doc: 'A file to upload that is clean',
    format: String,
    default: 'clean-file.txt',
    env: 'CLEAN_FILE_NAME'
  },
  virusFileName: {
    doc: 'A file to upload that is a virus',
    format: String,
    default: 'eicar-virus.txt',
    env: 'VIRUS_FILE_NAME'
  },
  redirectUrl: {
    doc: 'A URL to redirect to after upload',
    format: String,
    default: 'http://httpstat.us/200',
    env: 'UPLOAD_REDIRECT_URL'
  }
})

config.validate({ allowed: 'strict' })

export { config }
