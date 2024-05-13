import { validate } from 'uuid'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { readFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'

import { config } from '~/src/config'

const uploaderBaseUrl = config.get('uploaderBaseUrl')

const redirectUrl = 'http://httpstat.us/200'

const initiatePayload = {
  redirect: redirectUrl,
  destinationBucket: 'my-bucket',
  destinationPath: 'my-uploads'
}
const scanTimeout = 1000 * 60
const maxAttempts = 20
const pollInterval = 1000
const cleanFilename = 'unicorn-small.jpg'
const virusFilename = 'unicorn-virus.jpg'

async function initiateUpload() {
  return await fetch(`${uploaderBaseUrl}/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(initiatePayload)
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

async function createPayload(filename) {
  const file = await readFile(`./${filename}`)
  const payload = new FormData()
  payload.append('field1', 'val1')
  payload.append('field2', 'val2')
  payload.append('file1', file, filename)
  return payload
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

async function initiateAndUpload(filename) {
  const { uploadId, uploadUrl, statusUrl } = await initiateUpload()
  const payload = await createPayload(filename)
  const { uploadStatusCode, location } = await uploadFile(uploadUrl, payload)
  expect(uploadStatusCode).toEqual(302)
  return { uploadId, statusUrl, location }
}

describe('CDP File uploader Smoke Test', () => {
  it('should initiate a file upload', async () => {
    const { uploadId, uploadUrl, statusUrl } = await initiateUpload()
    expect(validate(uploadId)).toBeTruthy()
    expect(uploadUrl).toMatch(`${uploaderBaseUrl}/upload-and-scan/${uploadId}`)
    expect(statusUrl).toMatch(`${uploaderBaseUrl}/status/${uploadId}`)
    const { uploadDetails } = await uploadStatus(statusUrl)
    expect(uploadDetails.uploadStatus).toEqual('initiated')
  })

  describe('Start file upload journey', () => {
    it('should upload a file', async () => {
      const { uploadId, statusUrl, location } =
        await initiateAndUpload(cleanFilename)
      expect(location).toEqual(`${redirectUrl}?uploadId=${uploadId}`)
      const { uploadStatus, fileDetails } = await findFileDetails(statusUrl)
      expect(uploadStatus).toBeDefined()
      expect(fileDetails?.fileStatus).toBeDefined()
      expect(validate(fileDetails.fileId)).toBeTruthy()
      expect(fileDetails.filename).toEqual(cleanFilename)
      // Virus scanning may already be complete
      expect(['pending', 'ready']).toContain(uploadStatus)
      expect(['pending', 'ready']).toContain(fileDetails.fileStatus)
    })

    describe('Checking file scanning', () => {
      jest.setTimeout(scanTimeout)

      it('should get scanned as clean', async () => {
        const { statusUrl } = await initiateAndUpload(cleanFilename)
        let isUploadReady = false
        let attempts = 0
        do {
          const { uploadStatus, fileDetails } = await findFileDetails(statusUrl)
          if (
            uploadStatus === 'ready' &&
            fileDetails.fileStatus !== 'pending'
          ) {
            isUploadReady = true
          }
          attempts++
          await setTimeout(pollInterval)
        } while (!isUploadReady && attempts < maxAttempts)
        expect(isUploadReady).toBeTruthy()
        const { fileDetails } = await findFileDetails(statusUrl)
        expect(fileDetails.fileStatus).toEqual('complete')
      })
    })

    // This depends on the test harness being able to serve the virus file
    it('should get rejected as infected', async () => {
      const { statusUrl } = await initiateAndUpload(virusFilename)
      let isUploadReady = false
      let attempts = 0
      const maxAttempts = 20
      const pollInterval = 1000
      do {
        const { uploadStatus, fileDetails } = await findFileDetails(statusUrl)
        if (uploadStatus === 'ready' && fileDetails.fileStatus !== 'pending') {
          isUploadReady = true
        }
        attempts++
        await setTimeout(pollInterval)
      } while (!isUploadReady && attempts < maxAttempts)
      expect(isUploadReady).toBeTruthy()
      const { rejectedFiles, fileDetails } = await findFileDetails(statusUrl)
      expect(fileDetails.fileStatus).toEqual('rejected')
      expect(rejectedFiles).toBe(1)
    })
  })
})
