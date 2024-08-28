import fetch from 'node-fetch'

import { config } from '~/src/config'

const uploaderBaseUrl = config.get('uploaderBaseUrl')

async function initiateUpload(request) {
  return await fetch(`${uploaderBaseUrl}/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) => response.json())
}
async function uploadFile(uploadId, request) {
  const url = `${uploaderBaseUrl}/upload-and-scan/${uploadId}`
  return await fetch(url, {
    method: 'POST',
    redirect: 'manual',
    body: request
  }).then((response) => response.status)
}

async function getStatus(url) {
  return await fetch(url, { method: 'GET' }).then((response) => response.json())
}

export { initiateUpload, uploadFile, getStatus }
