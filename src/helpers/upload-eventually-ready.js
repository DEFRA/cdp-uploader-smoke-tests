import { setTimeout } from 'node:timers/promises'

import { config } from '~/src/config'
import { getStatus } from '~/src/helpers/uploader-fetch'

const pollInterval = config.get('uploadScanInterval')
const maxAttempts = config.get('uploadMaxAttempts')

async function uploadEventuallyReady(statusUrl) {
  let isUploadReady = false
  let attempts = 0
  do {
    const {
      uploadStatus,
      form: { file1 }
    } = await getStatus(statusUrl)
    if (uploadStatus === 'ready' && file1.fileStatus !== 'pending') {
      isUploadReady = true
    }
    attempts++
    await setTimeout(pollInterval)
  } while (!isUploadReady && attempts < maxAttempts)
  return { isUploadReady, attempts }
}

export { uploadEventuallyReady }
