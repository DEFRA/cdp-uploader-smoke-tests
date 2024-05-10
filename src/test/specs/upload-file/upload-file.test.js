import request from 'supertest'
import { validate } from 'uuid'

import { config } from '~/src/config'

const uploaderBaseUrl = config.get('uploaderBaseUrl')

describe('Initiate upload', () => {
  it('should initiate a new upload', async () => {
    await request(uploaderBaseUrl)
      .post('/initiate')
      .send({
        redirect: 'http://httpstat.us/200',
        destinationBucket: 'my-bucket',
        destinationPath: 'my-uploads'
      })
      .then((response) => {
        expect(response.statusCode).toEqual(200)
        const body = response.body
        expect(body.uploadId).toBeDefined()
        expect(body).toHaveProperty('uploadAndScanUrl')
        expect(body).toHaveProperty('statusUrl')
        expect(validate(body.uploadId)).toBeTruthy()
        expect(body.uploadAndScanUrl).toMatch(
          `${uploaderBaseUrl}/upload-and-scan/${body.uploadId}`
        )
        expect(body.statusUrl).toMatch(
          `${uploaderBaseUrl}/status/${body.uploadId}`
        )
      })
  })
})
