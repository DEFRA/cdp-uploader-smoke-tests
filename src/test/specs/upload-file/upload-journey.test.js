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
  uploadRequest.append('file1', file, filename)

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
      form: { file1 }
    } = await getStatus(statusUrl)

    expect(uploadStatus).toBeDefined()
    expect(file1.fileStatus).toBeDefined()
    expect(file1.fileId).toBeTruthy()
    expect(file1.filename).toEqual(cleanFilename)
    // Virus scanning may already be complete
    expect(['pending', 'ready']).toContain(uploadStatus)
    expect(['pending', 'complete']).toContain(file1.fileStatus)
  })

  it('should scan file as clean', async () => {
    const { uploadId, statusUrl } = await initiateUpload(initiateRequest)
    const statusCode = await fileUpload(uploadId, cleanFilename)
    expect(statusCode).toEqual(302)

    const { isUploadReady } = await uploadEventuallyReady(statusUrl)
    expect(isUploadReady).toBeTruthy()
    const {
      uploadStatus,
      form: { file1 }
    } = await getStatus(statusUrl)
    expect(uploadStatus).toEqual('ready')
    expect(file1.fileStatus).toEqual('complete')
  })

  it('should reject file as infected', async () => {
    const { uploadId, statusUrl } = await initiateUpload(initiateRequest)
    const statusCode = await fileUpload(uploadId, virusFilename)
    expect(statusCode).toEqual(302)

    const { isUploadReady } = await uploadEventuallyReady(statusUrl)
    expect(isUploadReady).toBeTruthy()
    const {
      uploadStatus,
      form: { file1 },
      numberOfRejectedFiles
    } = await getStatus(statusUrl)
    expect(uploadStatus).toEqual('ready')
    expect(file1.fileStatus).toEqual('rejected')
    expect(file1.hasError).toEqual(true)
    expect(numberOfRejectedFiles).toBe(1)
  })
})
