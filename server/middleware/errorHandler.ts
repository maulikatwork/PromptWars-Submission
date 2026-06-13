import type { ErrorRequestHandler } from 'express'
import { mapMongooseValidationError } from './validate'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error && typeof error === 'object' && 'name' in error && error.name === 'CastError') {
    res.status(400).json({ error: 'Invalid identifier' })
    return
  }

  if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
    const response = mapMongooseValidationError(
      error as { errors: Record<string, { message: string; path?: string }> },
    )
    res.status(400).json(response)
    return
  }

  console.error(error)

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Something went wrong' })
    return
  }

  const message = error instanceof Error ? error.message : 'Something went wrong'
  res.status(500).json({ error: message })
}
