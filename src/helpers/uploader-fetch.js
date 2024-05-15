import fetch from 'node-fetch'

import { findUploaderUrl } from '~/src/helpers/uploader-url'

async function initiateUpload(payload) {
  const uploaderBaseUrl = findUploaderUrl()
  return await fetch(`${uploaderBaseUrl}/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
    .then((response) => response.json())
    .then((body) => {
      return {
        uploadId: body.uploadId,
        uploadUrl: body.uploadAndScanUrl,
        statusUrl: body.statusUrl
      }
    })
}
async function uploadFile(uploadUrl, payload) {
  return await fetch(uploadUrl, {
    method: 'POST',
    redirect: 'manual',
    body: payload
  }).then((response) => {
    return {
      uploadStatusCode: response.status,
      location: response.headers.get('location')
    }
  })
}

async function uploadStatus(statusUrl) {
  const response = await fetch(statusUrl, { method: 'GET' })
  const payload = await response.json()
  return {
    uploadDetails: payload
  }
}

export { initiateUpload, uploadFile, uploadStatus }
