import FormData from 'form-data'
import { readFile } from 'node:fs/promises'

import {
  initiateUpload,
  uploadFile,
  uploadStatus
} from '~/src/helpers/uploader-fetch'

async function createPayload(filename) {
  const file = await readFile(`./${filename}`)
  const payload = new FormData()
  payload.append('field1', 'val1')
  payload.append('field2', 'val2')
  payload.append('file1', file, filename)
  return payload
}

async function findFileDetails(statusUrl) {
  const { uploadDetails } = await uploadStatus(statusUrl)
  expect(uploadDetails.files).toBeDefined()
  expect(uploadDetails.files.length).toEqual(1)
  return {
    rejectedFiles: uploadDetails.numberOfRejectedFiles,
    uploadStatus: uploadDetails.uploadStatus,
    fileDetails: uploadDetails?.files[0]
  }
}

async function initiateAndUpload(filename, initiatePayload) {
  const { uploadId, uploadUrl, statusUrl } =
    await initiateUpload(initiatePayload)
  const payload = await createPayload(filename)
  const { uploadStatusCode, location } = await uploadFile(uploadUrl, payload)
  return { uploadId, uploadStatusCode, statusUrl, location }
}

export { createPayload, findFileDetails, initiateAndUpload }
