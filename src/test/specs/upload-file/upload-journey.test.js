import { validate } from 'uuid'

import { config } from '~/src/config'
import { uploadStatus } from '~/src/helpers/uploader-fetch'
import {
  findFileDetails,
  findFileDetailsWhenReady,
  cleanFileUpload,
  initiateWithPayload,
  virusFileUpload
} from '~/src/helpers/upload-helpers'

const uploaderBaseUrl = config.get('uploaderBaseUrl')
const cleanFilename = config.get('cleanFileName')
const uploadTimeout = config.get('uploadOnlyTimeout')
const scanTimeout = config.get('uploadScanTimeout')
const redirectUrl = config.get('redirectUrl')

describe('CDP File uploader Smoke Test', () => {
  it('should initiate a file upload', async () => {
    const { uploadId, uploadUrl, statusUrl } = await initiateWithPayload()
    expect(validate(uploadId)).toBeTruthy()
    expect(uploadUrl).toMatch(`${uploaderBaseUrl}/upload-and-scan/${uploadId}`)
    expect(statusUrl).toMatch(`${uploaderBaseUrl}/status/${uploadId}`)
    const { uploadDetails } = await uploadStatus(statusUrl)
    expect(uploadDetails.uploadStatus).toEqual('initiated')
  })

  describe('Start file upload journey', () => {
    jest.setTimeout(uploadTimeout)

    it('should upload a file', async () => {
      const { uploadId, uploadStatusCode, statusUrl, location } =
        await cleanFileUpload()
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
        const { statusUrl } = await cleanFileUpload()
        const { isUploadReady } = await findFileDetailsWhenReady(statusUrl)
        expect(isUploadReady).toBeTruthy()
        const { uploadStatus, fileDetails } = await findFileDetails(statusUrl)
        expect(uploadStatus).toEqual('ready')
        expect(fileDetails.fileStatus).toEqual('complete')
      })

      it('should get rejected as infected', async () => {
        const { statusUrl } = await virusFileUpload()
        const { isUploadReady } = await findFileDetailsWhenReady(statusUrl)
        expect(isUploadReady).toBeTruthy()
        const { uploadStatus, rejectedFiles, fileDetails } =
          await findFileDetails(statusUrl)
        expect(uploadStatus).toEqual('ready')
        expect(fileDetails.fileStatus).toEqual('rejected')
        expect(rejectedFiles).toBe(1)
      })
    })
  })
})
