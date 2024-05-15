import { config } from '~/src/config'

const envVarBucket = config.get('s3UploadBucket.bucket')
const environment = process.env.ENVIRONMENT

function uploaderBucket() {
  if (envVarBucket) {
    return envVarBucket
  }
  if (environment) {
    return config.get(`s3UploadBucket.environments.${environment}`)
  }
  throw new Error('No bucket found')
}

export { uploaderBucket }
