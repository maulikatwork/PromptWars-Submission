import { describe, expect, it } from 'vitest'
import { errorHandler } from './errorHandler'

function createMockResponse() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }

  return response
}

describe('errorHandler', () => {
  it('maps CastError to a 400 invalid identifier response', () => {
    const res = createMockResponse()
    const castError = { name: 'CastError', message: 'Cast to ObjectId failed' }

    errorHandler(castError, {} as never, res as never, () => undefined)

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid identifier' })
  })

  it('maps ValidationError to a 400 response with field details', () => {
    const res = createMockResponse()
    const validationError = {
      name: 'ValidationError',
      errors: {
        name: { message: 'Name cannot be empty', path: 'name' },
      },
    }

    errorHandler(validationError, {} as never, res as never, () => undefined)

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'Name cannot be empty', field: 'name' })
  })

  it('returns a generic message in production for unexpected errors', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const res = createMockResponse()
    errorHandler(new Error('database exploded'), {} as never, res as never, () => undefined)

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Something went wrong' })

    process.env.NODE_ENV = originalEnv
  })
})
