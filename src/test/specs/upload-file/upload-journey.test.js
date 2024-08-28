import { validate } from 'uuid'

import { config } from '~/src/config'
import {
  getStatus,
  initiateUpload,
  uploadFile
} from '~/src/helpers/uploader-fetch'
import { uploadEventuallyReady } from '~/src/helpers/upload-eventually-ready'
import FormData from 'form-data'
import { readFile } from 'node:fs/promises'

const uploaderBaseUrl = config.get('uploaderBaseUrl')
const scanTimeout = config.get('uploadScanTimeout')
const environment = config.get('environment')

const cleanFilename = 'clean-file.txt'
const virusFilename = 'eicar-virus.txt'
const redirectUrl =
  environment === 'local' ? `${uploaderBaseUrl}/health` : 'health'

const s3Bucket = config.get('s3UploadBucket')
const s3Path = config.get('smokeTestPath')

const initiateRequest = {
  redirect: redirectUrl,
  s3Bucket,
  s3Path
}

async function fileUpload(uploadId, filename) {
  const file = await readFile(`./testdata/${filename}`, { encoding: 'utf-8' })

  const uploadRequest = new FormData()
  uploadRequest.append('field1', 'val1')
  uploadRequest.append('field2', 'val2')
  uploadRequest.append('field3', 'val3')
  uploadRequest.append('field3', 'val4')
  uploadRequest.append('field4', '')
  uploadRequest.append('file', file, filename)

  return await uploadFile(uploadId, uploadRequest)
}

describe('CDP File uploader Smoke Test', () => {
  jest.setTimeout(scanTimeout)

  it('should initiate a file upload', async () => {
    const { uploadId, uploadUrl, statusUrl } =
      await initiateUpload(initiateRequest)

    const expectedUploadUrl =
      environment === 'local'
        ? `${uploaderBaseUrl}/upload-and-scan/${uploadId}`
        : `/upload-and-scan/${uploadId}`

    expect(validate(uploadId)).toBeTruthy()
    expect(uploadUrl).toMatch(expectedUploadUrl)
    expect(statusUrl).toMatch(`${uploaderBaseUrl}/status/${uploadId}`)
    const { uploadStatus } = await getStatus(statusUrl)
    expect(uploadStatus).toEqual('initiated')
  })

  it('should upload a file', async () => {
    const { uploadId, statusUrl } = await initiateUpload(initiateRequest)
    const statusCode = await fileUpload(uploadId, cleanFilename)
    expect(statusCode).toEqual(302)

    const {
      uploadStatus,
      form: { file }
    } = await getStatus(statusUrl)

    expect(validate(uploadId)).toBeTruthy()
    expect(validate(file.fileId)).toBeTruthy()
    expect(file.filename).toEqual(cleanFilename)
    // Virus scanning may already be complete
    expect(['pending', 'ready']).toContain(uploadStatus)
    expect(['pending', 'complete']).toContain(file.fileStatus)
  })

  it('should scan file as clean', async () => {
    const { uploadId, statusUrl } = await initiateUpload(initiateRequest)
    const statusCode = await fileUpload(uploadId, cleanFilename)
    expect(statusCode).toEqual(302)

    const { isUploadReady } = await uploadEventuallyReady(statusUrl)
    expect(isUploadReady).toBeTruthy()

    const status = await getStatus(statusUrl)
    expect(status).toMatchObject({
      uploadStatus: 'ready',
      form: {
        field1: 'val1',
        field2: 'val2',
        field3: ['val3', 'val4'],
        field4: '',
        file: {
          fileStatus: 'complete',
          filename: cleanFilename,
          contentType: 'text/plain',
          contentLength: 55,
          checksumSha256: 'dk5WkxTM9CK4wW3t7HSxOVZbtFad1eamKYhEBRkbkFs='
        }
      }
    })
  })

  it('should reject file as infected', async () => {
    const { uploadId, statusUrl } = await initiateUpload(initiateRequest)
    const statusCode = await fileUpload(uploadId, virusFilename)
    expect(statusCode).toEqual(302)

    const { isUploadReady } = await uploadEventuallyReady(statusUrl)
    expect(isUploadReady).toBeTruthy()

    const status = await getStatus(statusUrl)

    expect(status).toMatchObject({
      uploadStatus: 'ready',
      form: {
        field1: 'val1',
        field2: 'val2',
        field3: ['val3', 'val4'],
        field4: '',
        file: {
          filename: virusFilename,
          contentType: 'text/plain',
          fileStatus: 'rejected',
          contentLength: 68,
          checksumSha256: 'J1oCG7+2SJ5U1HGJn3250WY/xpXsL+KixFOKq/ZR/Q8=',
          hasError: true,
          errorMessage: 'The selected file contains a virus'
        }
      },
      numberOfRejectedFiles: 1
    })
  })
})
