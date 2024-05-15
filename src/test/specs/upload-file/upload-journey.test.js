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
import { findUploaderUrl } from '~/src/helpers/uploader-url'

const cleanFilename = config.get('cleanFileName')
const scanTimeout = config.get('uploadScanTimeout')
const redirectUrl = config.get('redirectUrl')

describe('CDP File uploader Smoke Test', () => {
  jest.setTimeout(scanTimeout)
  const uploaderBaseUrl = findUploaderUrl()

  it('should initiate a file upload', async () => {
    const { uploadId, uploadUrl, statusUrl } = await initiateWithPayload()
    expect(validate(uploadId)).toBeTruthy()
    expect(uploadUrl).toMatch(`${uploaderBaseUrl}/upload-and-scan/${uploadId}`)
    expect(statusUrl).toMatch(`${uploaderBaseUrl}/status/${uploadId}`)
    const { uploadDetails } = await uploadStatus(statusUrl)
    expect(uploadDetails.uploadStatus).toEqual('initiated')
  })

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

  it('should scan file as clean', async () => {
    const { statusUrl } = await cleanFileUpload()
    const { isUploadReady } = await findFileDetailsWhenReady(statusUrl)
    expect(isUploadReady).toBeTruthy()
    const { uploadStatus, fileDetails } = await findFileDetails(statusUrl)
    expect(uploadStatus).toEqual('ready')
    expect(fileDetails.fileStatus).toEqual('complete')
  })

  it('should reject file as infected', async () => {
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
