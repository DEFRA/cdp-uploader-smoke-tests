import { config } from '~/src/config'

const configBaseUrl = config.get('uploaderBaseUrl')
const configLocalBaseUrl = config.get('localUploaderBaseUrl')
const environment = process.env.ENVIRONMENT

function findUploaderUrl() {
  if (configBaseUrl) {
    return configBaseUrl
  }
  if (!environment || environment === 'local') {
    return configLocalBaseUrl
  }
  return `https://cdp-uploader.${environment}.cdp-int.defra.cloud`
}

export { findUploaderUrl }
