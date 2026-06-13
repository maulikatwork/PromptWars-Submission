import type { Request, Response, NextFunction } from 'express'

// MVP internal testing only: validates X-User-ID format, not identity or access rights.
// Real authentication is deferred until post-MVP.
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidUuidV4(value: string): boolean {
  return UUID_V4_REGEX.test(value)
}

export function validateUserId(req: Request, res: Response, next: NextFunction): void {
  const userId = req.header('X-User-ID')

  if (!userId || !isValidUuidV4(userId)) {
    res.status(400).json({ error: 'Invalid or missing X-User-ID header' })
    return
  }

  next()
}
