import FormData from 'form-data'
import { readFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'

import { config } from '~/src/config'
import {
  initiateUpload,
  uploadFile,
  uploadStatus
} from '~/src/helpers/uploader-fetch'

const pollInterval = config.get('uploadScanInterval')
const maxAttempts = config.get('uploadMaxAttempts')
const cleanFilename = config.get('cleanFileName')
const virusFilename = config.get('virusFileName')
const destinationBucket = config.get('smokeTestBucket')
const destinationPath = config.get('smokeTestPath')
const redirectUrl = config.get('redirectUrl')
const initiatePayload = {
  redirect: redirectUrl,
  destinationBucket,
  destinationPath
}

async function readCleanFile() {
  return await readFileToUpload(cleanFilename)
}

async function readVirusFile() {
  return await readFileToUpload(virusFilename)
}

async function readFileToUpload(filename) {
  return await readFile(`./testdata/${filename}`)
}

async function createFormPayloadWithFile(file, filename) {
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

async function findFileDetailsWhenReady(statusUrl) {
  let isUploadReady = false
  let attempts = 0
  do {
    const { uploadStatus, fileDetails } = await findFileDetails(statusUrl)
    if (uploadStatus === 'ready' && fileDetails.fileStatus !== 'pending') {
      isUploadReady = true
    }
    attempts++
    await setTimeout(pollInterval)
  } while (!isUploadReady && attempts < maxAttempts)
  return { isUploadReady, attempts }
}

async function cleanFileUpload() {
  const cleanFile = await readCleanFile()
  return await initiateBufferAndUpload(
    cleanFile,
    cleanFilename,
    initiatePayload
  )
}

async function virusFileUpload() {
  const virusFile = await readVirusFile()
  return await initiateBufferAndUpload(
    virusFile,
    virusFilename,
    initiatePayload
  )
}

async function initiateWithPayload() {
  return await initiateUpload(initiatePayload)
}

async function initiateBufferAndUpload(file, filename, initiatePayload) {
  const formPayload = await createFormPayloadWithFile(file, filename)
  return await initiateAndUpload(formPayload, initiatePayload)
}

async function initiateAndUpload(formPayload, initiatePayload) {
  const { uploadId, uploadUrl, statusUrl } =
    await initiateUpload(initiatePayload)
  const { uploadStatusCode, location } = await uploadFile(
    uploadUrl,
    formPayload
  )
  return { uploadId, uploadStatusCode, statusUrl, location }
}

export {
  cleanFileUpload,
  findFileDetails,
  findFileDetailsWhenReady,
  initiateWithPayload,
  virusFileUpload
}
