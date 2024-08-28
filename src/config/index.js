import convict from 'convict'

const environment = process.env.ENVIRONMENT || 'local'

const defaultBuckets = {
  local: 'my-bucket',
  'infra-dev': 'cdp-infra-dev-cdp-example-node-frontend-f5a9fee866ed',
  dev: 'cdp-dev-cdp-example-node-frontend-9954cf787c89',
  test: 'cdp-test-cdp-example-node-frontend-5c7d3242ea6f',
  'perf-test': 'cdp-perf-test-cdp-example-node-frontend-d4ed1e4916f3',
  prod: 'cdp-prod-cdp-example-node-frontend-6ded3a3eafe6'
}

const defaultBaseUrl =
  environment === 'local'
    ? 'http://localhost:7337'
    : `https://cdp-uploader.${environment}.cdp-int.defra.cloud`

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
  environment: {
    doc: 'Environment to test',
    format: String,
    default: 'local',
    env: 'ENVIRONMENT'
  },
  uploaderBaseUrl: {
    doc: 'Uploader Base URL',
    format: String,
    default: defaultBaseUrl,
    nullable: false,
    env: 'CDP_UPLOADER_BASE_URL'
  },
  s3UploadBucket: {
    doc: 'S3 bucket for uploads',
    format: String,
    default: defaultBuckets[environment],
    env: 'UPLOADER_BUCKET'
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
  }
})

config.validate({ allowed: 'strict' })

export { config }
