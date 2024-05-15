import { config } from '~/src/config'

const envVarBucket = config.get('s3UploadBucket.environment')
const environment = process.env.ENVIRONMENT

function uploaderBucket() {
  if (!envVarBucket && environment && environment !== 'local') {
    return config.get(`s3UploadBucket.environments.${environment}`)
  }
  if (!envVarBucket && (!environment || environment === 'local')) {
    throw new Error('No bucket found')
  }
  return envVarBucket
}

export { uploaderBucket }
