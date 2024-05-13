import { validate } from 'uuid'
import { setTimeout } from 'node:timers/promises'

import { config } from '~/src/config'
import { initiateUpload, uploadStatus } from '~/src/helpers/uploader-fetch'
import {
  findFileDetails,
  initiateAndUpload
} from '~/src/helpers/upload-helpers'

const uploaderBaseUrl = config.get('uploaderBaseUrl')
const destinationBucket = config.get('smokeTestBucket')
const destinationPath = 'smoke-test'
const scanTimeout = config.get('uploadScanTimeout')
const pollInterval = config.get('uploadScanInterval')
const maxAttempts = config.get('uploadMaxAttempts')
const cleanFilename = 'unicorn-small.jpg'
const virusFilename = 'unicorn-virus.jpg'
const redirectUrl = 'http://httpstat.us/200'

const initiatePayload = {
  redirect: redirectUrl,
  destinationBucket,
  destinationPath
}

describe('CDP File uploader Smoke Test', () => {
  it('should initiate a file upload', async () => {
    const { uploadId, uploadUrl, statusUrl } =
      await initiateUpload(initiatePayload)
    expect(validate(uploadId)).toBeTruthy()
    expect(uploadUrl).toMatch(`${uploaderBaseUrl}/upload-and-scan/${uploadId}`)
    expect(statusUrl).toMatch(`${uploaderBaseUrl}/status/${uploadId}`)
    const { uploadDetails } = await uploadStatus(statusUrl)
    expect(uploadDetails.uploadStatus).toEqual('initiated')
  })

  describe('Start file upload journey', () => {
    it('should upload a file', async () => {
      const { uploadId, uploadStatusCode, statusUrl, location } =
        await initiateAndUpload(cleanFilename, initiatePayload)
      expect(uploadStatusCode).toEqual(302)
      expect(location).toEqual(`${redirectUrl}?uploadId=${uploadId}`)
      const { uploadStatus, fileDetails } = await findFileDetails(statusUrl)
      expect(uploadStatus).toBeDefined()
      expect(fileDetails?.fileStatus).toBeDefined()
      expect(validate(fileDetails.fileId)).toBeTruthy()
      expect(fileDetails.filename).toEqual(cleanFilename)
      // Virus scanning may already be complete
      expect(['pending', 'ready']).toContain(uploadStatus)
      expect(['pending', 'complete']).toContain(fileDetails.fileStatus)
    })

    describe('Checking file scanning', () => {
      jest.setTimeout(scanTimeout)

      it('should get scanned as clean', async () => {
        const { statusUrl } = await initiateAndUpload(
          cleanFilename,
          initiatePayload
        )
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
      const { statusUrl } = await initiateAndUpload(
        virusFilename,
        initiatePayload
      )
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
      expect(isUploadReady).toBeTruthy()
      const { rejectedFiles, fileDetails } = await findFileDetails(statusUrl)
      expect(fileDetails.fileStatus).toEqual('rejected')
      expect(rejectedFiles).toBe(1)
    })
  })
})
